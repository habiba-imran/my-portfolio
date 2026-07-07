"use client";

import { BrainCircuit, Layers3, PhoneCall, Sparkles } from 'lucide-react';

const items = [
  { label: 'Realtime Voice', value: 'STT - LLM - TTS', icon: PhoneCall },
  { label: 'Full Stack', value: 'Dashboards + APIs', icon: Layers3 },
  { label: 'Applied AI', value: 'Scoring + Reports', icon: BrainCircuit },
  { label: 'Open To', value: 'Software / AI Roles', icon: Sparkles },
];

export default function ImpactStrip() {
  return (
    <section className="section-padding relative z-10 pb-12 pt-2 md:pb-16">
      <div className="impact-strip mx-auto grid max-w-6xl gap-3 rounded-2xl border border-white/10 bg-card/45 p-3 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="group rounded-xl border border-white/10 bg-background/42 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-accent/45 hover:bg-background/65">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-background">
                <Icon size={18} aria-hidden="true" />
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">{item.label}</p>
              <p className="mt-1 font-display text-base font-semibold text-foreground">{item.value}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
