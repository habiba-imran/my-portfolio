import { useRef, useEffect, memo } from 'react';
import { gsap } from 'gsap';
import { Mail, Github, Linkedin, ArrowUpRight } from 'lucide-react';
import { useTextReveal } from '../hooks/useTextReveal';

function AnimatedHeadline({ children }: { children: string }) {
  const sectionRef = useTextReveal('.reveal-word', '#contact');
  const words = children.split(' ');

  return (
    <h2 id="contact-heading" ref={sectionRef} className="font-display text-display-lg text-foreground font-bold mt-4 mb-5 md:mb-6 hover:text-accent hover:scale-[1.02] hover:drop-shadow-[0_0_20px_rgba(212,162,76,0.3)] transition-all duration-500 cursor-default" style={{ overflow: 'hidden' }}>
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
  return (
    <section id="contact" className="section-padding py-section relative overflow-hidden" aria-labelledby="contact-heading">
      <div className="max-w-4xl mx-auto text-center">
        <span className="text-accent font-medium text-sm uppercase tracking-wider">
          Contact
        </span>
        <AnimatedHeadline>Let's Build Something Together</AnimatedHeadline>
        <p className="text-base md:text-lg text-muted leading-relaxed mb-6 md:mb-8 max-w-2xl mx-auto">
          I'm currently looking for summer internship opportunities and interesting
          projects to collaborate on. If you have an idea or opportunity, I'd love to hear from you.
        </p>

        <div className="flex flex-col items-center gap-8">
          <MagneticButton className="inline-flex items-center">
            <a
              href="mailto:habiba.imran@example.com"
              data-cursor-hover
              className="group inline-flex items-center gap-3 px-7 md:px-8 py-3.5 md:py-4 bg-accent text-background font-semibold rounded-lg hover:bg-accent/90 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Mail size={18} aria-hidden="true" />
              <span>Get in Touch</span>
              <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200" aria-hidden="true" />
            </a>
          </MagneticButton>

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
              href="https://linkedin.com/in/habiba-imran"
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
