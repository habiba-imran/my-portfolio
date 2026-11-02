"use client";

import Script from "next/script";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { ParticipantKind, Room, RoomEvent, Track, type RemoteTrack } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

type Phase = "idle" | "connecting" | "waiting" | "listening" | "speaking" | "reconnecting" | "error";
type Session = { sessionId: string; sessionKey: string };

export default function VoiceCallControls() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [muted, setMuted] = useState(false);
  const [challenge, setChallenge] = useState("");
  const [error, setError] = useState("");
  const [securityFailed, setSecurityFailed] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const widgetContainer = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const ending = useRef(false);
  const attempt = useRef(0);
  const heartbeat = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const deadlineTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const audioElements = useRef<HTMLElement[]>([]);
  const protectionConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const releaseSession = useCallback(async (session: Session) => {
    try {
      const response = await fetch("/api/voice/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session),
        keepalive: true,
      });
      return response.ok || response.status === 404;
    } catch {
      // The server lease and scheduled cleanup remain the fallback for a closed tab.
      return false;
    }
  }, []);

  const stopRoom = useCallback(() => {
    if (heartbeat.current) clearInterval(heartbeat.current);
    heartbeat.current = undefined;
    if (deadlineTimer.current) clearTimeout(deadlineTimer.current);
    deadlineTimer.current = undefined;
    for (const element of audioElements.current) element.remove();
    audioElements.current = [];
    const room = roomRef.current;
    roomRef.current = null;
    if (room) {
      room.removeAllListeners();
      void room.disconnect();
    }
  }, []);

  const endCall = useCallback(async () => {
    if (ending.current) return;
    ending.current = true;
    attempt.current += 1;
    stopRoom();
    const session = sessionRef.current;
    const cleaned = session ? await releaseSession(session) : true;
    if (cleaned) sessionRef.current = null;
    if (mounted.current) {
      setPhase(cleaned ? "idle" : "error");
      setMuted(false);
      if (cleaned) {
        setChallenge("");
        if (widgetId.current) window.turnstile?.reset(widgetId.current);
      }
      if (!cleaned) setError("Disconnected here; server cleanup is pending. Retry cleanup below.");
    }
    ending.current = false;
  }, [releaseSession, stopRoom]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      stopRoom();
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session) void releaseSession(session);
    };
  }, [releaseSession, stopRoom]);

  async function startCall() {
    if (!challenge || phase === "connecting") return;
    setError("");
    setAudioBlocked(false);
    setPhase("connecting");
    const thisAttempt = ++attempt.current;
    const turnstileToken = challenge;
    setChallenge("");
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;
    try {
      // Start during the click gesture so browsers can unlock remote audio playback.
      await room.startAudio();
      if (thisAttempt !== attempt.current) return;
      const response = await fetch("/api/voice/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnstileToken }),
      });
      const details = await response.json();
      if (!response.ok) throw new Error(details.error || "The voice session could not start.");
      const session: Session = { sessionId: details.sessionId, sessionKey: details.sessionKey };
      sessionRef.current = session;
      if (thisAttempt !== attempt.current) {
        const cleaned = await releaseSession(session);
        if (cleaned) sessionRef.current = null;
        else if (mounted.current) {
          setPhase("error");
          setError("Connection cancelled; server cleanup is pending. Retry cleanup below.");
        }
        return;
      }

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _publication, participant) => {
        if (track.kind !== Track.Kind.Audio || participant.kind !== ParticipantKind.AGENT) return;
        const element = track.attach();
        element.setAttribute("aria-hidden", "true");
        document.body.appendChild(element);
        audioElements.current.push(element);
        setPhase("speaking");
        void element.play().catch(() => {
          setAudioBlocked(true);
        });
      });
      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        for (const element of track.detach()) {
          element.remove();
          audioElements.current = audioElements.current.filter((item) => item !== element);
        }
        setPhase("listening");
      });
      room.on(RoomEvent.ParticipantConnected, (participant) => {
        if (participant.kind === ParticipantKind.AGENT) setPhase("listening");
      });
      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        if (participant.kind === ParticipantKind.AGENT) {
          setError("The voice agent left the conversation.");
          void endCall();
        }
      });
      room.on(RoomEvent.Reconnecting, () => setPhase("reconnecting"));
      room.on(RoomEvent.Reconnected, () => setPhase("listening"));
      room.on(RoomEvent.Disconnected, () => {
        if (!ending.current && mounted.current) {
          stopRoom();
          const oldSession = sessionRef.current;
          sessionRef.current = null;
          if (oldSession) void releaseSession(oldSession);
          setPhase("error");
          setError("The connection ended. Please start a new conversation.");
        }
      });

      await room.connect(details.serverUrl, details.participantToken);
      if (thisAttempt !== attempt.current) {
        stopRoom();
        const cleaned = await releaseSession(session);
        if (cleaned) sessionRef.current = null;
        return;
      }
      await room.localParticipant.setMicrophoneEnabled(true);
      if (!mounted.current) {
        stopRoom();
        await releaseSession(session);
        return;
      }
      setMuted(false);
      let agentConnected = false;
      room.remoteParticipants.forEach((participant) => {
        if (participant.kind === ParticipantKind.AGENT) agentConnected = true;
      });
      setPhase(agentConnected ? "listening" : "waiting");
      deadlineTimer.current = setTimeout(() => void endCall(), Math.max(0, details.expiresAt * 1000 - Date.now()));
      heartbeat.current = setInterval(async () => {
        try {
          const beat = await fetch("/api/voice/session/heartbeat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(session),
          });
          if (!beat.ok) throw new Error("Lease expired");
        } catch {
          ending.current = false;
          stopRoom();
          const cleaned = await releaseSession(session);
          if (cleaned) sessionRef.current = null;
          setPhase("error");
          setError(cleaned ? "Your session expired or lost its connection. Please reconnect." : "Your session expired; server cleanup is pending.");
        }
      }, 30_000);
    } catch (reason) {
      stopRoom();
      const session = sessionRef.current;
      if (thisAttempt !== attempt.current) {
        if (session && await releaseSession(session)) sessionRef.current = null;
        else if (session && mounted.current) {
          setPhase("error");
          setError("Connection cancelled; server cleanup is pending. Retry cleanup below.");
        }
        return;
      }
      if (session && await releaseSession(session)) sessionRef.current = null;
      setPhase("error");
      setError(reason instanceof Error ? reason.message : "Could not connect to the voice agent.");
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
    }
  }

  async function toggleMute() {
    const room = roomRef.current;
    if (!room) return;
    try {
      const nextMuted = !muted;
      await room.localParticipant.setMicrophoneEnabled(!nextMuted);
      setMuted(nextMuted);
    } catch {
      setError("Microphone access changed. Check your browser permissions and try again.");
    }
  }

  async function enableAudio() {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.startAudio();
      for (const element of audioElements.current) await (element as HTMLMediaElement).play();
      setAudioBlocked(false);
    } catch {
      setError("Audio is still blocked. Check your browser sound settings.");
    }
  }

  function retrySecurityCheck() {
    setSecurityFailed(false);
    setError("");
    setChallenge("");
    if (widgetId.current) window.turnstile?.reset(widgetId.current);
  }

  const active = phase === "connecting" || phase === "waiting" || phase === "listening" || phase === "speaking" || phase === "reconnecting";
  const label = phase === "connecting" ? "Connecting…" : phase === "waiting" ? "Waiting for the voice agent…" : phase === "reconnecting" ? "Reconnecting…" : phase === "listening" ? (muted ? "Microphone muted" : "Listening") : phase === "speaking" ? "The agent is speaking" : phase === "error" ? "Connection issue" : protectionConfigured ? "Verify to start" : "Demo setup required";

  return (
    <div className={`voice-call voice-call--${phase}`}>
      {protectionConfigured && <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => {
          if (!widgetContainer.current || !window.turnstile || widgetId.current) return;
          widgetId.current = window.turnstile.render(widgetContainer.current, {
            sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
            action: "voice_session",
            theme: "light",
            callback: (token: string) => {
              setSecurityFailed(false);
              setError("");
              setChallenge(token);
            },
            "expired-callback": () => {
              setChallenge("");
              setError("The security check expired. Please verify again.");
            },
            "timeout-callback": () => {
              setChallenge("");
              setSecurityFailed(true);
              setError("The security check timed out. Retry, or try a private window or another network.");
            },
            "error-callback": (code: string | number) => {
              setChallenge("");
              setSecurityFailed(true);
              setError(`The security check failed (${code}). Retry, or try a private window or another network.`);
              console.warn("[voice-demo] Turnstile verification failed", code);
              return true;
            },
          });
        }}
        onError={() => setError("The security check could not load. Please refresh and try again.")}
      />}
      <div className="voice-call-status" aria-live="polite" aria-atomic="true">
        <span className="voice-call-indicator" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div className="voice-challenge-wrap" aria-label="Visitor security check" hidden={active}>
        {protectionConfigured ? <div ref={widgetContainer} /> : <p className="voice-security-unavailable">Security verification isn’t configured yet.</p>}
      </div>
      <div className="voice-call-actions" role="group" aria-label="Voice conversation controls">
        {!active ? (
          <button className="voice-call-start" type="button" disabled={!challenge} onClick={startCall}>
            <Phone size={15} aria-hidden="true" />
            Start a conversation
          </button>
        ) : (
          <>
            {audioBlocked && <button type="button" className="voice-call-control" onClick={() => void enableAudio()}>Enable audio</button>}
            <button type="button" className="voice-call-control" onClick={toggleMute} aria-pressed={muted} disabled={phase === "connecting" || phase === "reconnecting"}>
              {muted ? <MicOff size={16} aria-hidden="true" /> : <Mic size={16} aria-hidden="true" />}
              {muted ? "Unmute" : "Mute"}
            </button>
            <button type="button" className="voice-call-control voice-call-end" onClick={() => void endCall()}>
              <PhoneOff size={16} aria-hidden="true" /> End
            </button>
          </>
        )}
      </div>
      {phase === "error" && error.includes("cleanup is pending") && <button type="button" className="voice-call-retry" onClick={() => void endCall()}>Retry server cleanup</button>}
      {securityFailed && !active && <button type="button" className="voice-call-retry" onClick={retrySecurityCheck}>Retry security check</button>}
      <p className="voice-call-note">Your mic turns on only after you start. Sessions end after 5 minutes.</p>
      {error && <p className="voice-call-error" role="alert">{error}</p>}
    </div>
  );
}
