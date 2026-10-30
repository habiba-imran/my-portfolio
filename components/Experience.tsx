import { ArrowUpRight, Award } from "lucide-react";
import { experiences, recognition, profile } from "@/lib/data";
export default function Experience() {
  return (
    <section
      id="experience"
      className="experience-section section-space"
      aria-labelledby="experience-heading"
    >
      <div className="container">
        <div className="experience-grid">
          <div data-reveal>
            <span className="eyebrow">04 / Along the way</span>
            <h2 id="experience-heading">
              Learning. <br />
              Building.
              <br />
              <span className="muted-word">Becoming.</span>
            </h2>
            <p className="experience-intro">
              Real projects, good questions, and a little more understanding
              with every iteration.
            </p>
            <a className="text-link" href={profile.cv} download>
              Download my CV <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
          <ol className="timeline">
            {experiences.map((item, index) => (
              <li key={item.id} className="timeline-item" data-reveal>
                <div className="timeline-meta">
                  <span>{item.period}</span>
                  <span>0{index + 1}</span>
                </div>
                <h3>{item.title}</h3>
                <span className="timeline-company">{item.company}</span>
                <p>{item.description}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="recognition-panel" data-reveal>
          <div className="recognition-heading">
            <span className="eyebrow">A few milestones</span>
            <h3>
              Small wins.
              <br />
              Lasting motivation<span>.</span>
            </h3>
            <Award size={32} aria-hidden="true" />
          </div>
          <div className="recognition-grid">
            {recognition.map((item) => (
              <div key={item.title}>
                <h4>{item.title}</h4>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
