"use client";
import { useEffect, useRef, memo } from 'react';
import { gsap } from 'gsap';
import { FileText, Github, Linkedin, Mail, ArrowUpRight } from 'lucide-react';
import { useTextReveal } from '../hooks/useTextReveal';
import { useSectionReveal } from '../hooks/useSectionReveal';

function AnimatedHeadline({ children }: { children: string }) {
  const sectionRef = useTextReveal('.reveal-word', '#contact');
  const words = children.split(' ');

  return (
    <h2 id="contact-heading" ref={sectionRef} className="font-display text-display-lg text-foreground font-bold mt-4 mb-5 md:mb-6 hover:text-accent hover:drop-shadow-[0_0_20px_rgba(212,162,76,0.3)] transition-all duration-500 cursor-default" style={{ overflow: 'hidden' }}>
      <span className="inline-flex flex-wrap justify-center">
        {words.map((word, i) => (
          <span key={i} className="reveal-word inline-block mr-[0.25em]">
            {word}
          </span>
        ))}
      </span>
    </h2>
  );
}

const MagneticButton = memo(function MagneticButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const buttonRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * 0.3;
      const deltaY = (e.clientY - centerY) * 0.3;

      gsap.to(button, {
        x: deltaX,
        y: deltaY,
        duration: 0.35,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(button, {
        x: 0,
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
      });
    };

    button.addEventListener('mousemove', handleMouseMove);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      button.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseleave', handleMouseLeave);
      gsap.killTweensOf(button);
    };
  }, []);

  return (
    <span ref={buttonRef} className={className}>
      {children}
    </span>
  );
});

const Contact = memo(function Contact() {
  const revealRef = useSectionReveal<HTMLElement>();

  return (
    <section id="contact" ref={revealRef} className="section-padding py-section relative overflow-hidden" aria-labelledby="contact-heading">
      <div className="max-w-4xl mx-auto text-center">
        <span className="text-accent font-medium text-sm uppercase tracking-wider">
          Contact
        </span>
        <AnimatedHeadline>Let&apos;s Build Something Useful</AnimatedHeadline>
        <p className="text-base md:text-lg text-muted leading-relaxed mb-6 md:mb-8 max-w-2xl mx-auto">
          I&apos;m open to software engineering, full-stack, and AI product opportunities. If you&apos;re working on voice AI, developer tools, SaaS dashboards, or practical web products, I&apos;d be happy to connect.
        </p>

        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <MagneticButton className="inline-flex items-center w-full sm:w-auto">
              <a
                href="mailto:habibaimrannn@gmail.com"
                data-cursor-hover
                className="w-full justify-center group inline-flex items-center gap-3 px-7 md:px-8 py-3.5 md:py-4 bg-accent text-background font-semibold rounded-lg hover:bg-accent/90 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Mail size={18} aria-hidden="true" />
                <span>Email Me</span>
                <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200" aria-hidden="true" />
              </a>
            </MagneticButton>

            <MagneticButton className="inline-flex items-center w-full sm:w-auto">
              <a
                href="/Umm-e-Habiba-Imran-CV.pdf"
                target="_blank"
                rel="noopener noreferrer"
                data-cursor-hover
                className="w-full justify-center group inline-flex items-center gap-3 px-7 md:px-8 py-3.5 md:py-4 border border-border text-foreground font-semibold rounded-lg hover:border-accent hover:text-accent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <FileText size={18} aria-hidden="true" />
                <span>Download CV</span>
              </a>
            </MagneticButton>
          </div>

          <div className="flex items-center gap-5 md:gap-6">
            <a
              href="https://github.com/habiba-imran"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor-hover
              className="p-3 border border-border rounded-full text-muted hover:text-accent hover:border-accent/50 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="GitHub Profile (opens in new tab)"
            >
              <Github size={20} aria-hidden="true" />
            </a>
            <a
              href="https://www.linkedin.com/in/habiba-imran-118624258/"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor-hover
              className="p-3 border border-border rounded-full text-muted hover:text-accent hover:border-accent/50 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="LinkedIn Profile (opens in new tab)"
            >
              <Linkedin size={20} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
});

export default Contact;
