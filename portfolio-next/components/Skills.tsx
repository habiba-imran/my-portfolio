"use client";
import { useEffect, useRef, memo } from 'react';
import { gsap } from 'gsap';
import { useTextReveal } from '../hooks/useTextReveal';

function AnimatedHeadline({ children }: { children: string }) {
  const sectionRef = useTextReveal('.reveal-word', '#skills');
  const words = children.split(' ');

  return (
    <h2 id="skills-heading" ref={sectionRef} className="font-display text-display-lg text-foreground font-bold mt-4 hover:text-accent hover:scale-[1.02] hover:drop-shadow-[0_0_20px_rgba(212,162,76,0.3)] transition-all duration-500 origin-left cursor-default" style={{ overflow: 'hidden' }}>
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

    let currentDirection = 1;

    const handleMouseEnter = () => {
      if (animationRef.current) {
        gsap.to(animationRef.current, { timeScale: currentDirection * 0.3, duration: 0.4, ease: 'power2.out' });
      }
      
      // Flash text to yellow sequentially on hover
      if (trackRef.current) {
        gsap.fromTo(
          trackRef.current.children,
          { color: '#D4A24C' },
          { color: '', duration: 0.8, stagger: 0.02, ease: 'power2.out', overwrite: 'auto' }
        );
      }
    };

    const handleMouseLeave = () => {
      if (animationRef.current) {
        gsap.to(animationRef.current, { timeScale: currentDirection * 1, duration: 0.4, ease: 'power2.out' });
      }
    };

    const handleClick = () => {
      if (animationRef.current) {
        currentDirection *= -1;
        
        // Zippy burst in the new direction
        // Set immediately to high speed
        animationRef.current.timeScale(currentDirection * 8);
        
        // Then smoothly decelerate back to hover speed
        gsap.to(animationRef.current, {
          timeScale: currentDirection * 0.3, 
          duration: 1.5, 
          ease: 'power3.out',
          overwrite: true // Ensure it overrides any existing hover tweens
        });

      }
    };

    marquee.addEventListener('mouseenter', handleMouseEnter);
    marquee.addEventListener('mouseleave', handleMouseLeave);
    marquee.addEventListener('click', handleClick);

    return () => {
      marquee.removeEventListener('mouseenter', handleMouseEnter);
      marquee.removeEventListener('mouseleave', handleMouseLeave);
      marquee.removeEventListener('click', handleClick);
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, []);

  const allSkills = skillCategories.flatMap(cat => cat.skills);

  return (
    <section id="skills" className="section-padding py-section bg-card/30 overflow-hidden" aria-labelledby="skills-heading">
      <div className="max-w-6xl">
        <div className="mb-6 md:mb-8">
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            Skills
          </span>
          <AnimatedHeadline>What I Work With</AnimatedHeadline>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 gap-x-8 md:gap-x-12 mb-12 md:mb-16">
          {skillCategories.map((category) => (
            <div key={category.title} className="space-y-4 md:space-y-5 pl-6 border-l-2 border-border/50 hover:border-accent transition-colors duration-500 group">
              <h3 className="font-display text-base md:text-lg text-foreground font-semibold group-hover:text-accent transition-colors duration-300">
                {category.title}
              </h3>
              <ul className="flex flex-wrap gap-2" role="list">
                {category.skills.map((skill) => (
                  <li key={skill}>
                    <span className="px-3 md:px-4 py-1.5 md:py-2 bg-background/50 border border-border/50 rounded-full text-xs md:text-sm text-muted hover:text-foreground hover:border-accent/50 hover:shadow-[0_0_12px_rgba(212,162,76,0.15)] hover:scale-105 transition-all duration-200 inline-block cursor-default">
                      {skill}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div
        ref={marqueeRef}
        className="relative cursor-pointer select-none group"
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

