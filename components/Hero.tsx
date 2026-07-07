"use client";
import { useRef, useEffect, memo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroShowcase from './HeroShowcase';

gsap.registerPlugin(ScrollTrigger);

const Hero = memo(function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const container3DRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      if (contentRef.current) {
        gsap.set(contentRef.current.children, { opacity: 1, y: 0 });
      }
      if (container3DRef.current) {
        gsap.set(container3DRef.current, { opacity: 1, y: 0 });
      }
      return;
    }

    const hero = heroRef.current;
    const content = contentRef.current;
    const container3D = container3DRef.current;
    if (!hero || !content || !container3D) return;

    const tl = gsap.timeline();

    tl.fromTo(
      content.children,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.1,
      }
    );

    tl.fromTo(
      container3D,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power2.out',
      },
      '-=0.5'
    );

    gsap.to(content, {
      y: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
      },
    });

    gsap.to(container3D, {
      y: -30,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
      },
    });
    // Continuous gentle floating animation for the image
    const floatAnim = gsap.to(container3D, {
      y: '+=15',
      duration: 3,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

    // Mouse interactive parallax
    const handleMouseMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const moveX = (e.clientX - rect.left - centerX) / centerX;
      const moveY = (e.clientY - rect.top - centerY) / centerY;

      // Subtle shift for text
      gsap.to(content, {
        x: moveX * -20,
        rotateY: moveX * -2,
        duration: 1.5,
        ease: 'power2.out',
        transformPerspective: 1000
      });

      // 3D tilt and shift for image
      gsap.to(container3D, {
        x: moveX * 30,
        rotateX: moveY * -10,
        rotateY: moveX * 10,
        duration: 1.5,
        ease: 'power2.out',
        transformPerspective: 1000
      });
    };

    const handleMouseLeave = () => {
      gsap.to([content, container3D], {
        x: 0,
        rotateX: 0,
        rotateY: 0,
        duration: 1.5,
        ease: 'power2.out'
      });
    };

    hero.addEventListener('mousemove', handleMouseMove);
    hero.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      tl.kill();
      floatAnim.kill();
      hero.removeEventListener('mousemove', handleMouseMove);
      hero.removeEventListener('mouseleave', handleMouseLeave);
      gsap.killTweensOf([content, container3D]);
    };
  }, []);

  return (
    <section ref={heroRef} className="relative flex min-h-[calc(100vh+4rem)] items-center overflow-hidden section-padding pb-20 pt-28 md:pb-24 md:pt-36">
      <div className="hero-grid-bg" aria-hidden="true" />
      <div className="relative z-10 grid w-full grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div ref={contentRef} className="lg:col-span-7 flex flex-col justify-center">
          <div className="space-y-4 md:space-y-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(218,168,82,0.9)]" />
              Available for Software / AI Roles
            </div>
            <p className="text-muted font-medium tracking-wide text-sm uppercase">
              Software Engineer - Full Stack & Voice AI
            </p>
            <h1 className="hero-title font-display text-display-xl text-foreground font-bold transition-all duration-500 origin-left inline-block cursor-default">
              Habiba Imran
            </h1>
            <p className="text-base md:text-lg text-muted max-w-xl leading-relaxed">
              I build full-stack web apps and AI voice systems, from product dashboards
              and backend APIs to real-time STT, LLM, and TTS pipelines.
            </p>
            <p className="max-w-xl text-sm text-muted/80">
              Currently building AI voice and call intelligence products at Finova Solutions.
            </p>
            <div className="grid max-w-xl grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
              {[
                ['Focus', 'Voice AI systems'],
                ['Stack', 'React + FastAPI'],
                ['CGPA', '3.87 BSCS'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-card/55 px-4 py-3 backdrop-blur">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-accent/80">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="#projects"
                data-cursor-hover
                className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-background transition-colors duration-200 hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                View Projects
              </a>
              <a
                href="/Umm-e-Habiba-Imran-CV.pdf"
                target="_blank"
                rel="noopener noreferrer"
                data-cursor-hover
                className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors duration-200 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Download CV
              </a>
            </div>
          </div>
        </div>

        <div ref={container3DRef} className="lg:col-span-5 relative">
          <HeroShowcase />
        </div>
      </div>
    </section>
  );
});

export default Hero;
