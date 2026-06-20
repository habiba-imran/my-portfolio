import { useTextReveal } from '../hooks/useTextReveal';

function AnimatedHeadline({ children }: { children: string }) {
  const sectionRef = useTextReveal('.reveal-word', '#about');

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

export default function About() {
  return (
    <section id="about" className="section-padding py-section relative overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-4">
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            About
          </span>
          <AnimatedHeadline>My Story</AnimatedHeadline>
        </div>

        <div className="lg:col-span-8 lg:col-start-6">
          <div className="space-y-6 text-lg md:text-xl text-muted leading-relaxed">
            <p>
              I'm a junior at Stanford University studying Computer Science with a concentration
              in Human-Computer Interaction. My journey into programming started in high school
              when I built my first mobile app—a simple task manager that helped my classmates
              organize their assignments.
            </p>
            <p>
              Since then, I've developed a deep interest in building products that solve real
              problems. Whether it's creating accessible web applications, designing intuitive
              user interfaces, or exploring the intersection of AI and everyday software, I'm
              always excited to learn something new and push the boundaries of what's possible.
            </p>
            <p>
              When I'm not coding, you'll find me photographing urban architecture, playing
              pickup basketball, or volunteering at local STEM outreach programs to inspire
              the next generation of technologists.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
