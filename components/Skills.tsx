"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { expertise } from "@/lib/data";
export default function Skills() {
  const [openItems, setOpenItems] = useState<string[]>([]);
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
            <div key={item.title} className={`expertise-row${openItems.includes(item.title) ? " is-open" : ""}`} data-reveal>
              <button className="expertise-summary" type="button" aria-expanded={openItems.includes(item.title)} onClick={() => setOpenItems((current) => current.includes(item.title) ? current.filter((title) => title !== item.title) : [...current, item.title])}>
                <span className="row-number">0{index + 1}</span>
                <span className="expertise-title">
                  {item.title}
                  <span>{item.summary}</span>
                </span>
                <span className="expertise-stack">{item.stack}</span>
                <span className="expand-icon">
                  <Plus size={22} aria-hidden="true" />
                </span>
              </button>
              <div className="expertise-panel" aria-hidden={!openItems.includes(item.title)}>
              <div className="expertise-detail">
                <p>{item.description}</p>
                <ul>
                  {item.skills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
