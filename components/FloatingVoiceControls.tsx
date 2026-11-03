"use client";

import { Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useVoiceSession } from "../context/VoiceSessionContext";
import { formatVoiceTime, voiceCopy } from "../lib/voice-ui";

export default function FloatingVoiceControls() {
  const { phase, muted, error, audioBlocked, cleanupPending, muteBusy, remainingSeconds,
    inlineVisible, endCall, toggleMute, enableAudio } = useVoiceSession();
  const active = !["ready", "error"].includes(phase);
  const visible = !inlineVisible && (active || cleanupPending);
  const dock = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = dock.current;
    if (!visible || !element) return;
    const updateSpace = () => {
      document.documentElement.style.setProperty("--voice-dock-height", `${element.offsetHeight + 36}px`);
    };
    const keepFocusVisible = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLElement) || element.contains(event.target)) return;
      const target = event.target.getBoundingClientRect();
      const overlay = element.getBoundingClientRect();
      if (target.bottom > overlay.top && target.top < overlay.bottom && target.right > overlay.left && target.left < overlay.right) {
        event.target.scrollIntoView({ block: "start", behavior: "instant" });
      }
    };
    updateSpace();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateSpace);
    observer?.observe(element);
    document.addEventListener("focusin", keepFocusVisible);
    return () => {
      observer?.disconnect();
      document.removeEventListener("focusin", keepFocusVisible);
      document.documentElement.style.removeProperty("--voice-dock-height");
    };
  }, [visible]);
  if (!visible) return null;
  const microphoneAvailable = ["waiting", "listening", "speaking", "muted"].includes(phase);

  return (
    <aside ref={dock} className={`voice-floating voice-call--${phase}`} aria-label="Ongoing voice conversation" data-voice-phase={phase}>
      <div className="voice-floating-heading">
        <div>
          <span className="voice-floating-title">A conversation with my AI</span>
          <div className="voice-call-status" role="status" aria-live="polite" aria-atomic="true">
            <span className="voice-call-indicator" aria-hidden="true" />
            <span>{cleanupPending ? "Conversation cleanup pending" : voiceCopy[phase].label}</span>
          </div>
        </div>
        {remainingSeconds !== null && <span className="voice-time" aria-label="Remaining conversation time">{formatVoiceTime(remainingSeconds)}</span>}
      </div>
      <div className="voice-call-actions" role="group" aria-label="Voice conversation controls">
        {!cleanupPending && <button type="button" className="voice-call-control" onClick={() => void toggleMute()}
          aria-pressed={muted} aria-label={muted ? "Unmute microphone" : "Mute microphone"} disabled={!microphoneAvailable || muteBusy}>
          {muted ? <MicOff size={17} aria-hidden="true" /> : <Mic size={17} aria-hidden="true" />}{muted ? "Unmute" : "Mute"}
        </button>}
        <button type="button" className="voice-call-control voice-call-end" onClick={() => void endCall()} disabled={phase === "ending"}>
          <PhoneOff size={17} aria-hidden="true" />{cleanupPending ? "Retry closing" : ["verifying", "connecting"].includes(phase) ? "Cancel" : "End call"}
        </button>
      </div>
      {audioBlocked && active && phase !== "ending" && <button type="button" className="voice-call-retry" onClick={() => void enableAudio()}>
        <Volume2 size={16} aria-hidden="true" />Tap to hear the conversation
      </button>}
      {error && <p className="voice-call-error" role="alert">{error}</p>}
    </aside>
  );
}
