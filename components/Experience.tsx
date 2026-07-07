"use client";
import { Briefcase, Building2, CalendarDays } from 'lucide-react';
import { useTextReveal } from '../hooks/useTextReveal';
import { useSectionReveal } from '../hooks/useSectionReveal';

function AnimatedHeadline({ children }: { children: string }) {
  const sectionRef = useTextReveal('.reveal-word', '#experience');

  const words = children.split(' ');

  return (
    <h2 ref={sectionRef} className="font-display text-display-lg text-foreground font-bold mt-4 hover:text-accent hover:drop-shadow-[0_0_20px_rgba(218,168,82,0.3)] transition-all duration-500 origin-left cursor-default" style={{ overflow: 'hidden' }}>
      <span className="inline-flex flex-wrap">
        {words.map((word, i) => (
          <span key={i} className="reveal-word inline-block mr-[0.25em]">
            {word}
          </span>
        ))}
      </span>
    </h2>
  );
}

import { experiences } from '../lib/data';

export default function Experience() {
  const revealRef = useSectionReveal<HTMLElement>();

  return (
    <section id="experience" ref={revealRef} className="section-padding py-section bg-card/30 relative overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-4">
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            Experience
          </span>
          <AnimatedHeadline>My Journey</AnimatedHeadline>
        </div>

        <div className="lg:col-span-8 lg:col-start-6">
          <div className="grid gap-5">
            {experiences.map((exp, index) => (
              <article key={exp.id} className="experience-card grid gap-5 rounded-2xl border border-white/10 bg-card/52 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl md:grid-cols-[0.72fr_1.28fr] md:p-6">
                <div className="relative min-h-[180px] overflow-hidden rounded-xl border border-white/10 bg-background/55 p-4">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(218,168,82,0.22),transparent_35%)]" aria-hidden="true" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Briefcase size={19} aria-hidden="true" />
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted">0{index + 1}</span>
                  </div>
                  <div className="relative mt-8 grid grid-cols-4 items-end gap-2">
                    {[58, 86, 42, 74].map((height, barIndex) => (
                      <span
                        key={height}
                        className="rounded-t-lg bg-gradient-to-t from-accent-secondary/50 to-accent/70"
                        style={{ height: `${height + index * 8 - barIndex * 3}px` }}
                      />
                    ))}
                  </div>
                  <div className="relative mt-5 grid grid-cols-2 gap-2">
                    <span className="h-8 rounded-lg bg-white/10" />
                    <span className="h-8 rounded-lg bg-accent/15" />
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                      <Building2 size={13} aria-hidden="true" />
                      {exp.company}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-muted">
                      <CalendarDays size={13} aria-hidden="true" />
                      {exp.period}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground md:text-2xl">
                    {exp.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">{exp.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

