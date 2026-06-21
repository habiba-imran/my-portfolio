"use client";
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const logo = logoRef.current;
    const counter = counterRef.current;

    if (!container || !logo || !counter) return;

    // Prevent scrolling during splash
    document.body.style.overflow = 'hidden';

    const tl = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = '';
        onComplete();
      }
    });

    // Animate the counter from 0 to 100 over 1.5 seconds
    tl.to({ value: 0 }, {
      value: 100,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: function () {
        setProgress(Math.round(this.targets()[0].value));
      }
    }, 0);

    // Fade in and gently scale the logo
    tl.fromTo(logo, 
      { opacity: 0, scale: 0.8 }, 
      { opacity: 1, scale: 1, duration: 1, ease: "power3.out" }, 
      0.2
    );

    // Hold for a tiny beat at 100%, then fade everything out
    tl.to(container, {
      opacity: 0,
      duration: 0.6,
      ease: "power2.inOut",
      delay: 0.2
    });

    return () => {
      document.body.style.overflow = '';
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background pointer-events-none"
    >
      <div className="flex flex-col items-center gap-8">
        {/* HI Logo representation */}
        <div 
          ref={logoRef}
          className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl md:rounded-3xl border border-border bg-card shadow-[0_0_40px_rgba(212,162,76,0.1)] flex items-center justify-center"
        >
          <span className="font-display font-bold text-4xl md:text-5xl text-accent tracking-tighter">
            HI
          </span>
        </div>
        
        {/* Loading Counter */}
        <div 
          ref={counterRef}
          className="font-display text-muted text-sm md:text-base font-medium tracking-widest"
        >
          {progress}%
        </div>
      </div>
    </div>
  );
}
