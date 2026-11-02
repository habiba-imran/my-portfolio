import { ArrowUpRight } from "lucide-react";
import VoiceCallControls from "./VoiceCallControls";

export default function HeroArtwork() {
  return (
    <div className="hero-art hero-art--voice">
      <div className="art-topline"><span>A CONVERSATION WITH MY AI</span><ArrowUpRight size={19} aria-hidden="true" /></div>
      <VoiceCallControls />
      <div className="voice-card-footnote"><span>A little more human.</span><span>Made by Habiba ↗</span></div>
    </div>
  );
}
