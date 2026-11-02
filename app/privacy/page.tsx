import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy | Habiba Imran",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <main className="container privacy-page">
    <Link href="/">← Back to the portfolio</Link>
    <h1>A note on privacy.</h1>
    <p>This portfolio includes an optional AI voice conversation. You choose whether to start it, and you can mute your microphone or end the conversation at any time.</p>
    <h2>A quiet security check</h2>
    <p>We use Cloudflare Turnstile to protect the voice demo from automated abuse. Turnstile processes browser and network signals to verify requests, including when its Invisible mode runs in the background. Cloudflare’s processing is described in the <a href="https://www.cloudflare.com/turnstile-privacy-policy/" target="_blank" rel="noreferrer noopener">Cloudflare Turnstile Privacy Addendum</a>.</p>
    <h2>When you choose to talk</h2>
    <p>Your microphone stays off until you start. Audio is transmitted through LiveKit and processed by the speech and AI providers behind the agent, including Deepgram, Groq and Cartesia, to produce a response. Please avoid sharing sensitive personal information. Conversations have a five-minute limit.</p>
    <h2>Keeping the demo available</h2>
    <p>The server stores temporary session state in Redis to secure access, manage active conversations and clean up rooms. Network addresses are pseudonymized with a server-side HMAC for the one-active-conversation-per-network safeguard. Aggregate daily reservations limit the demo’s maximum session time across all visitors. The demo does not use per-visitor daily attempt counters.</p>
    <p>For questions about this portfolio, contact <a href="mailto:habibaimrannn@gmail.com">habibaimrannn@gmail.com</a>.</p>
  </main>;
}
