import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const isHoveringRef = useRef(false);
  const posXRef = useRef(0);
  const posYRef = useRef(0);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);

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
      isHoveringRef.current = true;
      gsap.to(ring, {
        width: 48,
        height: 48,
        borderWidth: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      isHoveringRef.current = false;
      gsap.to(ring, {
        width: 16,
        height: 16,
        borderWidth: 2,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const animate = () => {
      posXRef.current += (mouseXRef.current - posXRef.current) * 0.15;
      posYRef.current += (mouseYRef.current - posYRef.current) * 0.15;

      gsap.set(dot, { x: mouseXRef.current, y: mouseYRef.current });
      gsap.set(ring, { x: posXRef.current, y: posYRef.current });

      requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    requestAnimationFrame(animate);

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
      clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 bg-foreground rounded-full pointer-events-none z-[9998] hidden md:block"
        style={{ willChange: 'transform' }}
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-4 h-4 border-2 border-foreground/60 rounded-full pointer-events-none z-[9997] hidden md:block"
        style={{ willChange: 'transform' }}
      />
    </>
  );
}
