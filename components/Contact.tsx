"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { profile } from "@/lib/data";
export default function Contact() {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copyEmail() {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(profile.email);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    timer.current = setTimeout(() => setStatus("idle"), 4000);
  }
  return (
    <section
      id="contact"
      className="contact-section"
      aria-labelledby="contact-heading"
    >
      <div className="container">
        <div className="contact-top" data-reveal>
          <span className="eyebrow">06 / Let’s make a connection</span>
          <span>Open to software & AI opportunities</span>
        </div>
        <div className="contact-main" data-reveal>
          <h2 id="contact-heading">
            Have a good idea?
            <br />
            Let’s{" "}
            <a href={`mailto:${profile.email}`}>
              talk<span aria-hidden="true">↗</span>
            </a>
          </h2>
          <div className="contact-side">
            <span className="contact-spark" aria-hidden="true">
              ✳
            </span>
            <p>
              Voice AI, useful products, or something you’re excited to build.
              I’d love to hear about it.
            </p>
          </div>
        </div>
        <div className="contact-links" data-reveal>
          <div className="email-group">
            <a className="email-link" href={`mailto:${profile.email}`}>
              {profile.email}
              <ArrowUpRight size={20} aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={copyEmail}
              className="copy-button"
              aria-label="Copy email address"
            >
              {status === "copied" ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <Copy size={16} aria-hidden="true" />
              )}
            </button>
            <span className="copy-status" role="status">
              {status === "copied"
                ? "Email copied"
                : status === "error"
                  ? "Please select the email to copy it."
                  : ""}
            </span>
          </div>
          <div className="social-links">
            <a href={profile.github} target="_blank" rel="noopener noreferrer">
              GitHub <ArrowUpRight size={15} aria-hidden="true" />
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn <ArrowUpRight size={15} aria-hidden="true" />
            </a>
            <a href={profile.cv} download>
              Download CV <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
