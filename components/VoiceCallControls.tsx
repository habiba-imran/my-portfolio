"use client";

import Script from "next/script";
import { ArrowUpRight, Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import { ParticipantKind, Room, RoomEvent, Track, type RemoteTrack } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { conversationPhase, friendlyVoiceError, voiceCopy, type VoicePhase } from "../lib/voice-ui";

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

export default function VoiceCallControls() {
  const [phase, setPhase] = useState<VoicePhase>("ready");
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [cleanupPending, setCleanupPending] = useState(false);
  const [muteBusy, setMuteBusy] = useState(false);
  const visual = useRef<HTMLDivElement>(null);
  const widgetContainer = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const verification = useRef<Verification | null>(null);
  const securityScriptFailed = useRef(false);
  const roomRef = useRef<Room | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const operation = useRef<Promise<void> | null>(null);
  const mounted = useRef(true);
  const ending = useRef(false);
  const attempt = useRef(0);
  const heartbeat = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const deadline = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const meter = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const audioElements = useRef<HTMLMediaElement[]>([]);
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

  const releaseSession = useCallback(async (session: Session) => {
    try {
      const response = await fetch("/api/voice/session/end", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session), keepalive: true, signal: AbortSignal.timeout(12_000),
      });
      return response.ok || response.status === 404;
    } catch { return false; } // The signed 75-second cleanup lease is the fallback.
  }, []);

  const stopRoom = useCallback(() => {
    clearInterval(heartbeat.current);
    clearTimeout(deadline.current);
    clearInterval(meter.current);
    heartbeat.current = undefined;
    deadline.current = undefined;
    meter.current = undefined;
    for (const element of audioElements.current) element.remove();
    audioElements.current = [];
    visual.current?.style.setProperty("--voice-level", "0");
    const room = roomRef.current;
    roomRef.current = null;
    if (room) { room.removeAllListeners(); void room.disconnect(); }
  }, []);

  const endCall = useCallback(async () => {
    if (ending.current) return;
    ending.current = true;
    attempt.current += 1;
    settleVerification();
    if (mounted.current) setPhase("ending");
    stopRoom();
    // Retain any in-flight creation response so its private control key can be
    // used to release the reservation. A cancelled attempt never connects.
    await operation.current;
    const session = sessionRef.current;
    const cleaned = session ? await releaseSession(session) : true;
    if (cleaned) sessionRef.current = null;
    if (mounted.current) {
      setMuted(false);
      setCleanupPending(!cleaned);
      setPhase(cleaned ? "ready" : "error");
      setError(cleaned ? "" : "Your microphone is off. The conversation is still closing; please give it a moment or retry.");
    }
    ending.current = false;
  }, [releaseSession, settleVerification, stopRoom]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      void endCall();
      if (widgetId.current !== undefined) window.turnstile?.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, [endCall]);

  function startCall() {
    if (operation.current || roomRef.current || ending.current || sessionRef.current || !protectionConfigured) return;
    const thisAttempt = ++attempt.current;
    const current = () => mounted.current && thisAttempt === attempt.current;
    setError(""); setCleanupPending(false); setAudioBlocked(false); setPhase("verifying");
    let room: Room;
    let unlock: Promise<void>;
    try {
      room = new Room({ adaptiveStream: true, dynacast: true });
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
          const response = await fetch("/api/voice/session", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ turnstileToken }), signal: AbortSignal.timeout(20_000),
          });
          details = await response.json();
          if (response.ok) {
            sessionRef.current = { sessionId: details.sessionId, sessionKey: details.sessionKey };
            break;
          }
          if (!current()) return;
          if (response.status === 403 && details.code === "verification_failed" && verificationAttempt === 0) continue;
          throw new VoiceStartError(friendlyVoiceError(details.code, response.status));
        }
        if (!current()) return;
        setPhase("connecting");
        let connected = false;
        const syncState = () => {
          if (!current() || !connected) return;
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
          void element.play().catch(() => { if (current()) setAudioBlocked(true); });
          syncState();
        });
        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          for (const element of track.detach()) {
            element.remove();
            audioElements.current = audioElements.current.filter((item) => item !== element);
          }
          syncState();
        });
        room.on(RoomEvent.ParticipantConnected, syncState);
        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
          if (participant.kind === ParticipantKind.AGENT && current()) void endCall();
        });
        room.on(RoomEvent.ActiveSpeakersChanged, syncState);
        room.on(RoomEvent.TrackMuted, syncState);
        room.on(RoomEvent.TrackUnmuted, syncState);
        room.on(RoomEvent.ConnectionStateChanged, syncState);
        room.on(RoomEvent.AudioPlaybackStatusChanged, () => { if (current()) setAudioBlocked(!room.canPlaybackAudio); });
        room.on(RoomEvent.Disconnected, () => { if (current() && !ending.current) void endCall(); });
        await room.connect(details.serverUrl, details.participantToken, { websocketTimeout: 15_000, peerConnectionTimeout: 15_000 });
        if (!current()) return;
        const microphone = await room.localParticipant.setMicrophoneEnabled(true);
        if (!current()) {
          microphone?.track?.stop();
          void room.disconnect();
          return;
        }
        connected = true;
        syncState();
        const session = sessionRef.current!;
        deadline.current = setTimeout(() => void endCall(), Math.max(0, details.expiresAt * 1000 - Date.now()));
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
          } catch { if (current()) void endCall(); }
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
        setCleanupPending(!cleaned);
        setPhase("error");
        const permissionError = reason instanceof Error && ["NotAllowedError", "PermissionDeniedError"].includes(reason.name);
        setError(permissionError ? "Your microphone is still off. Allow microphone access in your browser, then try again."
          : reason instanceof VoiceStartError ? reason.message : "The conversation couldn’t connect. Please try again in a moment.");
      } finally { operation.current = null; }
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
    finally { if (mounted.current) setMuteBusy(false); }
  }

  async function enableAudio() {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.startAudio();
      for (const element of audioElements.current) await element.play();
      if (mounted.current && roomRef.current === room) setAudioBlocked(!room.canPlaybackAudio);
    } catch { if (mounted.current && roomRef.current === room) setError("Sound is still paused. Check your browser’s sound setting and try again."); }
  }

  const active = !["ready", "error"].includes(phase);
  const microphoneAvailable = ["waiting", "listening", "speaking", "muted"].includes(phase);
  const copy = voiceCopy[phase];
  return (
    <div className={`voice-call voice-call--${phase}`} data-voice-phase={phase}>
      {protectionConfigured && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive" onReady={renderSecurity} onError={() => { securityScriptFailed.current = true; settleVerification(); }} />}
      <div className="voice-orb-scene" ref={visual} aria-hidden="true">
        <span className="voice-orb-orbit voice-orb-orbit--outer" />
        <span className="voice-orb-orbit voice-orb-orbit--inner" />
        <div className="voice-orb"><span>hi<span className="voice-orb-period">.</span></span></div>
        <span className="voice-orb-spark">✳</span>
        <div className="voice-levels">{Array.from({ length: 17 }, (_, index) =>
          <i key={index} style={{ "--bar-weight": 0.3 + Math.sin(index / 16 * Math.PI) * 0.7 } as React.CSSProperties} />)}</div>
      </div>
      <div className="voice-call-status" role="status" aria-live="polite" aria-atomic="true">
        <span className="voice-call-indicator" aria-hidden="true" /><span>{copy.label}</span>
      </div>
      <p className="voice-call-invitation">{copy.text}</p>
      <div className="voice-verification" ref={widgetContainer} />
      <div className="voice-call-actions" role="group" aria-label="Voice conversation controls">
        {!active ? <button className="voice-call-start" type="button" disabled={!protectionConfigured || cleanupPending}
          onClick={startCall}><Mic size={18} aria-hidden="true" />{phase === "error" ? "Try talking again" : "Talk to me"}<ArrowUpRight size={17} aria-hidden="true" /></button>
          : <>
            <button type="button" className="voice-call-control" onClick={toggleMute} aria-pressed={muted}
              aria-label={muted ? "Unmute microphone" : "Mute microphone"} disabled={!microphoneAvailable || muteBusy}>
              {muted ? <MicOff size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}{muted ? "Unmute" : "Mute"}</button>
            <button type="button" className="voice-call-control voice-call-end" onClick={() => void endCall()} disabled={phase === "ending"}>
              <PhoneOff size={18} aria-hidden="true" />{["verifying", "connecting"].includes(phase) ? "Cancel" : "End call"}</button>
          </>}
      </div>
      {audioBlocked && active && phase !== "ending" && <button type="button" className="voice-call-retry" onClick={() => void enableAudio()}><Volume2 size={16} aria-hidden="true" />Tap to hear the conversation</button>}
      {error && <p className="voice-call-error" role="alert">{error}</p>}
      {cleanupPending && <button type="button" className="voice-call-retry" onClick={() => void endCall()}>Finish closing the conversation</button>}
      <p className="voice-call-note">{!protectionConfigured ? "Conversations are unavailable just now." : "Your mic stays off until you start. Up to 5 minutes, just for you."}</p>
      <a className="voice-privacy-link" href="/privacy">A note on privacy</a>
    </div>
  );
}
