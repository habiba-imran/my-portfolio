"use client";

import { Activity, MapPin, RadioTower, Route, Satellite, ShieldAlert } from 'lucide-react';

type ProjectVisualProps = {
  id: number;
  title: string;
  featured?: boolean;
};

export default function ProjectVisual({ id, title, featured = false }: ProjectVisualProps) {
  if (id === 1) {
    return (
      <div className="project-visual project-visual-voice h-full min-h-[240px] p-4" aria-label={`${title} visual placeholder`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RadioTower size={18} className="text-accent" aria-hidden="true" />
            <span className="text-xs uppercase tracking-[0.2em] text-accent">Live Agent</span>
          </div>
          <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-200">online</span>
        </div>
        <div className="mt-5 grid grid-cols-[0.9fr_1.1fr] gap-3">
          <div className="rounded-xl border border-white/10 bg-background/55 p-3">
            <div className="mb-4 h-20 rounded-lg bg-accent/15" />
            <div className="space-y-2">
              <span className="block h-2 rounded-full bg-white/15" />
              <span className="block h-2 w-3/4 rounded-full bg-white/10" />
              <span className="block h-2 w-1/2 rounded-full bg-accent/35" />
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-background/55 p-3">
            <div className="flex h-24 items-end gap-1.5">
              {Array.from({ length: featured ? 18 : 12 }).map((_, index) => (
                <span
                  key={index}
                  className="voice-bar flex-1 rounded-full bg-gradient-to-t from-accent-secondary to-accent"
                  style={{ height: `${18 + ((index * 13) % 54)}px`, animationDelay: `${index * 0.04}s` }}
                />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <span className="h-8 rounded-lg bg-accent/20" />
              <span className="h-8 rounded-lg bg-white/10" />
              <span className="h-8 rounded-lg bg-accent-secondary/20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === 2) {
    return (
      <div className="project-visual h-full min-h-[240px] p-4" aria-label={`${title} visual placeholder`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite size={18} className="text-accent" aria-hidden="true" />
            <span className="text-xs uppercase tracking-[0.2em] text-accent">Damage Scan</span>
          </div>
          <span className="text-xs text-muted">xBD</span>
        </div>
        <div className="mt-5 grid grid-cols-5 gap-1.5 rounded-xl border border-white/10 bg-background/45 p-2">
          {Array.from({ length: 35 }).map((_, index) => (
            <span
              key={index}
              className={`aspect-square rounded ${index % 7 === 0 || index % 11 === 0 ? 'bg-accent-secondary/70' : index % 5 === 0 ? 'bg-accent/50' : 'bg-white/10'}`}
            />
          ))}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <span className="block h-full w-[69%] rounded-full bg-gradient-to-r from-accent-secondary to-accent" />
        </div>
      </div>
    );
  }

  if (id === 3) {
    return (
      <div className="project-visual h-full min-h-[240px] p-4" aria-label={`${title} visual placeholder`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route size={18} className="text-accent" aria-hidden="true" />
            <span className="text-xs uppercase tracking-[0.2em] text-accent">Route Graph</span>
          </div>
          <span className="text-xs text-muted">Dijkstra</span>
        </div>
        <div className="relative mt-5 h-44 rounded-xl border border-white/10 bg-background/45">
          <span className="map-route route-a" />
          <span className="map-route route-b" />
          {[12, 28, 44, 61, 78].map((left, index) => (
            <span
              key={left}
              className="absolute flex h-7 w-7 items-center justify-center rounded-full border border-accent/40 bg-card text-accent"
              style={{ left: `${left}%`, top: `${18 + ((index * 19) % 54)}%` }}
            >
              <MapPin size={13} aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="project-visual h-full min-h-[240px] p-4" aria-label={`${title} visual placeholder`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-accent" aria-hidden="true" />
          <span className="text-xs uppercase tracking-[0.2em] text-accent">Response Grid</span>
        </div>
        <Activity size={16} className="text-accent" aria-hidden="true" />
      </div>
      <div className="mt-5 grid grid-cols-6 gap-1.5 rounded-xl border border-white/10 bg-background/45 p-2">
        {Array.from({ length: 36 }).map((_, index) => (
          <span
            key={index}
            className={`aspect-square rounded ${index === 8 || index === 15 || index === 27 ? 'bg-accent-secondary/80 shadow-[0_0_18px_rgba(177,73,39,0.4)]' : index % 4 === 0 ? 'bg-accent/35' : 'bg-white/10'}`}
          />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <span className="h-10 rounded-lg bg-accent/20" />
        <span className="h-10 rounded-lg bg-white/10" />
        <span className="h-10 rounded-lg bg-accent-secondary/20" />
      </div>
    </div>
  );
}
