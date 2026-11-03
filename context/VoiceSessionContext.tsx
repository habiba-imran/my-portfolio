"use client";

import Script from "next/script";
import { ParticipantKind, Room, RoomEvent, Track, type RemoteTrack } from "livekit-client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { conversationPhase, friendlyVoiceError, type VoicePhase } from "../lib/voice-ui";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      execute: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}
type Session = { sessionId: string; sessionKey: string };
type Verification = { resolve: (token: string) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> };
class VoiceStartError extends Error {}

export const RECONNECT_GRACE_MS = 30_000;
const RETRY_PAUSE_MS = 15_000;
const UNCERTAIN_START = "The start request didn’t finish. If a conversation was created, it may still be closing. Please wait a moment before trying again.";
const VoiceSessionContext = createContext<VoiceSessionValue | null>(null);

type VoiceSessionValue = {
  phase: VoicePhase;
  muted: boolean;
  error: string;
  audioBlocked: boolean;
  cleanupPending: boolean;
  muteBusy: boolean;
  protectionConfigured: boolean;
  retryBlocked: boolean;
  remainingSeconds: number | null;
  inlineVisible: boolean;
  registerInline: (node: HTMLDivElement | null) => void;
  startCall: () => void;
  endCall: (reason?: string) => Promise<void>;
  toggleMute: () => Promise<void>;
  enableAudio: () => Promise<void>;
};

export function useVoiceSession() {
  const session = useContext(VoiceSessionContext);
  if (!session) throw new Error("Voice controls require the root VoiceSessionProvider.");
  return session;
}

export function VoiceSessionProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<VoicePhase>("ready");
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [cleanupPending, setCleanupPending] = useState(false);
  const [muteBusy, setMuteBusy] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [retryBlocked, setRetryBlocked] = useState(false);
  const [inlineVisible, setInlineVisible] = useState(false);
  const visual = useRef<HTMLDivElement | null>(null);
  const inlineObserver = useRef<IntersectionObserver | null>(null);
  const clock = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const reconnectDeadline = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const retryPause = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const retryUntil = useRef(0);
  const releaseOperation = useRef<Promise<boolean> | null>(null);
  const endOperation = useRef<Promise<void> | null>(null);
  const widgetContainer = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const verification = useRef<Verification | null>(null);
  const securityScriptFailed = useRef(false);
  const roomRef = useRef<Room | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const operation = useRef<Promise<void> | null>(null);
  const provisioning = useRef<Promise<unknown> | null>(null);
  const uncertainAdmission = useRef(false);
  const mounted = useRef(true);
  const ending = useRef(false);
  const attempt = useRef(0);
  const heartbeat = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const deadline = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const meter = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const audioElements = useRef<HTMLMediaElement[]>([]);
  const acknowledgePlayback = useRef<((elements: HTMLMediaElement[]) => void) | null>(null);
  const protectionConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const settleVerification = useCallback((token?: string) => {
    const pending = verification.current;
    verification.current = null;
    if (!pending) return;
    clearTimeout(pending.timer);
    if (token) pending.resolve(token);
    else pending.reject(new VoiceStartError("We couldn’t complete the quick security check. Please try again."));
  }, []);

  const renderSecurity = useCallback(() => {
    if (!widgetContainer.current || !window.turnstile || widgetId.current !== undefined) return;
    securityScriptFailed.current = false;
    widgetId.current = window.turnstile.render(widgetContainer.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      action: "voice_session",
      execution: "execute",
      appearance: "interaction-only",
      theme: "auto",
      retry: "never",
      "refresh-expired": "manual",
      "response-field": false,
      callback: (token: string) => settleVerification(token),
      "expired-callback": () => settleVerification(),
      "timeout-callback": () => settleVerification(),
      "error-callback": () => { settleVerification(); return true; },
    });
    if (verification.current) window.turnstile.execute(widgetId.current);
  }, [settleVerification]);

  const getVerification = useCallback(() => new Promise<string>((resolve, reject) => {
    if (securityScriptFailed.current) {
      reject(new VoiceStartError("The quick check couldn’t load. Please refresh the page and try again."));
      return;
    }
    verification.current = { resolve, reject, timer: setTimeout(() => settleVerification(), 20_000) };
    if (widgetId.current !== undefined && window.turnstile) {
      window.turnstile.reset(widgetId.current);
      window.turnstile.execute(widgetId.current);
    } else renderSecurity();
  }), [renderSecurity, settleVerification]);

  const pauseRetry = useCallback(() => {
    retryUntil.current = Date.now() + RETRY_PAUSE_MS;
    setRetryBlocked(true);
    clearTimeout(retryPause.current);
    retryPause.current = setTimeout(() => {
      retryUntil.current = 0;
      if (mounted.current) setRetryBlocked(false);
    }, RETRY_PAUSE_MS);
  }, []);

  const releaseSession = useCallback((session: Session) => {
    if (releaseOperation.current) return releaseOperation.current;
    releaseOperation.current = (async () => {
      try {
        const response = await fetch("/api/voice/session/end", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(session), keepalive: true, signal: AbortSignal.timeout(12_000),
        });
        // A 404 can mean an invalid control key, not a deleted room. Only a
        // successful authenticated cleanup confirms that a new call is safe.
        if (!response.ok) return false;
        if (sessionRef.current === session) sessionRef.current = null;
        return true;
      } catch { return false; } // Signed lease cleanup remains the fallback.
      finally { releaseOperation.current = null; }
    })();
    return releaseOperation.current;
  }, []);

  const stopRoom = useCallback(() => {
    clearInterval(heartbeat.current);
    clearTimeout(deadline.current);
    clearInterval(meter.current);
    clearInterval(clock.current);
    clearTimeout(reconnectDeadline.current);
    heartbeat.current = undefined;
    deadline.current = undefined;
    meter.current = undefined;
    clock.current = undefined;
    reconnectDeadline.current = undefined;
    for (const element of audioElements.current) element.remove();
    audioElements.current = [];
    acknowledgePlayback.current = null;
    visual.current?.style.setProperty("--voice-level", "0");
    const room = roomRef.current;
    roomRef.current = null;
    if (room) {
      room.removeAllListeners();
      room.localParticipant.audioTrackPublications?.forEach((publication) => publication.track?.stop());
      void room.disconnect().catch(() => undefined);
    }
  }, []);

  const endCall = useCallback((reason?: string) => {
    if (endOperation.current) return endOperation.current;
    ending.current = true;
    attempt.current += 1;
    settleVerification();
    if (mounted.current) setPhase("ending");
    stopRoom();
    // Retain any in-flight creation response so its private control key can be
    // used to release the reservation. A cancelled attempt never connects.
    endOperation.current = (async () => {
      await provisioning.current?.catch(() => undefined);
      const session = sessionRef.current;
      const cleaned = session ? await releaseSession(session) : true;
      const uncertain = !session && uncertainAdmission.current;
      operation.current = null;
      if (mounted.current) {
        if (uncertain) pauseRetry();
        setMuted(false);
        setMuteBusy(false);
        setRemainingSeconds(null);
        setAudioBlocked(false);
        setCleanupPending(!cleaned);
        setPhase(cleaned && !reason && !uncertain ? "ready" : "error");
        setError(cleaned ? uncertain ? UNCERTAIN_START : reason ?? "" : "Your microphone is off. Your previous conversation is ending. Please wait a moment or retry closing it.");
      }
    })().finally(() => { ending.current = false; endOperation.current = null; });
    return endOperation.current;
  }, [pauseRetry, releaseSession, settleVerification, stopRoom]);

  useEffect(() => {
    mounted.current = true;
    renderSecurity();
    // App Router navigation keeps this layout mounted and never fires pagehide.
    // A refresh, tab close, or full-document navigation ends the call instead.
    const leavePage = () => { void endCall(); };
    const restorePage = (event: PageTransitionEvent) => {
      if (event.persisted && sessionRef.current) void endCall();
    };
    window.addEventListener("pagehide", leavePage);
    window.addEventListener("pageshow", restorePage);
    return () => {
      mounted.current = false;
      window.removeEventListener("pagehide", leavePage);
      window.removeEventListener("pageshow", restorePage);
      clearTimeout(retryPause.current);
      inlineObserver.current?.disconnect();
      void endCall();
      if (widgetId.current !== undefined) window.turnstile?.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, [endCall, renderSecurity]);

  const registerInline = useCallback((node: HTMLDivElement | null) => {
    inlineObserver.current?.disconnect();
    visual.current = node?.querySelector<HTMLDivElement>(".voice-orb-scene") ?? null;
    setInlineVisible(Boolean(node));
    if (!node || typeof IntersectionObserver === "undefined") return;
    inlineObserver.current = new IntersectionObserver(([entry]) => {
      setInlineVisible(entry.isIntersecting && entry.intersectionRatio >= 1);
    }, { threshold: [0, 1] });
    inlineObserver.current.observe(node.querySelector(".voice-call-actions") ?? node);
  }, []);

  function startCall() {
    if (operation.current || roomRef.current || ending.current || sessionRef.current || !protectionConfigured || Date.now() < retryUntil.current) return;
    const thisAttempt = ++attempt.current;
    uncertainAdmission.current = false;
    const current = () => mounted.current && thisAttempt === attempt.current;
    setError(""); setCleanupPending(false); setAudioBlocked(false); setPhase("verifying");
    let room: Room;
    let unlock: Promise<void>;
    try {
      room = new Room({ adaptiveStream: true, dynacast: true, disconnectOnPageLeave: false,
        reconnectPolicy: { nextRetryDelayInMs: ({ elapsedMs, retryCount }) => {
          const delay = [0, 1_000, 3_000, 5_000][retryCount];
          return delay !== undefined && elapsedMs + delay < RECONNECT_GRACE_MS ? delay : null;
        } },
      });
      roomRef.current = room;
      // Run synchronously in the click gesture, before waiting for verification.
      unlock = room.startAudio().catch(() => { if (current()) setAudioBlocked(true); });
    } catch {
      stopRoom();
      setPhase("error");
      setError("Voice conversations aren’t supported in this browser. Please try a recent browser with microphone access.");
      return;
    }
    operation.current = (async () => {
      try {
        await unlock;
        if (!current()) return;
        let details;
        for (let verificationAttempt = 0; verificationAttempt < 2; verificationAttempt++) {
          const turnstileToken = await getVerification();
          if (!current()) return;
          uncertainAdmission.current = true;
          const request = fetch("/api/voice/session", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ turnstileToken }), signal: AbortSignal.timeout(20_000),
          }).then(async (response) => {
            const body = await response.json();
            uncertainAdmission.current = !response.ok && ["agent_dispatch", "budget_commit"].includes(body.code);
            if (response.ok) sessionRef.current = { sessionId: body.sessionId, sessionKey: body.sessionKey };
            return { response, body };
          });
          provisioning.current = request;
          const { response, body } = await request;
          provisioning.current = null;
          details = body;
          if (response.ok) {
            break;
          }
          if (!current()) return;
          if (response.status === 403 && details.code === "verification_failed" && verificationAttempt === 0) continue;
          if (details.code === "ONE_ACTIVE" || details.code === "BUSY") pauseRetry();
          throw new VoiceStartError(friendlyVoiceError(details.code, response.status));
        }
        if (!current()) return;
        setPhase("connecting");
        // Arm once, as soon as admission succeeds: microphone permission and
        // reconnect attempts cannot extend the server's five-minute deadline.
        const expiresAt = Math.min(details.expiresAt * 1000, Date.now() + 300_000);
        const updateTime = () => {
          if (current()) setRemainingSeconds(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
        };
        updateTime();
        clock.current = setInterval(updateTime, 1_000);
        deadline.current = setTimeout(() => void endCall(), Math.max(0, expiresAt - Date.now()));
        let connected = false;
        let playbackAcknowledged = false;
        let acknowledgingPlayback = false;
        const playableElements = new Set<HTMLMediaElement>();
        const acknowledge = () => {
          if (!current() || !connected || room.state !== "connected" || !room.canPlaybackAudio ||
              playableElements.size === 0 || playbackAcknowledged || acknowledgingPlayback) return;
          acknowledgingPlayback = true;
          void room.localParticipant.setAttributes({ "voiceagent.playback_ready": "true" })
            .then(() => { playbackAcknowledged = true; })
            .catch(() => {
              if (current()) setError("The conversation couldn’t get ready. Please end this call and try again.");
            })
            .finally(() => { acknowledgingPlayback = false; });
        };
        acknowledgePlayback.current = (elements) => {
          for (const element of elements) {
            if (audioElements.current.includes(element)) playableElements.add(element);
          }
          acknowledge();
        };
        const syncState = () => {
          if (!current() || !connected) return;
          const reconnecting = room.state === "reconnecting" || room.state === "signalReconnecting";
          if (reconnecting && reconnectDeadline.current === undefined) {
            reconnectDeadline.current = setTimeout(() => {
              if (current()) void endCall("The connection was lost. You can try starting a new conversation.");
            }, RECONNECT_GRACE_MS);
          } else if (!reconnecting) {
            clearTimeout(reconnectDeadline.current);
            reconnectDeadline.current = undefined;
          }
          acknowledge();
          const agents = [...room.remoteParticipants.values()].filter((participant) => participant.kind === ParticipantKind.AGENT);
          setMuted(!room.localParticipant.isMicrophoneEnabled);
          setPhase(conversationPhase(room.state, agents.length > 0, agents.some((agent) => agent.isSpeaking), room.localParticipant.isMicrophoneEnabled));
        };
        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _publication, participant) => {
          if (track.kind !== Track.Kind.Audio || participant.kind !== ParticipantKind.AGENT || !current()) return;
          const element = track.attach();
          element.setAttribute("aria-hidden", "true");
          document.body.appendChild(element);
          audioElements.current.push(element);
          void element.play().then(() => {
            if (!current() || !audioElements.current.includes(element)) return;
            playableElements.add(element);
            acknowledge();
          }).catch(() => { if (current()) setAudioBlocked(true); });
          syncState();
        });
        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          for (const element of track.detach()) {
            playableElements.delete(element);
            element.remove();
            audioElements.current = audioElements.current.filter((item) => item !== element);
          }
          syncState();
        });
        room.on(RoomEvent.ParticipantConnected, syncState);
        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
          if (participant.kind === ParticipantKind.AGENT && current() && room.state === "connected") void endCall();
        });
        room.on(RoomEvent.ActiveSpeakersChanged, syncState);
        room.on(RoomEvent.TrackMuted, syncState);
        room.on(RoomEvent.TrackUnmuted, syncState);
        room.on(RoomEvent.ConnectionStateChanged, syncState);
        room.on(RoomEvent.Reconnecting, syncState);
        room.on(RoomEvent.SignalReconnecting, syncState);
        room.on(RoomEvent.Reconnected, syncState);
        room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
          if (current()) { setAudioBlocked(!room.canPlaybackAudio); acknowledge(); }
        });
        room.on(RoomEvent.Disconnected, () => {
          if (current() && !ending.current) void endCall("The connection was lost. You can try starting a new conversation.");
        });
        await room.connect(details.serverUrl, details.participantToken, { websocketTimeout: 15_000, peerConnectionTimeout: 15_000 });
        if (!current()) { void room.disconnect().catch(() => undefined); return; }
        const microphone = await room.localParticipant.setMicrophoneEnabled(true);
        if (!current()) {
          microphone?.track?.stop();
          void room.disconnect().catch(() => undefined);
          return;
        }
        connected = true;
        syncState();
        const session = sessionRef.current!;
        let beating = false;
        heartbeat.current = setInterval(async () => {
          if (beating || !current()) return;
          beating = true;
          try {
            const response = await fetch("/api/voice/session/heartbeat", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify(session), signal: AbortSignal.timeout(10_000),
            });
            if (!response.ok) throw new Error("Lease unavailable");
          } catch {
            // During SDK recovery the 30-second grace remains shorter than the
            // signed lease. Do not tear down a recoverable call on one heartbeat.
            if (current() && reconnectDeadline.current === undefined) {
              void endCall("The conversation connection was interrupted. You can try starting a new conversation.");
            }
          }
          finally { beating = false; }
        }, 30_000);
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        meter.current = setInterval(() => {
          if (!current() || reducedMotion.matches) return;
          const agentLevel = Math.max(0, ...[...room.remoteParticipants.values()]
            .filter((participant) => participant.kind === ParticipantKind.AGENT).map((agent) => agent.audioLevel));
          const level = Math.max(agentLevel, room.localParticipant.isMicrophoneEnabled ? room.localParticipant.audioLevel : 0);
          visual.current?.style.setProperty("--voice-level", String(Math.min(1, Math.max(0, level))));
        }, 90);
      } catch (reason) {
        if (!current()) return;
        stopRoom();
        const session = sessionRef.current;
        const cleaned = session ? await releaseSession(session) : true;
        if (cleaned) sessionRef.current = null;
        if (!current()) return;
        setRemainingSeconds(null);
        setAudioBlocked(false);
        setMuted(false);
        setCleanupPending(!cleaned);
        if (!session && uncertainAdmission.current) pauseRetry();
        setPhase("error");
        const permissionError = reason instanceof Error && ["NotAllowedError", "PermissionDeniedError"].includes(reason.name);
        setError(!cleaned ? "Your microphone is off. Your previous conversation is ending. Please wait a moment or retry closing it."
          : !session && uncertainAdmission.current ? UNCERTAIN_START
          : permissionError ? "Your microphone is still off. Allow microphone access in your browser, then try again."
          : reason instanceof VoiceStartError ? reason.message : "The conversation couldn’t connect. Please try again in a moment.");
      } finally { if (thisAttempt === attempt.current) operation.current = null; }
    })();
  }

  async function toggleMute() {
    const room = roomRef.current;
    if (!room || muteBusy) return;
    setMuteBusy(true);
    try {
      const microphone = await room.localParticipant.setMicrophoneEnabled(!room.localParticipant.isMicrophoneEnabled);
      if (roomRef.current !== room) { microphone?.track?.stop(); return; }
      if (roomRef.current === room) {
        const agents = [...room.remoteParticipants.values()].filter((participant) => participant.kind === ParticipantKind.AGENT);
        setMuted(!room.localParticipant.isMicrophoneEnabled);
        setPhase(conversationPhase(room.state, agents.length > 0, agents.some((agent) => agent.isSpeaking), room.localParticipant.isMicrophoneEnabled));
      }
    } catch { if (mounted.current && roomRef.current === room) setError("Your microphone couldn’t change. Check your browser permissions and try again."); }
    finally { if (mounted.current && roomRef.current === room) setMuteBusy(false); }
  }

  async function enableAudio() {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.startAudio();
      const elements = [...audioElements.current];
      for (const element of elements) await element.play();
      if (mounted.current && roomRef.current === room) {
        setAudioBlocked(!room.canPlaybackAudio);
        acknowledgePlayback.current?.(elements);
      }
    } catch { if (mounted.current && roomRef.current === room) setError("Sound is still paused. Check your browser’s sound setting and try again."); }
  }

  return (
    <VoiceSessionContext.Provider value={{ phase, muted, error, audioBlocked, cleanupPending, muteBusy,
      protectionConfigured, retryBlocked, remainingSeconds, inlineVisible, registerInline,
      startCall, endCall, toggleMute, enableAudio }}>
      {children}
      {protectionConfigured && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive" onReady={renderSecurity} onError={() => { securityScriptFailed.current = true; settleVerification(); }} />}
      <div className="voice-verification voice-verification-host" ref={widgetContainer} />
    </VoiceSessionContext.Provider>
  );
}
