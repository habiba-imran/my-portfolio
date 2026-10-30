"use client";
import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { projects, type Project } from "@/lib/data";
import ProjectVisual from "./ProjectVisual";
import Dialog from "./Dialog";

function CaseStudy({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  return (
    <Dialog titleId="case-title" onClose={onClose}>
      <div className="case-visual">
        <ProjectVisual id={project.id} title={project.title} />
      </div>
      <div className="case-body">
        <span className="eyebrow">{project.category}</span>
        <h2 id="case-title">{project.title}</h2>
        <p className="case-role">{project.role}</p>
        <section>
          <h3>The problem</h3>
          <p>{project.problem}</p>
        </section>
        <section>
          <h3>My approach</h3>
          <ul>
            {project.approach.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>The outcome</h3>
          <ul>
            {project.results.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <div className="case-tags">
          {project.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        {project.id === 1 ? (
          <p className="privacy-note">
            <LockKeyhole size={16} aria-hidden="true" />
            Professional work at Finova Solutions. This overview includes only
            high-level information; implementation, client data, and recordings
            remain private.
          </p>
        ) : (
          <a
            className="button button-dark"
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            {project.action} <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        )}
      </div>
    </Dialog>
  );
}

export default function Projects() {
  const [selected, setSelected] = useState<Project | null>(null);
  return (
    <section
      id="projects"
      className="projects-section section-space"
      aria-labelledby="projects-heading"
    >
      <div className="container">
        <div className="section-heading" data-reveal>
          <div>
            <span className="eyebrow">02 / Selected work</span>
            <h2 id="projects-heading">
              Ideas into
              <br />
              <span className="muted-word">working things.</span>
            </h2>
          </div>
          <p>
            From a conversation in real time to a clearer view of our world. A
            few things I’ve helped bring to life.
          </p>
        </div>
        <div className="projects-grid">
          {projects.map((project, index) => (
            <article key={project.id} className="project-card" data-reveal>
              <button
                type="button"
                className="project-preview"
                onClick={() => setSelected(project)}
                aria-label={`Read ${project.name} case study`}
              >
                {project.image ? (
                  <Image
                    src={project.image}
                    alt={`${project.name} screenshot`}
                    fill
                    sizes="(min-width: 768px) 45vw, 92vw"
                  />
                ) : (
                  <ProjectVisual id={project.id} title={project.title} />
                )}
                <span className="project-open" aria-hidden="true">
                  <ArrowUpRight size={24} />
                </span>
              </button>
              <div className="project-info">
                <div className="project-category">
                  <span>{project.category}</span>
                  <span>0{index + 1}</span>
                </div>
                <div className="project-title-row">
                  <h3>
                    <button type="button" onClick={() => setSelected(project)}>
                      {project.name}
                    </button>
                  </h3>
                  <button
                    type="button"
                    className="case-link"
                    onClick={() => setSelected(project)}
                  >
                    Case study <ArrowUpRight size={14} aria-hidden="true" />
                  </button>
                </div>
                <p>{project.description}</p>
                <div className="project-meta">
                  <span>{project.tags.slice(0, 3).join(" / ")}</span>
                  {project.link ? (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${project.action}: ${project.name} (opens in new tab)`}
                    >
                      {project.action}{" "}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="private-label">
                      <LockKeyhole size={12} aria-hidden="true" />
                      Private work
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      {selected && (
        <CaseStudy project={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
