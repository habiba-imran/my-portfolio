"use client";

import { Bot, Braces, Cpu, Database, GitBranch, Wrench } from 'lucide-react';
import { skillCategories } from '../lib/data';

const icons = [Braces, Cpu, Bot, Database, Wrench, GitBranch];

export default function SkillsConsole() {
  return (
    <div className="skills-console grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-card/50 p-6 backdrop-blur-xl">
        <div className="skill-radar" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.22em] text-accent">Capability Map</p>
          <h3 className="mt-3 font-display text-2xl font-semibold text-foreground">Product engineering stack</h3>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            A visual map of the tools I use to move from interface to backend to AI workflow.
          </p>
        </div>
        <div className="absolute bottom-6 left-6 right-6 z-10 grid grid-cols-3 gap-2">
          {['UI', 'API', 'AI'].map((label) => (
            <div key={label} className="rounded-xl border border-white/10 bg-background/65 p-3 text-center">
              <p className="font-display text-lg font-semibold text-foreground">{label}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted">layer</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {skillCategories.map((category, index) => {
          const Icon = icons[index] ?? Cpu;
          return (
            <div key={category.title} className="group rounded-2xl border border-white/10 bg-card/48 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:bg-card/68">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon size={18} aria-hidden="true" />
                </div>
                <span className="text-xs text-muted">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="font-display text-base font-semibold text-foreground">{category.title}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {category.skills.slice(0, 5).map((skill) => (
                  <span key={skill} className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-xs text-muted group-hover:border-accent/25 group-hover:text-foreground">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
