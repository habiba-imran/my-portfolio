export type VoicePhase = "ready" | "verifying" | "connecting" | "waiting" | "listening" | "speaking" | "muted" | "reconnecting" | "ending" | "error";

export function conversationPhase(connection: string, agentPresent: boolean, agentSpeaking: boolean, microphoneEnabled: boolean): VoicePhase {
  if (connection === "reconnecting" || connection === "signalReconnecting") return "reconnecting";
  if (connection !== "connected") return connection === "connecting" ? "connecting" : "error";
  if (!agentPresent) return "waiting";
  if (agentSpeaking) return "speaking";
  return microphoneEnabled ? "listening" : "muted";
}

export const voiceCopy: Record<VoicePhase, { label: string; text: string }> = {
  ready: { label: "Ready when you are", text: "A little conversation. A more human hello." },
  verifying: { label: "Getting things ready", text: "Just a moment. Your conversation is on its way." },
  connecting: { label: "Connecting", text: "Making a little room for our conversation." },
  waiting: { label: "Waiting for the agent", text: "You’re connected. Waiting for the agent to join." },
  listening: { label: "Listening", text: "Go ahead. Ask about my work, or just say hi." },
  speaking: { label: "Speaking", text: "The agent is talking. You can speak naturally." },
  muted: { label: "Microphone muted", text: "Take your time. Unmute whenever you’re ready." },
  reconnecting: { label: "Reconnecting", text: "Reconnecting to your conversation…" },
  ending: { label: "Ending the conversation", text: "Closing your microphone and conversation." },
  error: { label: "Let’s try that again", text: "Check the message below before trying again." },
};

export function friendlyVoiceError(code: string, status: number) {
  if (code === "ONE_ACTIVE") return "Another conversation is already active on this network. End it in its tab, or try again shortly.";
  if (code === "BUSY") return "A few conversations are happening right now. Try again in a moment.";
  if (code === "BUDGET") return "The voice demo is resting for now. You’re welcome to explore my work and try again later.";
  if (code === "verification_failed" || status === 403) return "We couldn’t complete the quick security check. Please try again.";
  return "I couldn’t start the conversation just now. Please try again in a moment.";
}

export function formatVoiceTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
