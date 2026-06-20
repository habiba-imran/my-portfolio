import { useRef, useEffect, useState, useCallback, memo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';
import HeroElement from './HeroElement';

gsap.registerPlugin(ScrollTrigger);

const Hero = memo(function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const container3DRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  const handleScrollUpdate = useCallback((self: ScrollTrigger) => {
    setScrollY(self.progress * window.innerHeight);
  }, []);

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
        onUpdate: handleScrollUpdate,
      },
    });

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [handleScrollUpdate]);

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center section-padding pt-20 md:pt-24 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full">
        <div ref={contentRef} className="lg:col-span-7 flex flex-col justify-center">
          <div className="space-y-4 md:space-y-6">
            <p className="text-muted font-medium tracking-wide text-sm uppercase">
              Computer Science Student
            </p>
            <h1 className="font-display text-display-xl text-foreground font-bold">
              Alex Chen
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-muted max-w-xl leading-relaxed">
              Building digital experiences with clean code and creative thinking.
              Passionate about full-stack development and emerging technologies.
            </p>
          </div>
        </div>

        <div ref={container3DRef} className="lg:col-span-5 relative">
          <div
            id="hero-3d-container"
            className="w-full aspect-square md:aspect-[4/3] lg:aspect-square bg-transparent relative"
            role="img"
            aria-label="Interactive 3D geometric decoration"
          >
            <HeroElement scrollY={scrollY} />
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-muted text-xs uppercase tracking-widest">Scroll</span>
        <ChevronDown size={18} className="text-muted animate-bounce" aria-hidden="true" />
      </div>
    </section>
  );
});

export default Hero;
