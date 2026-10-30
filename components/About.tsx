import Image from "next/image";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { profile } from "@/lib/data";
export default function About() {
  return (
    <section
      id="about"
      className="about-section section-space"
      aria-labelledby="about-heading"
    >
      <div className="container about-grid">
        <div className="about-photo-column" data-reveal>
          <span className="eyebrow">01 / The person behind the code</span>
          <figure className="portrait">
            <Image
              src="/pfp.jpeg"
              alt="Habiba Imran"
              width={960}
              height={1280}
              sizes="(max-width: 767px) 75vw, 28vw"
              className="portrait-image"
            />
            <figcaption>
              <span>
                A curious mind.
                <br />
                An engineer at heart.
              </span>
              <span className="portrait-spark" aria-hidden="true">
                ✳
              </span>
            </figcaption>
          </figure>
          <span className="portrait-note">
            A little about me <ArrowDownRight size={16} aria-hidden="true" />
          </span>
        </div>
        <div className="about-copy" data-reveal>
          <h2 id="about-heading">
            Good software starts
            <br />
            with <span className="muted-word">real people.</span>
          </h2>
          <p className="about-lead">
            I like the space where complex systems meet everyday human moments.
          </p>
          <div className="about-body">
            <p>
              I’m a Computer Science student and software engineer focused on
              full-stack products, backend systems, and applied AI. My favorite
              kind of problem? Turning a complicated idea into something that
              feels simple to use.
            </p>
            <p>
              Recently, that’s meant React dashboards, FastAPI and NestJS
              services, LiveKit and Twilio call flows, and LLM-powered
              evaluation pipelines at Finova Solutions. I care about how a
              system works — and how it feels to the person using it.
            </p>
          </div>
          <div className="education-row">
            <div>
              <span className="eyebrow">Always learning</span>
              <h3>{profile.university}</h3>
              <p>
                {profile.degree} · Expected {profile.graduation}
              </p>
            </div>
            <div className="cgpa">
              <strong>{profile.cgpa}</strong>
              <span>CGPA</span>
            </div>
          </div>
          <a className="text-link" href={profile.cv} download>
            The longer story, in my CV{" "}
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
