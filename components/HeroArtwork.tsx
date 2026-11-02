"use client";
import { useState, type PointerEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import VoiceCallControls from "./VoiceCallControls";

export default function HeroArtwork() {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  function follow(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    setPointer({ x: ((event.clientX - box.left) / box.width - 0.5) * 12, y: ((event.clientY - box.top) / box.height - 0.5) * 12 });
  }
  return (
    <div className="hero-art hero-art--voice" onPointerMove={follow} onPointerLeave={() => setPointer({ x: 0, y: 0 })}
      style={{ "--pointer-x": `${pointer.x}px`, "--pointer-y": `${pointer.y}px` } as React.CSSProperties}>
      <div className="art-topline"><span>THE HUMAN INTERFACE</span><ArrowUpRight size={19} aria-hidden="true" /></div>
      <div className="art-composition" aria-hidden="true">
        <div className="art-disc" />
        <svg className="sound-sculpture" viewBox="0 0 480 460" fill="none">
          {Array.from({ length: 31 }, (_, i) => {
            const x = 48 + i * 12.8;
            const half = 24 + Math.pow(Math.sin((i / 30) * Math.PI), 1.4) * 142;
            return <path key={i} d={`M ${x} ${230 - half} C ${x - 58} ${230 - half * 0.3}, ${x + 58} ${230 + half * 0.3}, ${x} ${230 + half}`} stroke="currentColor" strokeWidth="2" />;
          })}
        </svg>
        <span className="art-hi">hi.</span><span className="art-star">✳</span>
      </div>
      <div className="art-bottomline art-bottomline--voice">
        <div className="art-live-copy"><span className="art-label">VOICE AGENT / LIVEKIT</span><p>Say hello.</p></div>
        <VoiceCallControls />
      </div>
    </div>
  );
}
