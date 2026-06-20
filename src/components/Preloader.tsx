import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const letterARef = useRef<HTMLSpanElement>(null);
  const letterCRef = useRef<HTMLSpanElement>(null);
  const [isExiting, setIsExiting] = useState(false);

  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current;

  const handleComplete = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);

    if (prefersReducedMotion || !containerRef.current) {
      onComplete();
      return;
    }

    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete,
    });
  }, [onComplete, isExiting, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      const timer = setTimeout(handleComplete, 500);
      return () => clearTimeout(timer);
    }

    const letterA = letterARef.current;
    const letterC = letterCRef.current;
    const logo = logoRef.current;

    if (!letterA || !letterC || !logo) {
      handleComplete();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(handleComplete, 400);
      },
    });

    gsap.set([letterA, letterC], {
      opacity: 0,
      y: 30,
      scale: 0.8,
    });

    tl.to(letterA, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      ease: 'power3.out',
    })
      .to(
        letterC,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: 'power3.out',
        },
        '-=0.4'
      )
      .to(
        logo,
        {
          scale: 1.1,
          duration: 0.3,
          ease: 'power2.inOut',
          yoyo: true,
          repeat: 1,
        },
        '-=0.2'
      );

    const timeout = setTimeout(() => {
      if (!isExiting) handleComplete();
    }, 1800);

    return () => clearTimeout(timeout);
  }, [handleComplete, isExiting, prefersReducedMotion]);

  const handleClick = () => {
    handleComplete();
  };

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      role="button"
      tabIndex={0}
      aria-label="Loading, click to skip"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-background cursor-pointer"
    >
      <div
        ref={logoRef}
        className="flex items-center gap-1 font-display text-5xl md:text-7xl font-bold text-foreground select-none"
      >
        <span
          ref={letterARef}
          className="inline-block text-accent"
          style={{ willChange: 'transform, opacity' }}
        >
          H
        </span>
        <span
          ref={letterCRef}
          className="inline-block"
          style={{ willChange: 'transform, opacity' }}
        >
          I
        </span>
      </div>
      <p className="absolute bottom-8 text-xs text-muted uppercase tracking-widest">
        Click to skip
      </p>
    </div>
  );
}
