"use client";
import { useEffect, useRef, memo } from 'react';
import { gsap } from 'gsap';
import { useTextReveal } from '../hooks/useTextReveal';
import { useSectionReveal } from '../hooks/useSectionReveal';
import SkillsConsole from './SkillsConsole';

function AnimatedHeadline({ children }: { children: string }) {
  const sectionRef = useTextReveal('.reveal-word', '#skills');
  const words = children.split(' ');

  return (
    <h2 id="skills-heading" ref={sectionRef} className="font-display text-display-lg text-foreground font-bold mt-4 hover:text-accent hover:drop-shadow-[0_0_20px_rgba(218,168,82,0.3)] transition-all duration-500 origin-left cursor-default" style={{ overflow: 'hidden' }}>
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

import { skillCategories } from '../lib/data';

const Skills = memo(function Skills() {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const marquee = marqueeRef.current;
    const track = trackRef.current;
    if (!marquee || !track) return;

    const totalWidth = track.scrollWidth / 2;

    animationRef.current = gsap.to(track, {
      x: -totalWidth,
      duration: 35,
      ease: 'none',
      repeat: -1,
    });

    const handleMouseEnter = () => {
      if (animationRef.current) {
        gsap.to(animationRef.current, { timeScale: 0.3, duration: 0.4, ease: 'power2.out' });
      }
      
      // Flash text to yellow sequentially on hover
      if (trackRef.current) {
        gsap.fromTo(
          trackRef.current.children,
          { color: 'rgb(218, 168, 82)' },
          { color: '', duration: 0.8, stagger: 0.02, ease: 'power2.out', overwrite: 'auto' }
        );
      }
    };

    const handleMouseLeave = () => {
      if (animationRef.current) {
        gsap.to(animationRef.current, { timeScale: 1, duration: 0.4, ease: 'power2.out' });
      }
    };

    marquee.addEventListener('mouseenter', handleMouseEnter);
    marquee.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      marquee.removeEventListener('mouseenter', handleMouseEnter);
      marquee.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, []);

  const allSkills = skillCategories.flatMap(cat => cat.skills);
  const revealRef = useSectionReveal<HTMLElement>();

  return (
    <section id="skills" ref={revealRef} className="section-padding py-section bg-card/30 overflow-hidden" aria-labelledby="skills-heading">
      <div className="max-w-6xl">
        <div className="mb-6 md:mb-8">
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            Skills
          </span>
          <AnimatedHeadline>What I Work With</AnimatedHeadline>
        </div>

        <div className="mb-12 md:mb-16">
          <SkillsConsole />
        </div>
      </div>

      <div
        ref={marqueeRef}
        className="relative select-none group"
        style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}
        aria-hidden="true"
      >
        <div ref={trackRef} className="marquee-track flex gap-6 md:gap-8 w-max">
          {[...allSkills, ...allSkills].map((skill, i) => (
            <span
              key={i}
              className="px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-display font-medium text-muted/30 whitespace-nowrap group-hover:text-muted/50 transition-colors duration-300"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
});

export default Skills;

