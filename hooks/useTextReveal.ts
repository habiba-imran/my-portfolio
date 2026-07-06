import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useTextReveal(selector: string, trigger?: string) {
  const elementRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const words = element.querySelectorAll(selector);
    if (!words.length) return;

    gsap.set(words, { y: 40, opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: trigger ? document.querySelector(trigger) : element,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });

    tl.to(words, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.05,
      ease: 'power3.out',
    });

    return () => {
      tl.kill();
    };
  }, [selector, trigger]);

  return elementRef;
}
