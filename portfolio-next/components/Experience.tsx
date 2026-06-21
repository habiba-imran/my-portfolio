"use client";
import { useTextReveal } from '../hooks/useTextReveal';

function AnimatedHeadline({ children }: { children: string }) {
  const sectionRef = useTextReveal('.reveal-word', '#experience');

  const words = children.split(' ');

  return (
    <h2 ref={sectionRef} className="font-display text-display-lg text-foreground font-bold mt-4 hover:text-accent hover:scale-[1.02] hover:drop-shadow-[0_0_20px_rgba(212,162,76,0.3)] transition-all duration-500 origin-left cursor-default" style={{ overflow: 'hidden' }}>
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
  return (
    <section id="experience" className="section-padding py-section bg-card/30 relative overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-4">
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            Experience
          </span>
          <AnimatedHeadline>My Journey</AnimatedHeadline>
        </div>

        <div className="lg:col-span-8 lg:col-start-6">
          <div className="relative border-l border-border pl-6 md:pl-8 space-y-12">
            {experiences.map((exp) => (
              <article key={exp.id} className="relative">
                <div className="absolute -left-[1.5625rem] md:-left-[1.875rem] w-3 h-3 bg-background border-2 border-accent rounded-full" />
                <div className="space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                    <h3 className="font-display text-lg text-foreground font-semibold">
                      {exp.title}
                    </h3>
                    <span className="text-sm text-muted">{exp.period}</span>
                  </div>
                  <p className="text-accent font-medium">{exp.company}</p>
                  <p className="text-muted leading-relaxed">{exp.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

