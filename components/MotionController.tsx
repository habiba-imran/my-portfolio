"use client";
import { useEffect } from "react";
import { gsap } from "gsap";

// Server-rendered content remains visible without JavaScript.
export default function MotionController() {
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        document.querySelectorAll("[data-hero-reveal]"),
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.11,
          ease: "power3.out",
          clearProps: "all",
        },
      );
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            gsap.fromTo(
              entry.target,
              { y: 30, opacity: 0.35 },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power3.out",
                clearProps: "all",
              },
            );
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.08 },
      );
      document
        .querySelectorAll("[data-reveal]")
        .forEach((element) => observer.observe(element));
      return () => {
        observer.disconnect();
        const elements = document.querySelectorAll(
          "[data-reveal], [data-hero-reveal]",
        );
        gsap.killTweensOf(elements);
        gsap.set(elements, { clearProps: "transform,opacity" });
      };
    });
    return () => media.revert();
  }, []);
  return null;
}
