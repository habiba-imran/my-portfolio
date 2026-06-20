import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Mail, Github, Linkedin, ArrowUpRight } from 'lucide-react';

function MagneticButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const buttonRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (mouseEvent.clientX - centerX) * 0.35;
      const deltaY = (mouseEvent.clientY - centerY) * 0.35;

      gsap.to(button, {
        x: deltaX,
        y: deltaY,
        duration: 0.4,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(button, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.4)',
      });
    };

    button.addEventListener('mousemove', handleMouseMove);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      button.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <span ref={buttonRef} className={className}>
      {children}
    </span>
  );
}

export default function Contact() {
  return (
    <section id="contact" className="section-padding py-section relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center">
        <span className="text-accent font-medium text-sm uppercase tracking-wider">
          Contact
        </span>
        <h2 className="font-display text-display-lg text-foreground font-bold mt-4 mb-6 reveal-headline">
          Let's Build Something Together
        </h2>
        <p className="text-lg md:text-xl text-muted leading-relaxed mb-12 max-w-2xl mx-auto">
          I'm currently looking for summer internship opportunities and interesting
          projects to collaborate on. If you have an idea or opportunity, I'd love to hear from you.
        </p>

        <div className="flex flex-col items-center gap-8">
          <MagneticButton className="inline-flex items-center">
            <a
              href="mailto:alex.chen@stanford.edu"
              data-cursor-hover
              className="group inline-flex items-center gap-3 px-8 py-4 bg-accent text-background font-semibold rounded-lg hover:bg-accent/90 transition-colors duration-200"
            >
              <Mail size={20} />
              <span>Get in Touch</span>
              <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200" />
            </a>
          </MagneticButton>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/alexchen"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor-hover
              className="p-3 border border-border rounded-full text-muted hover:text-accent hover:border-accent/50 transition-colors duration-200"
              aria-label="GitHub Profile"
            >
              <Github size={22} />
            </a>
            <a
              href="https://linkedin.com/in/alexchen"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor-hover
              className="p-3 border border-border rounded-full text-muted hover:text-accent hover:border-accent/50 transition-colors duration-200"
              aria-label="LinkedIn Profile"
            >
              <Linkedin size={22} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
