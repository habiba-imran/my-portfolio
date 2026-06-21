import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Skills from '@/components/Skills';
import Projects from '@/components/Projects';
import Experience from '@/components/Experience';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import Cursor from '@/components/Cursor';
import InteractiveGrid from '@/components/InteractiveGrid';

export default function Page() {
  return (
    <div className="relative min-h-screen">
      <Cursor />
      <div className="noise-overlay" aria-hidden="true" />

      {/* Ambient background effects */}
      <InteractiveGrid />
      <div className="ambient-blob ambient-blob--gold" aria-hidden="true" />
      <div className="ambient-blob ambient-blob--rust" aria-hidden="true" />
      <div className="ambient-blob ambient-blob--subtle" aria-hidden="true" />

      <Navbar />
      <main id="main-content">
        <Hero />
        <hr className="section-divider" />
        <About />
        <hr className="section-divider" />
        <Skills />
        <hr className="section-divider" />
        <Projects />
        <hr className="section-divider" />
        <Experience />
        <hr className="section-divider" />
        <Contact />
      </main>
      <hr className="section-divider" />
      <Footer />
    </div>
  );
}
