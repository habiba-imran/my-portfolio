import { useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Experience from './components/Experience';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Cursor from './components/Cursor';
import SplashScreen from './components/SplashScreen';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const handlePreloaderComplete = useCallback(() => {
    setIsLoaded(true);
  }, []);


  if (!isLoaded) {
    return <SplashScreen onComplete={handlePreloaderComplete} />;
  }

  return (
    <div className="relative min-h-screen">
      <Cursor />
      <div className="noise-overlay" aria-hidden="true" />

      {/* Ambient background effects */}
      <div className="dot-grid" aria-hidden="true" />
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

export default App;
