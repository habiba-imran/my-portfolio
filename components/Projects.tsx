"use client";
import { useEffect, useRef, useState, memo } from 'react';
import { gsap } from 'gsap';
import { ArrowUpRight, ExternalLink, Sparkles, X } from 'lucide-react';
import Image from 'next/image';
import ProjectVisual from './ProjectVisual';
import { useTextReveal } from '../hooks/useTextReveal';
import { useSectionReveal } from '../hooks/useSectionReveal';
import { useSound } from '../context/SoundContext';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function AnimatedHeadline({ children }: { children: string }) {
  const sectionRef = useTextReveal('.reveal-word', '#projects');
  const words = children.split(' ');

  return (
    <h2 ref={sectionRef} className="font-display text-display-lg text-foreground font-bold mt-4 hover:text-accent hover:drop-shadow-[0_0_20px_rgba(218,168,82,0.3)] transition-all duration-500 origin-left cursor-default" style={{ overflow: 'hidden' }}>
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

import { projects } from '../lib/data';

type Project = typeof projects[0];

function CaseStudyModal({ project, onClose }: { project: Project; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-background/75 p-3 backdrop-blur-xl md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-study-title"
      onMouseDown={onClose}
    >
      <article
        className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/10 bg-card shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-background/80 p-2 text-muted transition-colors duration-200 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Close case study"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="project-placeholder min-h-[260px] border-b border-white/10 p-5 lg:border-b-0 lg:border-r lg:p-6">
            <div className="flex h-full min-h-[260px] flex-col gap-4">
              <ProjectVisual id={project.id} title={project.title} featured />
              <div className="grid grid-cols-3 gap-2">
              {project.metrics.map((metric) => (
                <div key={metric} className="rounded-lg border border-white/10 bg-card/70 p-3">
                  <p className="text-xs font-medium text-foreground">{metric}</p>
                </div>
              ))}
              </div>
            </div>
          </div>

          <div className="p-5 md:p-7 lg:p-8">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.22em] text-accent">{project.status}</p>
              <h2 id="case-study-title" className="mt-2 font-display text-3xl font-semibold text-foreground">
                {project.title}
              </h2>
              <p className="mt-3 text-sm font-medium text-muted">{project.role}</p>
            </div>

            <div className="grid gap-6">
              <section>
                <h3 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-foreground">Problem</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">{project.problem}</p>
              </section>

              <section>
                <h3 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-foreground">What I Built</h3>
                <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-muted md:text-base">
                  {project.approach.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-foreground">Result / Placeholder</h3>
                <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-muted md:text-base">
                  {project.results.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-secondary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="flex flex-wrap gap-2 pt-1">
                {project.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

const ProjectCard = memo(function ProjectCard({
  project,
  featured = false,
  onOpen,
}: {
  project: Project;
  featured?: boolean;
  onOpen: (project: Project) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const { playTick } = useSound();

  useEffect(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

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
      st.disable(); // Prevent scroll from fighting hover
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      gsap.to(card, {
        rotateX,
        rotateY,
        scale: 1.02,
        duration: 0.25,
        ease: 'power2.out',
        transformPerspective: 1000,
      });

      gsap.to(glow, {
        opacity: 0.12,
        duration: 0.25,
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        duration: 0.4,
        ease: 'power2.out',
        onComplete: () => {
          st.enable(); // Re-enable scrub
        }
      });

      gsap.to(glow, {
        opacity: 0,
        duration: 0.25,
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
    <article
      ref={cardRef}
      onMouseEnter={playTick}
      data-cursor-hover
      className={`project-card group relative overflow-hidden rounded-xl border border-white/10 bg-card/58 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:bg-card/72 hover:shadow-[0_28px_90px_rgba(0,0,0,0.34)] md:p-7 ${featured ? 'md:col-span-2 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-10' : ''}`}
      style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 opacity-0 bg-gradient-to-br from-accent/15 to-transparent rounded-lg transition-opacity"
      />
      <div className={`relative mb-6 aspect-[16/10] overflow-hidden rounded-lg border border-border/70 bg-background/70 ${featured ? 'lg:mb-0 lg:h-full lg:min-h-[320px]' : ''}`}>
        {project.image ? (
          <Image
            src={project.image}
            alt={`${project.title} screenshot`}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <ProjectVisual id={project.id} title={project.title} featured={featured} />
        )}
      </div>
      <div className="relative flex h-full flex-col">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <Sparkles size={12} aria-hidden="true" />
            {project.status}
          </span>
          {featured && <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted">Featured system</span>}
        </div>
        <h3 className="font-display text-xl font-semibold text-foreground md:text-2xl">
          {project.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
          {project.description}
        </p>
        <ul className="mt-5 grid gap-2 text-sm text-muted/90">
          {project.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted transition-colors duration-200 group-hover:border-accent/30 group-hover:text-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-4 pt-6">
          <button
            type="button"
            onClick={() => onOpen(project)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-colors duration-200 hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            Case Study
            <ArrowUpRight size={14} aria-hidden="true" />
          </button>
          {project.link ? (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-accent transition-colors duration-200 hover:text-accent/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              aria-label={`View ${project.title} project`}
            >
              View project
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-muted">
              Private product work
              <ArrowUpRight size={14} aria-hidden="true" />
            </span>
          )}
        </div>
      </div>
    </article>
  );
});

const Projects = memo(function Projects() {
  const revealRef = useSectionReveal<HTMLElement>();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <section id="projects" ref={revealRef} className="section-padding py-section relative">
      <div className="mb-6 flex flex-col justify-between gap-4 md:mb-8 lg:flex-row lg:items-end">
        <div>
        <span className="text-accent font-medium text-sm uppercase tracking-wider">
          Selected Work
        </span>
          <AnimatedHeadline>Systems I Have Built</AnimatedHeadline>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-muted md:text-base">
          A focused look at full-stack products, AI workflows, and visual systems that show how I think through implementation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} featured={index === 0} onOpen={setSelectedProject} />
        ))}
      </div>
      {selectedProject && (
        <CaseStudyModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </section>
  );
});

export default Projects;

