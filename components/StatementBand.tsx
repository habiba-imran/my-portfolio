import { ArrowUpRight } from "lucide-react";
export default function StatementBand() {
  return (
    <nav
      className="statement-band container"
      aria-label="Explore my engineering focus"
      data-reveal
    >
      <a href="#about" className="statement-pill pill-small">
        I
      </a>
      <a href="#projects" className="statement-pill pill-warm">
        BUILD
      </a>
      <a
        href="#skills"
        className="statement-pill pill-arrow"
        aria-label="Explore my expertise"
      >
        <ArrowUpRight aria-hidden="true" />
      </a>
      <a href="#voice" className="statement-pill pill-wide">
        HUMAN TECH<span aria-hidden="true">✳</span>
      </a>
    </nav>
  );
}
