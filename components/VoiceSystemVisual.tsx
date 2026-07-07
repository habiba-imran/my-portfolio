"use client";

import { BrainCircuit, Mic, Radio, Volume2 } from 'lucide-react';

const pipeline = [
  { label: 'Caller', detail: 'live audio', icon: Mic },
  { label: 'STT', detail: 'speech to text', icon: Radio },
  { label: 'LLM', detail: 'reasoning layer', icon: BrainCircuit },
  { label: 'TTS', detail: 'voice response', icon: Volume2 },
];

export default function VoiceSystemVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      <div className="absolute -inset-10 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/65 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(218,168,82,0.18),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(177,73,39,0.14),transparent_28%)]" aria-hidden="true" />
        <div className="relative flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-accent">Voice Agent Runtime</p>
            <p className="mt-1 text-sm text-muted">Realtime STT - LLM - TTS pipeline</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]" />
            online
          </div>
        </div>

        <div className="relative mt-5 grid gap-3">
          {pipeline.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.label}
                className="voice-node relative flex items-center gap-3 rounded-xl border border-white/10 bg-background/55 p-3"
                style={{ animationDelay: `${index * 0.18}s` }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
                  <Icon size={18} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-semibold text-foreground">{step.label}</p>
                  <p className="text-xs text-muted">{step.detail}</p>
                </div>
                <span className="text-xs font-medium text-accent/80">0{index + 1}</span>
              </div>
            );
          })}
        </div>

        <div className="relative mt-5 rounded-xl border border-white/10 bg-background/50 p-3">
          <div className="mb-3 flex items-center justify-between text-xs text-muted">
            <span>Audio stream</span>
            <span>42ms latency</span>
          </div>
          <div className="flex h-16 items-center gap-1.5 overflow-hidden">
            {Array.from({ length: 36 }).map((_, index) => (
              <span
                key={index}
                className="voice-bar h-6 flex-1 rounded-full bg-gradient-to-t from-accent-secondary/70 to-accent"
                style={{
                  animationDelay: `${index * 0.045}s`,
                  height: `${24 + ((index * 17) % 34)}px`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
