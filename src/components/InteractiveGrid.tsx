import { useEffect, useRef, memo } from 'react';
import { useTheme } from '../context/ThemeContext';

interface Dot {
  x: number;
  y: number;
  originX: number;
  originY: number;
  radius: number;
  baseRadius: number;
}

const InteractiveGrid = memo(function InteractiveGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId: number;
    let dots: Dot[] = [];
    const spacing = 32;
    
    // Mouse tracking
    let mouseX = -1000;
    let mouseY = -1000;

    // Theme colors
    const baseColor = theme === 'dark' ? 'rgba(242, 240, 235, 0.06)' : 'rgba(20, 20, 22, 0.08)';
    const accentColor = 'rgba(212, 162, 76, 0.8)'; // Gold accent

    const initGrid = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      dots = [];
      const cols = Math.floor(canvas.width / spacing) + 1;
      const rows = Math.floor(canvas.height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;
          dots.push({
            x,
            y,
            originX: x,
            originY: y,
            radius: 1,
            baseRadius: 1
          });
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        
        let targetX = dot.originX;
        let targetY = dot.originY;
        let targetRadius = dot.baseRadius;
        let currentColor = baseColor;

        if (!prefersReducedMotion) {
          const dx = mouseX - dot.originX;
          const dy = mouseY - dot.originY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist = 120; // Radius of repulsion
          if (dist < maxDist) {
            // Repel logic
            const force = (maxDist - dist) / maxDist; // 0 to 1
            const angle = Math.atan2(dy, dx);
            
            // Move dot away from mouse
            targetX = dot.originX - Math.cos(angle) * force * 15;
            targetY = dot.originY - Math.sin(angle) * force * 15;
            
            // Grow dot slightly
            targetRadius = dot.baseRadius + force * 1.5;
            
            // Mix color
            if (force > 0.5) {
              currentColor = accentColor;
            }
          }
        }

        // Spring physics interpolation
        dot.x += (targetX - dot.x) * 0.15;
        dot.y += (targetY - dot.y) * 0.15;
        dot.radius += (targetRadius - dot.radius) * 0.15;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = currentColor;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    initGrid();
    draw();

    window.addEventListener('resize', initGrid);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', initGrid);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]); // Re-run effect when theme changes to update colors

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
});

export default InteractiveGrid;
