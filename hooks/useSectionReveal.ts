import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useSectionReveal<T extends HTMLElement = HTMLElement>() {
  const sectionRef = useRef<T>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Start slightly lower and invisible
    gsap.set(section, { opacity: 0, y: 40 });

    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top 85%', // Trigger when the top of the section is 85% down the viewport
      onEnter: () => {
        gsap.to(section, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          clearProps: 'all' // Clean up inline styles after animation finishes
        });
      },
      once: true, // Only play once
    });

    return () => {
      st.kill();
    };
  }, []);

  return sectionRef;
}
