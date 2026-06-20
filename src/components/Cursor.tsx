import { useEffect, useRef, memo } from 'react';
import { gsap } from 'gsap';

const Cursor = memo(function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const posXRef = useRef(0);
  const posYRef = useRef(0);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.body.classList.add('hide-cursor');

    gsap.set(dot, { xPercent: -50, yPercent: -50 });
    gsap.set(ring, { xPercent: -50, yPercent: -50 });

    const handleMouseMove = (e: MouseEvent) => {
      mouseXRef.current = e.clientX;
      mouseYRef.current = e.clientY;
    };

    const handleMouseEnter = () => {
      gsap.to(ring, {
        width: 48,
        height: 48,
        borderWidth: 1,
        duration: 0.25,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(ring, {
        width: 16,
        height: 16,
        borderWidth: 2,
        duration: 0.25,
        ease: 'power2.out',
      });
    };

    const animate = () => {
      posXRef.current += (mouseXRef.current - posXRef.current) * 0.1;
      posYRef.current += (mouseYRef.current - posYRef.current) * 0.1;

      gsap.set(dot, { x: mouseXRef.current, y: mouseYRef.current });
      gsap.set(ring, { x: posXRef.current, y: posYRef.current });

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    const timeout = setTimeout(() => {
      const interactiveElements = document.querySelectorAll('a, button, [data-cursor-hover]');
      interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', handleMouseEnter);
        el.addEventListener('mouseleave', handleMouseLeave);
      });
    }, 100);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.classList.remove('hide-cursor');
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(timeout);

      const interactiveElements = document.querySelectorAll('a, button, [data-cursor-hover]');
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 bg-foreground rounded-full pointer-events-none z-[9998] hidden md:block"
        style={{ willChange: 'transform' }}
        aria-hidden="true"
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-4 h-4 border-2 border-foreground/50 rounded-full pointer-events-none z-[9997] hidden md:block"
        style={{ willChange: 'transform' }}
        aria-hidden="true"
      />
    </>
  );
});

export default Cursor;
