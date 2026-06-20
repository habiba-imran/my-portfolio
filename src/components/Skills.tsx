import { useEffect, useRef, memo } from 'react';
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

const Skills = memo(function Skills() {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const marquee = marqueeRef.current;
    const track = trackRef.current;
    if (!marquee || !track) return;

    const totalWidth = track.scrollWidth / 2;

    animationRef.current = gsap.to(track, {
      x: -totalWidth,
      duration: 35,
      ease: 'none',
      repeat: -1,
    });

    const handleMouseEnter = () => {
      if (animationRef.current) {
        gsap.to(animationRef.current, { timeScale: 0.3, duration: 0.4, ease: 'power2.out' });
      }
    };

    const handleMouseLeave = () => {
      if (animationRef.current) {
        gsap.to(animationRef.current, { timeScale: 1, duration: 0.4, ease: 'power2.out' });
      }
    };

    marquee.addEventListener('mouseenter', handleMouseEnter);
    marquee.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      marquee.removeEventListener('mouseenter', handleMouseEnter);
      marquee.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, []);

  const allSkills = skillCategories.flatMap(cat => cat.skills);

  return (
    <section id="skills" className="section-padding py-section bg-card/30 overflow-hidden" aria-labelledby="skills-heading">
      <div className="max-w-6xl">
        <div className="mb-10 md:mb-12">
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            Skills
          </span>
          <h2 id="skills-heading" className="font-display text-display-lg text-foreground font-bold mt-4 reveal-headline">
            What I Work With
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 mb-12 md:mb-16">
          {skillCategories.map((category) => (
            <div key={category.title} className="space-y-3 md:space-y-4">
              <h3 className="font-display text-lg md:text-2xl text-foreground font-semibold">
                {category.title}
              </h3>
              <ul className="flex flex-wrap gap-2" role="list">
                {category.skills.map((skill) => (
                  <li key={skill}>
                    <span className="px-3 md:px-4 py-1.5 md:py-2 bg-background border border-border rounded-full text-xs md:text-sm text-muted hover:text-foreground hover:border-accent/50 transition-colors duration-200">
                      {skill}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div
        ref={marqueeRef}
        className="relative"
        style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}
        aria-hidden="true"
      >
        <div ref={trackRef} className="marquee-track flex gap-6 md:gap-8 w-max">
          {[...allSkills, ...allSkills].map((skill, i) => (
            <span
              key={i}
              className="px-6 md:px-8 py-3 md:py-4 text-lg md:text-2xl font-display font-medium text-muted/30 whitespace-nowrap"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
});

export default Skills;
