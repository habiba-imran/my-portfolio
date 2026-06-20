import { useState, useEffect, Suspense, lazy, Component, ReactNode } from 'react';
import HeroElementFallback from './HeroElementFallback';

const HeroElement3D = lazy(() => import('./HeroElement3D'));

class WebGLErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  componentDidCatch() {
    this.state = { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isLowPowerDevice(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return true;

    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return false;

    const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

    if (renderer.toLowerCase().includes('swiftshader')) return true;
    if (renderer.toLowerCase().includes('llvmpipe')) return true;

    return isMobile();
  } catch {
    return true;
  }
}

interface Props {
  scrollY: number;
}

export default function HeroElement({ scrollY }: Props) {
  const [shouldRender3D, setShouldRender3D] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setIsReady(true);
      return;
    }

    const lowPower = isLowPowerDevice();
    if (lowPower) {
      setIsReady(true);
      return;
    }

    setShouldRender3D(true);
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-32 h-32 border-2 border-dashed border-border rounded-full animate-pulse" />
      </div>
    );
  }

  if (!shouldRender3D) {
    return <HeroElementFallback />;
  }

  return (
    <WebGLErrorBoundary fallback={<HeroElementFallback />}>
      <Suspense fallback={<HeroElementFallback />}>
        <HeroElement3D scrollY={scrollY} />
      </Suspense>
    </WebGLErrorBoundary>
  );
}
