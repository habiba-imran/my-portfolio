"use client";

import Image from 'next/image';
import { BrainCircuit, Code2, Mic, Radio, Volume2 } from 'lucide-react';

const pipeline = [
  { label: 'Caller', icon: Mic },
  { label: 'STT', icon: Radio },
  { label: 'LLM', icon: BrainCircuit },
  { label: 'TTS', icon: Volume2 },
];

const orbitItems = ['React', 'FastAPI', 'Twilio', 'LLM'];

export default function HeroShowcase() {
  return (
    <div className="hero-showcase relative mx-auto w-full max-w-[540px]">
      <div className="hero-orbit" aria-hidden="true" />
      <div className="hero-orbit hero-orbit--slow" aria-hidden="true" />

      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-card/70 p-4 shadow-[0_35px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(218,168,82,0.22),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(177,73,39,0.18),transparent_28%),radial-gradient(circle_at_50%_95%,rgba(242,204,128,0.12),transparent_30%)]" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/80 to-transparent" aria-hidden="true" />

        <div className="relative grid gap-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-background/55 p-3">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-accent/30 bg-background">
                <Image
                  src="/pfp.jpeg"
                  alt="Habiba Imran"
                  fill
                  priority
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-display text-base font-semibold text-foreground">Habiba Imran</p>
                <p className="text-xs text-muted">Full-stack + Voice AI</p>
              </div>
            </div>
            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
              online
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-background/55 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-accent">Voice Agent Runtime</p>
                <p className="mt-1 text-xs text-muted">Realtime STT - LLM - TTS flow</p>
              </div>
              <Code2 size={18} className="text-accent" aria-hidden="true" />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {pipeline.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.label}
                    className="runtime-step relative rounded-xl border border-white/10 bg-card/70 p-3 text-center"
                    style={{ animationDelay: `${index * 0.22}s` }}
                  >
                    <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <Icon size={16} aria-hidden="true" />
                    </div>
                    <p className="mt-2 text-[11px] font-semibold text-foreground">{step.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex h-16 items-center gap-1.5 overflow-hidden rounded-xl border border-white/10 bg-card/45 px-3">
              {Array.from({ length: 42 }).map((_, index) => (
                <span
                  key={index}
                  className="voice-bar h-8 flex-1 rounded-full bg-gradient-to-t from-accent-secondary/80 to-accent"
                  style={{
                    animationDelay: `${index * 0.035}s`,
                    height: `${18 + ((index * 19) % 40)}px`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {orbitItems.map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-background/55 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted">module</p>
                <p className="mt-1 font-display text-sm font-semibold text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
