import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';

// Dynamically import components "below the fold" to reduce initial bundle size
const About = dynamic(() => import('@/components/About'));
const Skills = dynamic(() => import('@/components/Skills'));
const Projects = dynamic(() => import('@/components/Projects'));
const Experience = dynamic(() => import('@/components/Experience'));
const Contact = dynamic(() => import('@/components/Contact'));
const Footer = dynamic(() => import('@/components/Footer'));

// Disable SSR for components that rely entirely on the browser window (Canvas, Mouse tracking)
const InteractiveGrid = dynamic(() => import('@/components/InteractiveGrid'), { ssr: false });
const Cursor = dynamic(() => import('@/components/Cursor'), { ssr: false });

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
