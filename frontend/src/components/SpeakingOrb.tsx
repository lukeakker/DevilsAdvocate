import { useEffect, useRef } from 'react';
import type { UiState } from '../types';

type Props = {
  state: UiState;
};

export function SpeakingOrb({ state }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 300 * dpr;
    canvas.height = 300 * dpr;
    ctx.scale(dpr, dpr);

    const centerX = 150;
    const centerY = 150;
    const baseRadius = 60;
    let phase = 0;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function drawOrb(state: UiState, phase: number) {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, 300, 300);

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 1.5);

      const orbFrom = getComputedStyle(document.documentElement).getPropertyValue('--orb-from').trim();
      const orbTo = getComputedStyle(document.documentElement).getPropertyValue('--orb-to').trim();

      gradient.addColorStop(0, orbFrom);
      gradient.addColorStop(1, orbTo);

      ctx.fillStyle = gradient;
      ctx.shadowBlur = 30;
      ctx.shadowColor = orbFrom;

      if (prefersReducedMotion) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      switch (state) {
        case 'idle': {
          const pulseRadius = baseRadius + Math.sin(phase * 0.5) * 3;
          ctx.beginPath();
          ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'listening': {
          const rippleRadius = baseRadius + Math.sin(phase * 2) * 8;
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.arc(centerX, centerY, rippleRadius * 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'thinking': {
          const breatheRadius = baseRadius + Math.sin(phase * 0.8) * 10;
          ctx.beginPath();
          ctx.arc(centerX, centerY, breatheRadius, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'speaking': {
          ctx.beginPath();
          const segments = 8;
          for (let i = 0; i < segments; i++) {
            const angle = (Math.PI * 2 * i) / segments;
            const distortion = Math.sin(phase * 3 + i * 0.5) * 15;
            const radius = baseRadius + distortion;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              const prevAngle = (Math.PI * 2 * (i - 1)) / segments;
              const prevDistortion = Math.sin(phase * 3 + (i - 1) * 0.5) * 15;
              const prevRadius = baseRadius + prevDistortion;
              const prevX = centerX + Math.cos(prevAngle) * prevRadius;
              const prevY = centerY + Math.sin(prevAngle) * prevRadius;
              const cpX = (prevX + x) / 2;
              const cpY = (prevY + y) / 2;
              ctx.quadraticCurveTo(cpX, cpY, x, y);
            }
          }
          ctx.closePath();
          ctx.fill();
          break;
        }
      }
    }

    function animate() {
      phase += 0.05;
      drawOrb(state, phase);
      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state]);

  return (
    <div className="flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="w-[300px] h-[300px]"
        aria-label={`AI status: ${state}`}
      />
    </div>
  );
}
