import { Plus } from "lucide-react";
import { expertise } from "@/lib/data";
export default function Skills() {
  return (
    <section
      id="skills"
      className="expertise-section section-space"
      aria-labelledby="skills-heading"
    >
      <div className="container">
        <div className="section-heading" data-reveal>
          <div>
            <span className="eyebrow">03 / What I work with</span>
            <h2 id="skills-heading">
              Different tools.
              <br />
              <span className="muted-word">One curious mind.</span>
            </h2>
          </div>
          <p>
            I work across the stack, connecting what people see with everything
            that makes it possible.
          </p>
        </div>
        <div className="expertise-rows">
          {expertise.map((item, index) => (
            <details key={item.title} className="expertise-row" data-reveal>
              <summary>
                <span className="row-number">0{index + 1}</span>
                <span className="expertise-title">
                  {item.title}
                  <span>{item.summary}</span>
                </span>
                <span className="expertise-stack">{item.stack}</span>
                <span className="expand-icon">
                  <Plus size={22} aria-hidden="true" />
                </span>
              </summary>
              <div className="expertise-detail">
                <p>{item.description}</p>
                <ul>
                  {item.skills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
