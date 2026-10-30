import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import StatementBand from "@/components/StatementBand";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import Experience from "@/components/Experience";
import VoiceDemo from "@/components/VoiceDemo";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import MotionController from "@/components/MotionController";

export default function Page() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content">
        <Hero />
        <About />
        <StatementBand />
        <Projects />
        <Skills />
        <Experience />
        <VoiceDemo />
        <Contact />
      </main>
      <Footer />
      <MotionController />
    </>
  );
}
