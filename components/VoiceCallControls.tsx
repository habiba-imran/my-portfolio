"use client";

import Link from "next/link";
import { ArrowUpRight, Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import { useVoiceSession } from "../context/VoiceSessionContext";
import { formatVoiceTime, voiceCopy } from "../lib/voice-ui";

export default function VoiceCallControls() {
  const { phase, muted, error, audioBlocked, cleanupPending, muteBusy, protectionConfigured,
    retryBlocked, remainingSeconds, registerInline, startCall, endCall, toggleMute, enableAudio } = useVoiceSession();
  const active = !["ready", "error"].includes(phase);
  const microphoneAvailable = ["waiting", "listening", "speaking", "muted"].includes(phase);
  const copy = voiceCopy[phase];
  return (
    <div ref={registerInline} className={`voice-call voice-call--${phase}`} data-voice-phase={phase}>
      <div className="voice-orb-scene" aria-hidden="true">
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
      <div className="voice-call-actions" role="group" aria-label="Voice conversation controls">
        {!active ? <button className="voice-call-start" type="button" disabled={!protectionConfigured || cleanupPending || retryBlocked}
          onClick={startCall}><Mic size={18} aria-hidden="true" />{phase === "error" ? "Try talking again" : "Talk to me"}<ArrowUpRight size={17} aria-hidden="true" /></button>
          : <>
            <button type="button" className="voice-call-control" onClick={toggleMute} aria-pressed={muted}
              aria-label={muted ? "Unmute microphone" : "Mute microphone"} disabled={!microphoneAvailable || muteBusy}>
              {muted ? <MicOff size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}{muted ? "Unmute" : "Mute"}</button>
            <button type="button" className="voice-call-control voice-call-end" onClick={() => void endCall()} disabled={phase === "ending"}>
              <PhoneOff size={18} aria-hidden="true" />{["verifying", "connecting"].includes(phase) ? "Cancel" : "End call"}</button>
          </>}
      </div>
      {remainingSeconds !== null && active && <p className="voice-time" aria-label="Remaining conversation time">{formatVoiceTime(remainingSeconds)} remaining</p>}
      {audioBlocked && active && phase !== "ending" && <button type="button" className="voice-call-retry" onClick={() => void enableAudio()}><Volume2 size={16} aria-hidden="true" />Tap to hear the conversation</button>}
      {error && <p className="voice-call-error" role="alert">{error}</p>}
      {cleanupPending && <button type="button" className="voice-call-retry" onClick={() => void endCall()}>Finish closing the conversation</button>}
      <p className="voice-call-note">{!protectionConfigured ? "Conversations are unavailable just now." : "Your mic stays off until you start. Up to 5 minutes, just for you."}</p>
      <Link className="voice-privacy-link" href="/privacy">A note on privacy</Link>
    </div>
  );
}
