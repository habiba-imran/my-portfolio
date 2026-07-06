import { useEffect, useState } from 'react';
import { gsap } from 'gsap';

interface CursorState {
  x: number;
  y: number;
  isHovering: boolean;
}

export function useCursor() {
  const [cursorState, setCursorState] = useState<CursorState>({
    x: 0,
    y: 0,
    isHovering: false,
  });
  const cursorRef = { current: null as HTMLDivElement | null };

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const updateCursor = (e: MouseEvent) => {
      setCursorState(prev => ({
        ...prev,
        x: e.clientX,
        y: e.clientY,
      }));

      if (cursorRef.current) {
        gsap.to(cursorRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.15,
          ease: 'power2.out',
        });
      }
    };

    const handleMouseEnter = () => {
      setCursorState(prev => ({ ...prev, isHovering: true }));
    };

    const handleMouseLeave = () => {
      setCursorState(prev => ({ ...prev, isHovering: false }));
    };

    window.addEventListener('mousemove', updateCursor);

    const interactiveElements = document.querySelectorAll('a, button, [data-cursor-hover]');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      window.removeEventListener('mousemove', updateCursor);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);

  return { cursorState, cursorRef };
}
