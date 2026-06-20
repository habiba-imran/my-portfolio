import { useTextReveal } from '../hooks/useTextReveal';

function AnimatedHeadline({ children }: { children: string }) {
  const sectionRef = useTextReveal('.reveal-word', '#experience');

  const words = children.split(' ');

  return (
    <h2 ref={sectionRef} className="font-display text-display-lg text-foreground font-bold mt-4" style={{ overflow: 'hidden' }}>
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

const experiences = [
  {
    id: 1,
    title: 'Software Engineering Intern',
    company: 'Google',
    period: 'Summer 2025',
    description: 'Developed microservices for Google Cloud Platform, improving API response times by 40%. Collaborated with a team of 8 engineers on distributed systems architecture.',
  },
  {
    id: 2,
    title: 'Full-Stack Developer',
    company: 'Stanford Digital Library',
    period: '2024 - Present',
    description: 'Building digital archive interfaces for historical document collections. Implementing search functionality with Elasticsearch and creating accessible UI components.',
  },
  {
    id: 3,
    title: 'Teaching Assistant',
    company: 'Stanford CS106B',
    period: 'Fall 2024',
    description: 'Led weekly discussion sections for 50+ students in Data Structures & Algorithms. Held office hours and assisted with grading and curriculum development.',
  },
  {
    id: 4,
    title: 'Bachelor of Science in Computer Science',
    company: 'Stanford University',
    period: '2022 - 2026',
    description: "Concentration in Human-Computer Interaction. GPA: 3.85. Dean's List all quarters. Member of Stanford ACM and Women in Computer Science.",
  },
];

export default function Experience() {
  return (
    <section id="experience" className="section-padding py-section bg-card/30 relative overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-4">
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            Experience
          </span>
          <AnimatedHeadline>My Journey</AnimatedHeadline>
        </div>

        <div className="lg:col-span-8 lg:col-start-6">
          <div className="relative border-l border-border pl-6 md:pl-8 space-y-12">
            {experiences.map((exp) => (
              <article key={exp.id} className="relative">
                <div className="absolute -left-[1.5625rem] md:-left-[1.875rem] w-3 h-3 bg-background border-2 border-accent rounded-full" />
                <div className="space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                    <h3 className="font-display text-lg text-foreground font-semibold">
                      {exp.title}
                    </h3>
                    <span className="text-sm text-muted">{exp.period}</span>
                  </div>
                  <p className="text-accent font-medium">{exp.company}</p>
                  <p className="text-muted leading-relaxed">{exp.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
