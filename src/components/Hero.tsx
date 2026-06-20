import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';
import HeroElement from './HeroElement';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const container3DRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const hero = heroRef.current;
    const content = contentRef.current;
    const container3D = container3DRef.current;
    if (!hero || !content || !container3D) return;

    gsap.fromTo(
      content.children,
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
        delay: 0.2,
      }
    );

    gsap.fromTo(
      container3D,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        delay: 0.6,
      }
    );

    gsap.to(content, {
      y: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    gsap.to(container3D, {
      y: -30,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          setScrollY(self.progress * window.innerHeight);
        },
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center section-padding pt-20 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full">
        <div ref={contentRef} className="lg:col-span-7 flex flex-col justify-center">
          <div className="space-y-6">
            <p className="text-muted font-medium tracking-wide text-sm uppercase">
              Computer Science Student
            </p>
            <h1 className="font-display text-display-xl text-foreground font-bold">
              Alex Chen
            </h1>
            <p className="text-xl md:text-2xl text-muted max-w-xl leading-relaxed">
              Building digital experiences with clean code and creative thinking.
              Passionate about full-stack development and emerging technologies.
            </p>
          </div>
        </div>

        <div ref={container3DRef} className="lg:col-span-5 relative">
          <div
            id="hero-3d-container"
            className="w-full aspect-square md:aspect-[4/3] lg:aspect-square bg-transparent relative"
          >
            <HeroElement scrollY={scrollY} />
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-muted text-xs uppercase tracking-widest">Scroll</span>
        <ChevronDown size={20} className="text-muted animate-bounce" />
      </div>
    </section>
  );
}
