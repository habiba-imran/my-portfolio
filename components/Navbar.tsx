"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { useTheme } from "next-themes";
import { useSound } from "@/context/SoundContext";
import { navigation, profile } from "@/lib/data";
import Dialog from "./Dialog";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState("#home");
  const { resolvedTheme, setTheme } = useTheme();
  const { isMuted, toggleMute, playTick } = useSound();
  useEffect(() => {
    setMounted(true);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-15% 0px -60% 0px" },
    );
    navigation.forEach(({ href }) => {
      const section = document.querySelector(href);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <a className="wordmark" href="#home" aria-label="Habiba Imran — home">
            habiba<span>.</span>
            <span className="brand-spark" aria-hidden="true">
              ✳
            </span>
          </a>
          <nav className="desktop-nav" aria-label="Main navigation">
            {navigation.slice(1).map(({ name, href }) => (
              <a
                key={href}
                href={href}
                aria-current={active === href ? "location" : undefined}
              >
                {name}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <a className="header-cv" href={profile.cv} download>
              Get my CV <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <button
              className="theme-toggle"
              type="button"
              aria-label={
                mounted && resolvedTheme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {mounted && resolvedTheme === "dark" ? (
                <Sun size={17} aria-hidden="true" />
              ) : (
                <Moon size={17} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              className="menu-trigger"
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls={open ? "site-menu" : undefined}
              onClick={() => {
                playTick();
                setOpen(true);
              }}
            >
              Menu{" "}
              <span className="menu-lines" aria-hidden="true">
                <i />
                <i />
              </span>
            </button>
          </div>
        </div>
      </header>
      {open && (
        <Dialog titleId="menu-title" fullScreen onClose={() => setOpen(false)}>
          <div className="menu-top">
            <span className="wordmark">
              habiba<span>.</span>
            </span>
            <span id="menu-title" className="eyebrow">
              A little look around
            </span>
          </div>
          <nav className="overlay-nav" aria-label="Expanded navigation">
            {navigation.slice(1).map(({ name, href }, index) => (
              <a
                key={href}
                href={href}
                style={{ animationDelay: `${index * 65}ms` }}
                onClick={() => setOpen(false)}
              >
                <span className="menu-number">0{index + 1}</span>
                <span>{name}</span>
                <ArrowUpRight aria-hidden="true" />
              </a>
            ))}
            <a href="#voice" onClick={() => setOpen(false)}>
              <span className="menu-number">05</span>
              <span>Voice lab</span>
              <ArrowUpRight aria-hidden="true" />
            </a>
          </nav>
          <div className="menu-bottom">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <a href={profile.cv} download>
              Download CV ↗
            </a>
            <button type="button" className="sound-toggle" onClick={toggleMute}>
              {isMuted ? (
                <VolumeX size={17} aria-hidden="true" />
              ) : (
                <Volume2 size={17} aria-hidden="true" />
              )}
              Sound {isMuted ? "off" : "on"}
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
