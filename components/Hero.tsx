import { ArrowDown, ArrowUpRight } from "lucide-react";
import HeroArtwork from "./HeroArtwork";
export default function Hero() {
  return (
    <section
      id="home"
      className="hero container"
      aria-labelledby="hero-heading"
    >
      <div className="hero-kicker" data-hero-reveal>
        <span className="eyebrow">
          <span className="tiny-spark" aria-hidden="true">
            ✳
          </span>{" "}
          Software engineer · Voice AI & full stack
        </span>
        <span className="hero-edition">A portfolio, with a human side.</span>
      </div>
      <div className="hero-grid">
        <div className="hero-copy">
          <h1 id="hero-heading">
            <span className="headline-line">
              <span data-hero-reveal>Making software</span>
            </span>
            <span className="headline-line">
              <span data-hero-reveal>feel a little</span>
            </span>
            <span className="headline-line accent-line">
              <span data-hero-reveal>
                more human<span className="hero-period">.</span>
              </span>
            </span>
          </h1>
          <div className="hero-intro" data-hero-reveal>
            <span className="intro-line" aria-hidden="true" />
            <p>
              Hey, I’m Habiba. I build real-time voice AI, thoughtful web apps,
              and the backend systems that bring them to life.
            </p>
          </div>
          <div className="hero-ctas" data-hero-reveal>
            <a className="button button-dark" href="#projects">
              Explore my work <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <a className="text-link" href="#voice">
              Inside my voice lab{" "}
              <span className="tiny-spark" aria-hidden="true">
                ✳
              </span>
            </a>
          </div>
        </div>
        <div className="hero-art-wrap" data-hero-reveal>
          <HeroArtwork />
          <div className="art-caption">
            <span>01 / A study in connection</span>
            <span>Code meets conversation ↗</span>
          </div>
        </div>
      </div>
      <div className="hero-bottom" data-hero-reveal>
        <a href="#about">
          Scroll to discover <ArrowDown size={15} aria-hidden="true" />
        </a>
        <span>
          Full-stack products <i aria-hidden="true" /> Real-time systems{" "}
          <i aria-hidden="true" /> Applied AI
        </span>
        <span className="hero-location">Based in Pakistan</span>
      </div>
    </section>
  );
}
