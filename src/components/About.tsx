import { memo } from 'react';
import { useTextReveal } from '../hooks/useTextReveal';
import { GraduationCap, Camera, BrainCircuit, Trophy, Award, Medal, Star } from 'lucide-react';

function AnimatedHeadline({ children }: { children: string }) {
  const sectionRef = useTextReveal('.reveal-word', '#about');
  const words = children.split(' ');

  return (
    <h2 ref={sectionRef} className="font-display text-display-lg text-foreground font-bold mt-4 mb-8 md:mb-12 hover:text-accent hover:scale-[1.02] hover:drop-shadow-[0_0_20px_rgba(212,162,76,0.3)] transition-all duration-500 origin-left cursor-default" style={{ overflow: 'hidden' }}>
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
  return (
    <div className={`group relative overflow-hidden rounded-3xl bg-card/40 backdrop-blur-xl border border-white/5 hover:border-accent/40 transition-all duration-500 p-8 md:p-10 hover:bg-card/60 hover:shadow-[0_0_40px_rgba(212,162,76,0.1)] hover:-translate-y-1 ${className}`}>
      {/* Subtle internal gradient glow that follows hover (CSS only approx) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-accent/10 via-transparent to-transparent transition-opacity duration-500" />
      
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
  return (
    <section id="about" className="section-padding py-section relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <span className="text-accent font-medium text-sm uppercase tracking-wider">
          About
        </span>
        <AnimatedHeadline>My Story</AnimatedHeadline>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[minmax(180px,auto)]">
          
          {/* Main Bio - Spans 2 columns, 2 rows */}
          <BentoCard className="md:col-span-2 md:row-span-2">
            <div className="space-y-6 text-base md:text-lg text-muted leading-relaxed text-justify">
              <p>
                I'm a computer science student passionate about building digital experiences 
                with clean code and creative thinking. My journey into programming started 
                early, driven by a deep curiosity for how software can shape the real world.
              </p>
              <p>
                I specialize in <strong>Full-Stack Development</strong> and <strong>Voice AI</strong>, 
                exploring how intelligent systems can interact seamlessly with everyday users.
                Whether it's designing intuitive user interfaces, architecting robust backend APIs,
                or deploying LLM pipelines, I'm always excited to push the boundaries of what's possible.
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
                <span>Expected Graduation: Dec 2027</span>
              </div>
            </div>
          </BentoCard>

          {/* Focus Area - Spans 2 columns, 1 row */}
          <BentoCard title="Voice AI" icon={BrainCircuit} className="md:col-span-2">
            <div className="flex flex-col">
              <p className="text-sm md:text-base text-muted leading-relaxed">
                Building conversational AI pipelines using LLMs, STT, and TTS technologies for real-time applications.
              </p>
            </div>
          </BentoCard>

          {/* Awards & Certificates - Spans 4 columns */}
          <BentoCard title="Awards & Certificates" icon={Trophy} className="md:col-span-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 rounded-lg bg-accent/10 text-accent"><Award size={16} /></div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">PM's Laptop Scheme 2025</h4>
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
