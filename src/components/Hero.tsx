import { useRef, useEffect, useState, useCallback, memo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HolographicCode from './HolographicCode';

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
  }, [handleScrollUpdate]);

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center section-padding pt-20 md:pt-24 overflow-hidden">
      <HolographicCode />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full relative z-10">
        <div ref={contentRef} className="lg:col-span-7 flex flex-col justify-center">
          <div className="space-y-4 md:space-y-6">
            <p className="text-muted font-medium tracking-wide text-sm uppercase">
              Full Stack Developer
            </p>
            <h1 className="font-display text-display-xl text-foreground font-bold hover:text-accent hover:scale-[1.02] hover:drop-shadow-[0_0_20px_rgba(212,162,76,0.3)] transition-all duration-500 origin-left inline-block cursor-default">
              Habiba Imran
            </h1>
            <p className="text-base md:text-lg text-muted max-w-xl leading-relaxed">
              Building digital experiences with clean code and creative thinking.
              Passionate about full-stack development and emerging technologies.
            </p>
          </div>
        </div>

        <div ref={container3DRef} className="lg:col-span-5 relative">
          <div
            id="hero-image-container"
            className="w-full aspect-square md:aspect-[4/3] lg:aspect-square flex items-center justify-center relative"
          >
            <div className="profile-glow-ring w-[80%] max-w-[400px] aspect-square rounded-full overflow-hidden border-2 border-accent/30 shadow-2xl shadow-accent/10 relative group">
              <img 
                src="/pfp.jpeg" 
                alt="Habiba Imran Profile" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>


    </section>
  );
});

export default Hero;
