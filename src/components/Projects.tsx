import { useEffect, useRef, memo } from 'react';
import { gsap } from 'gsap';
import { ExternalLink } from 'lucide-react';

const projects = [
  {
    id: 1,
    title: 'ShopStream',
    description: 'A full-stack e-commerce platform with real-time inventory management, payment processing via Stripe, and an admin dashboard. Built with React, Node.js, and PostgreSQL.',
    tags: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
    link: '#',
  },
  {
    id: 2,
    title: 'StudySync',
    description: 'Collaborative study platform that uses AI to generate flashcards and quizzes from uploaded notes. Features real-time collaboration and progress tracking.',
    tags: ['Next.js', 'OpenAI API', 'Socket.io', 'MongoDB'],
    link: '#',
  },
  {
    id: 3,
    title: 'ClimateViz',
    description: 'Interactive data visualization dashboard presenting climate change data from NOAA and NASA APIs. Features animated charts and geographical mapping.',
    tags: ['D3.js', 'React', 'Python', 'REST APIs'],
    link: '#',
  },
  {
    id: 4,
    title: 'DevMatch',
    description: 'A networking platform connecting developers for hackathons and open-source projects. Includes skill matching algorithms and project collaboration tools.',
    tags: ['React', 'Firebase', 'Tailwind CSS', 'Algolia'],
    link: '#',
  },
];

const ProjectCard = memo(function ProjectCard({ project }: { project: typeof projects[0] }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
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
    };
  }, []);

  return (
    <article
      ref={cardRef}
      data-cursor-hover
      className="group relative overflow-hidden p-5 md:p-8 bg-card border border-border rounded-lg hover:border-accent/50 transition-colors duration-300"
      style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 opacity-0 bg-gradient-to-br from-accent/15 to-transparent rounded-lg transition-opacity"
      />
      <h3 className="font-display text-xl md:text-2xl text-foreground font-semibold mb-3 md:mb-4">
        {project.title}
      </h3>
      <p className="text-muted leading-relaxed mb-4 md:mb-6 text-sm md:text-base">
        {project.description}
      </p>
      <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-3 py-1 bg-background text-muted rounded-full border border-border"
          >
            {tag}
          </span>
        ))}
      </div>
      <a
        href={project.link}
        className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors duration-200 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card px-1 -ml-1"
        aria-label={`View ${project.title} project`}
      >
        View project
        <ExternalLink size={14} aria-hidden="true" />
      </a>
    </article>
  );
});

const Projects = memo(function Projects() {
  return (
    <section id="projects" className="section-padding py-section relative">
      <div className="mb-10 md:mb-12">
        <span className="text-accent font-medium text-sm uppercase tracking-wider">
          Projects
        </span>
        <h2 className="font-display text-display-lg text-foreground font-bold mt-4 reveal-headline">
          Featured Work
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
});

export default Projects;
