"use client";
import { useState, type PointerEvent } from "react";
import { ArrowUpRight, Braces, AudioLines } from "lucide-react";
export default function HeroArtwork() {
  const [mode, setMode] = useState<"voice" | "code">("voice");
  function follow(event: PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--pointer-x",
      `${((event.clientX - box.left) / box.width - 0.5) * 12}px`,
    );
    event.currentTarget.style.setProperty(
      "--pointer-y",
      `${((event.clientY - box.top) / box.height - 0.5) * 12}px`,
    );
  }
  return (
    <div
      className={`hero-art hero-art--${mode}`}
      onPointerMove={follow}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty("--pointer-x", "0px");
        event.currentTarget.style.setProperty("--pointer-y", "0px");
      }}
    >
      <div className="art-topline">
        <span>THE HUMAN INTERFACE</span>
        <ArrowUpRight size={19} aria-hidden="true" />
      </div>
      <div className="art-composition" aria-hidden="true">
        <div className="art-disc" />
        <svg className="sound-sculpture" viewBox="0 0 480 460" fill="none">
          {Array.from({ length: 31 }, (_, i) => {
            const x = 48 + i * 12.8;
            const half = 24 + Math.pow(Math.sin((i / 30) * Math.PI), 1.4) * 142;
            return (
              <path
                key={i}
                d={
                  mode === "voice"
                    ? `M ${x} ${230 - half} C ${x - 58} ${230 - half * 0.3}, ${x + 58} ${230 + half * 0.3}, ${x} ${230 + half}`
                    : `M ${x} ${230 - half} L ${x} ${230 + half}`
                }
                stroke="currentColor"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        <span className="art-hi">{mode === "voice" ? "hi." : "{ }"}</span>
        <span className="art-star">✳</span>
      </div>
      <div className="art-bottomline">
        <div>
          <span className="art-label">
            {mode === "voice" ? "01 / CONVERSATION" : "02 / ENGINEERING"}
          </span>
          <p aria-live="polite">
            {mode === "voice" ? "Built to connect." : "Built to make sense."}
          </p>
        </div>
        <div
          className="art-switch"
          role="group"
          aria-label="Explore two sides of my work"
        >
          <button
            type="button"
            aria-label="Show voice artwork"
            aria-pressed={mode === "voice"}
            onClick={() => setMode("voice")}
          >
            <AudioLines size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Show code artwork"
            aria-pressed={mode === "code"}
            onClick={() => setMode("code")}
          >
            <Braces size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
