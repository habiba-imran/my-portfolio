import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function useMagnetic(selector: string) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const elements = container.querySelectorAll<HTMLElement>(selector);

    const handleMouseMove = (e: MouseEvent, el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * 0.3;
      const deltaY = (e.clientY - centerY) * 0.3;

      gsap.to(el, {
        x: deltaX,
        y: deltaY,
        duration: 0.4,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = (el: HTMLElement) => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.4,
        ease: 'elastic.out(1, 0.5)',
      });
    };

    const moveHandlers: Array<{ el: HTMLElement; moveHandler: (e: MouseEvent) => void; leaveHandler: () => void }> = [];

    elements.forEach(el => {
      const moveHandler = (e: MouseEvent) => handleMouseMove(e, el);
      const leaveHandler = () => handleMouseLeave(el);

      el.addEventListener('mousemove', moveHandler);
      el.addEventListener('mouseleave', leaveHandler);

      moveHandlers.push({ el, moveHandler, leaveHandler });
    });

    return () => {
      moveHandlers.forEach(({ el, moveHandler, leaveHandler }) => {
        el.removeEventListener('mousemove', moveHandler);
        el.removeEventListener('mouseleave', leaveHandler);
      });
    };
  }, [selector]);

  return containerRef;
}
