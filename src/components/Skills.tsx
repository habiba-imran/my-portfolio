import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const skillCategories = [
  {
    title: 'Languages',
    skills: ['TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'SQL', 'HTML/CSS'],
  },
  {
    title: 'Frameworks & Libraries',
    skills: ['React', 'Next.js', 'Node.js', 'Express', 'Tailwind CSS', 'PostgreSQL', 'MongoDB'],
  },
  {
    title: 'Tools',
    skills: ['Git', 'Docker', 'AWS', 'Figma', 'Linux', 'VS Code', 'Postman'],
  },
];

export default function Skills() {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      (marqueeRef.current?.querySelector('.marquee-track') as HTMLElement)?.classList.add('paused');
      return;
    }

    const marquee = marqueeRef.current;
    const track = trackRef.current;
    if (!marquee || !track) return;

    const totalWidth = track.scrollWidth / 2;

    gsap.to(track, {
      x: -totalWidth,
      duration: 40,
      ease: 'none',
      repeat: -1,
    });

    const handleMouseEnter = () => {
      gsap.to(track, { timeScale: 0.3, duration: 0.5 });
    };

    const handleMouseLeave = () => {
      gsap.to(track, { timeScale: 1, duration: 0.5 });
    };

    marquee.addEventListener('mouseenter', handleMouseEnter);
    marquee.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      marquee.removeEventListener('mouseenter', handleMouseEnter);
      marquee.removeEventListener('mouseleave', handleMouseLeave);
      gsap.killTweensOf(track);
    };
  }, []);

  const allSkills = skillCategories.flatMap(cat => cat.skills);

  return (
    <section id="skills" className="section-padding py-section bg-card/30 overflow-hidden">
      <div className="max-w-6xl">
        <div className="mb-12">
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            Skills
          </span>
          <h2 className="font-display text-display-lg text-foreground font-bold mt-4 reveal-headline">
            What I Work With
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-16">
          {skillCategories.map((category) => (
            <div key={category.title} className="space-y-4">
              <h3 className="font-display text-display-sm text-foreground font-semibold">
                {category.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-4 py-2 bg-background border border-border rounded-full text-sm text-muted hover:text-foreground hover:border-accent/50 transition-colors duration-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div ref={marqueeRef} className="relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
        <div ref={trackRef} className="marquee-track flex gap-8 w-max">
          {[...allSkills, ...allSkills].map((skill, i) => (
            <span
              key={i}
              className="px-8 py-4 text-xl md:text-2xl font-display font-medium text-muted/40 whitespace-nowrap"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
