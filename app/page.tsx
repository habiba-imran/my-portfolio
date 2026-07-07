import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ScrollProgress from '@/components/ScrollProgress';
import ImpactStrip from '@/components/ImpactStrip';

// Dynamically import components "below the fold" to reduce initial bundle size
const About = dynamic(() => import('@/components/About'));
const Skills = dynamic(() => import('@/components/Skills'));
const Projects = dynamic(() => import('@/components/Projects'));
const Experience = dynamic(() => import('@/components/Experience'));
const Contact = dynamic(() => import('@/components/Contact'));
const Footer = dynamic(() => import('@/components/Footer'));

// Disable SSR for components that rely entirely on the browser window (Mouse tracking)
const Cursor = dynamic(() => import('@/components/Cursor'), { ssr: false });

export default function Page() {
  return (
    <div className="relative min-h-screen">
      <ScrollProgress />
      <Cursor />
      <div className="noise-overlay" aria-hidden="true" />

      <Navbar />
      <main id="main-content">
        <Hero />
        <ImpactStrip />
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
