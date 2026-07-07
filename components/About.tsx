"use client";
import { useRef, useEffect, memo } from 'react';
import { gsap } from 'gsap';
import { useTextReveal } from '../hooks/useTextReveal';
import { useSectionReveal } from '../hooks/useSectionReveal';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GraduationCap, BrainCircuit, Trophy, Award, Medal, Star } from 'lucide-react';
import { useSound } from '../context/SoundContext';

gsap.registerPlugin(ScrollTrigger);

function AnimatedHeadline({ children }: { children: string }) {
  const sectionRef = useTextReveal('.reveal-word', '#about');
  const words = children.split(' ');

  return (
    <h2 ref={sectionRef} className="font-display text-display-lg text-foreground font-bold mt-4 mb-8 md:mb-12 hover:text-accent hover:drop-shadow-[0_0_20px_rgba(218,168,82,0.3)] transition-all duration-500 origin-left cursor-default" style={{ overflow: 'hidden' }}>
      <span className="inline-flex flex-wrap">
        {words.map((word, i) => (
          <span key={i} className="reveal-word inline-block mr-[0.25em]">
            {word}
          </span>
        ))}
      </span>
    </h2>
  );
}

const BentoCard = memo(function BentoCard({
  children,
  className,
  title,
  icon: Icon
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ElementType;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const { playTick } = useSound();

  useEffect(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Continuous scroll-based flourish
    const tl = gsap.timeline({ paused: true });

    tl.fromTo(card, {
      rotateX: 6,
      scale: 0.96,
      transformPerspective: 1000,
    }, {
      rotateX: -6,
      scale: 1,
      ease: "none",
      duration: 1
    }, 0);

    tl.fromTo(glow, {
      opacity: 0,
    }, {
      opacity: 0.12,
      ease: "none",
      duration: 0.5
    }, 0).to(glow, {
      opacity: 0,
      ease: "none",
      duration: 0.5
    }, 0.5);

    const st = ScrollTrigger.create({
      trigger: card,
      start: "top bottom",
      end: "bottom top",
      animation: tl,
      scrub: 1,
    });

    const handleMouseMove = (e: MouseEvent) => {
      st.disable();
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Max rotation is 5 degrees to keep it subtle and premium
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      gsap.to(card, {
        rotateX: rotateX,
        rotateY: rotateY,
        scale: 1.02,
        boxShadow: "0 0 40px rgba(218,168,82,0.15)",
        transformPerspective: 1000,
        transformOrigin: "center center",
        ease: "power2.out",
        duration: 0.5
      });
      
      gsap.to(glow, {
        opacity: 1,
        ease: "power2.out",
        duration: 0.3
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        boxShadow: "0 0 0px rgba(218,168,82,0)",
        ease: "power3.out",
        duration: 0.7,
        onComplete: () => {
          st.enable();
        }
      });
      
      gsap.to(glow, {
        opacity: 0,
        ease: "power3.out",
        duration: 0.5
      });
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
      gsap.killTweensOf(card);
      gsap.killTweensOf(glow);
      st.kill();
      tl.kill();
    };
  }, []);

  return (
    <div 
      ref={cardRef}
      onMouseEnter={playTick}
      className={`group relative overflow-hidden rounded-xl bg-card/45 backdrop-blur-xl border border-white/10 hover:border-accent/40 transition-colors duration-500 p-8 md:p-10 hover:bg-card/65 ${className}`}
      style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
    >
      <div 
        ref={glowRef}
        className="absolute inset-0 opacity-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent transition-opacity duration-500" 
      />

      {title && Icon && (
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2.5 rounded-xl bg-background/50 border border-white/5 group-hover:border-accent/30 group-hover:bg-accent/10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
            <Icon className="w-5 h-5 text-accent" />
          </div>
          <h3 className="font-display font-semibold text-lg text-foreground tracking-wide">{title}</h3>
        </div>
      )}
      <div className="relative z-10 h-full flex flex-col">
        {children}
      </div>
    </div>
  );
});

export default function About() {
  const revealRef = useSectionReveal<HTMLElement>();

  return (
    <section id="about" ref={revealRef} className="section-padding py-section relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <span className="text-accent font-medium text-sm uppercase tracking-wider">
          About
        </span>
        <AnimatedHeadline>My Story</AnimatedHeadline>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[minmax(180px,auto)]">

          {/* Main Bio - Spans 2 columns, 2 rows */}
          <BentoCard className="md:col-span-2 md:row-span-2">
            <div className="space-y-6 text-base md:text-lg text-muted leading-relaxed">
              <p>
                I&apos;m a Computer Science student and software engineer focused on full-stack
                products, backend systems, and applied AI. I like turning complex ideas into
                usable tools, especially where real-time systems and human interaction meet.
              </p>
              <p>
                My recent work spans React dashboards, FastAPI/NestJS services, Twilio/LiveKit
                call flows, and LLM-powered evaluation pipelines. I care about systems that are
                clear to use, reliable in production, and thoughtful in the small details.
              </p>
            </div>
          </BentoCard>

          {/* Education - Spans 2 columns, 1 row */}
          <BentoCard title="Education" icon={GraduationCap} className="md:col-span-2">
            <div className="flex flex-col">
              <h4 className="text-xl md:text-2xl font-bold text-foreground mb-1">Bahria University</h4>
              <p className="text-accent font-medium mb-3">BS Computer Science</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted/80 mt-2">
                <span>CGPA: <strong>3.87</strong></span>
                <span>Expected Graduation: December 2027</span>
              </div>
            </div>
          </BentoCard>

          {/* Focus Area - Spans 2 columns, 1 row */}
          <BentoCard title="Voice AI" icon={BrainCircuit} className="md:col-span-2">
            <div className="flex flex-col">
              <p className="text-sm md:text-base text-muted leading-relaxed">
                Building real-time conversational AI pipelines with STT, LLM orchestration, TTS, LiveKit, and Twilio.
              </p>
            </div>
          </BentoCard>

          {/* Awards & Certificates - Spans 4 columns */}
          <BentoCard title="Awards & Certificates" icon={Trophy} className="md:col-span-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 rounded-lg bg-accent/10 text-accent"><Award size={16} /></div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">PM&apos;s Laptop Scheme 2025</h4>
                  <p className="text-xs text-muted">Selected Recipient, Phase IV</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 rounded-lg bg-accent/10 text-accent"><Medal size={16} /></div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">CodeQuest 2nd Position</h4>
                  <p className="text-xs text-muted">GDGOC x YOTA</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 rounded-lg bg-accent/10 text-accent"><Star size={16} /></div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">Merit Scholarship</h4>
                  <p className="text-xs text-muted">1st in 5th Sem, 2nd in 3rd Sem, 3rd in 2nd Sem</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 rounded-lg bg-accent/10 text-accent"><Award size={16} /></div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">IBM watsonx</h4>
                  <p className="text-xs text-muted">Technical Sales Intermediate</p>
                </div>
              </div>

            </div>
          </BentoCard>

        </div>
      </div>
    </section>
  );
}
