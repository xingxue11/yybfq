import React, { useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { animate, stagger } from 'animejs';

/**
 * Anime.js powered spectrum visualizer.
 * Lightweight, smooth animations using anime.js timelines.
 * Supports three visual modes: bars, wave, particles.
 */
const MODES = {
  bars: { count: 40, label: '柱状' },
  wave: { count: 32, label: '波浪' },
  particles: { count: 24, label: '粒子' },
};

/**
 * Read a CSS custom property from the :root or data-theme element.
 * Falls back to a default if the variable is not found.
 */
function useCSSVar(varName, fallback = '#0071e3') {
  return useMemo(() => {
    try {
      const root = document.querySelector('[data-theme]') || document.documentElement;
      const value = getComputedStyle(root).getPropertyValue(varName).trim();
      return value || fallback;
    } catch {
      return fallback;
    }
  }, [varName, fallback]);
}

/**
 * Generate realistic frequency-like data using perlin-style smooth noise.
 */
function useFreqGenerator(count, isPlaying, speed = 0.1) {
  const dataRef = useRef(Array.from({ length: count }, () => 0.15));
  const phaseRef = useRef(Array.from({ length: count }, () => Math.random() * Math.PI * 2));
  const rafRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) {
      // Idle: gentle sine pattern
      const idle = () => {
        const t = Date.now() * 0.001;
        dataRef.current = dataRef.current.map((_, i) => {
          return 0.08 + 0.1 * Math.sin(t + i * 0.3) + 0.05 * Math.cos(t * 1.3 + i * 0.7);
        });
        rafRef.current = requestAnimationFrame(idle);
      };
      rafRef.current = requestAnimationFrame(idle);
      return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }

    // Playing: dynamic random walk
    const animate = () => {
      for (let i = 0; i < count; i++) {
        phaseRef.current[i] += speed;
        const base = 0.15 + 0.35 * Math.abs(Math.sin(phaseRef.current[i]));
        // Random spikes
        const spike = Math.random() < 0.06 ? 0.4 + Math.random() * 0.5 : 0;
        dataRef.current[i] = Math.max(0.04, Math.min(0.95, base + spike));
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, count, speed]);

  return dataRef;
}

/* ============ Bars Mode ============ */
function BarsVis({ isPlaying, count }) {
  const containerRef = useRef(null);
  const barsRef = useRef([]);
  const dataRef = useFreqGenerator(count, isPlaying);
  const animRef = useRef(null);
  const mountedRef = useRef(false);

  // Use layout effect so bars exist synchronously before the first paint
  // Rebuild when count or playing state changes
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous
    container.innerHTML = '';
    barsRef.current = [];

    // Build bars with initial heights from current frequency data
    const frag = document.createDocumentFragment();
    const currentData = dataRef.current;
    for (let i = 0; i < count; i++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'av-bar-wrap';

      const fill = document.createElement('div');
      fill.className = 'av-bar-fill';
      // Use current frequency data for immediate visibility
      const initialH = Math.max(0.04, currentData[i] || 0.15);
      fill.style.height = `${initialH * 100}%`;

      wrapper.appendChild(fill);
      frag.appendChild(wrapper);
      barsRef.current.push({ wrapper, fill });
    }
    container.appendChild(frag);

    mountedRef.current = true;

    // Continuous height-update loop — interpolates for smooth transitions
    const targetHeights = new Array(count).fill(0.15);
    const tick = () => {
      if (!mountedRef.current) return;
      const data = dataRef.current;
      const bars = barsRef.current;
      // Lerp factor: blend toward target for buttery-smooth motion
      const lerp = isPlaying ? 0.35 : 0.15;
      for (let i = 0; i < bars.length; i++) {
        const target = Math.max(0.03, data[i] || 0.06) * 100;
        targetHeights[i] += (target - targetHeights[i]) * lerp;
        bars[i].fill.style.height = `${targetHeights[i]}%`;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);

    // Entrance animation via animejs when playing
    if (isPlaying) {
      try {
        animate('.av-bar-fill', {
          scaleY: [0, 1],
          duration: 600,
          delay: stagger(30),
          easing: 'easeOutElastic(1, .5)',
        });
      } catch { /* animejs entrance is non-critical */ }
    } else {
      // Idle entrance — gentle fade
      try {
        animate('.av-bar-fill', {
          scaleY: [0.6, 1],
          opacity: [0.5, 1],
          duration: 800,
          delay: stagger(20),
          easing: 'easeOutCubic',
        });
      } catch { /* animejs entrance is non-critical */ }
    }

    return () => {
      mountedRef.current = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [count, isPlaying, dataRef]); // Rebuild bars when count or play state changes; dataRef is stable

  return <div className="av-container av-bars" ref={containerRef} />;
}

/* ============ Wave Mode ============ */
function WaveVis({ isPlaying, count, accentColor, mutedColor }) {
  const canvasRef = useRef(null);
  const dataRef = useFreqGenerator(count, isPlaying, 0.08);
  const animRef = useRef(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w, h;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      w = canvas.width = rect.width * 2;
      h = canvas.height = rect.height * 2;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const data = dataRef.current;
      const centerY = h / 2;
      phaseRef.current += 0.02;

      // Draw multiple wave layers
      const layers = [
        { amp: 0.4, freq: 0.02, speed: 1.0, color: accentColor, alpha: 0.6 },
        { amp: 0.3, freq: 0.03, speed: -1.4, color: accentColor, alpha: 0.35 },
        { amp: 0.2, freq: 0.05, speed: 1.8, color: accentColor, alpha: 0.2 },
      ];

      layers.forEach(layer => {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const t = x / w;
          const dataIdx = Math.floor(t * data.length);
          const dm = data[Math.min(dataIdx, data.length - 1)] || 0.3;
          const y = centerY +
            Math.sin(t * Math.PI * 3 + phaseRef.current * layer.speed) * h * 0.25 * layer.amp * dm +
            Math.cos(t * Math.PI * 5 + phaseRef.current * layer.speed * 1.3) * h * 0.15 * layer.amp * dm;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = layer.color;
        ctx.globalAlpha = layer.alpha;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      if (isPlaying) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    if (isPlaying) {
      animRef.current = requestAnimationFrame(draw);
    } else {
      // Static idle wave
      const drawIdle = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.beginPath();
        const centerY = h / 2;
        for (let x = 0; x <= w; x += 2) {
          const t = x / w;
          const y = centerY + Math.sin(t * Math.PI * 2) * h * 0.06;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = mutedColor;
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
        animRef.current = requestAnimationFrame(drawIdle);
      };
      animRef.current = requestAnimationFrame(drawIdle);
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, count, dataRef, accentColor, mutedColor]);

  return <canvas ref={canvasRef} className="av-canvas" />;
}

/* ============ Particles Mode ============ */
function ParticlesVis({ isPlaying, count, accentColor }) {
  const canvasRef = useRef(null);
  const dataRef = useFreqGenerator(count, isPlaying, 0.12);
  const particlesRef = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w, h;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      w = canvas.width = rect.width * 2;
      h = canvas.height = rect.height * 2;

      // Re-init particles
      particlesRef.current = Array.from({ length: 60 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1.5 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const data = dataRef.current;

      // Update and draw particles
      particlesRef.current.forEach((p, i) => {
        const dataIdx = Math.floor((i / particlesRef.current.length) * data.length);
        const dm = data[Math.min(dataIdx, data.length - 1)] || 0.3;

        if (isPlaying) {
          p.x += p.vx * (0.5 + dm * 3);
          p.y += p.vy * (0.5 + dm * 3);
        } else {
          p.x += p.vx * 0.3;
          p.y += p.vy * 0.3;
        }

        // Wrap around
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        const r = isPlaying ? p.r * (0.6 + dm * 1.5) : p.r * 0.8;

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = isPlaying ? 0.2 + dm * 0.7 : 0.15;
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw connections between nearby particles
      if (isPlaying) {
        const particles = particlesRef.current;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = accentColor;
              ctx.globalAlpha = 0.08 * (1 - dist / 80);
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = 1;
      }

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, count, dataRef, accentColor]);

  return <canvas ref={canvasRef} className="av-canvas" />;
}

/* ============ Main Component ============ */
export default function AnimeVisualizer({ mode = 'bars', isPlaying = false, className = '' }) {
  const ref = useRef(null);
  const config = MODES[mode] || MODES.bars;
  const accentColor = useCSSVar('--accent', '#0071e3');
  const mutedColor = useCSSVar('--text-muted', '#aeaeb2');

  // Anime.js entrance animation
  useEffect(() => {
    if (!ref.current) return;
    try {
      animate(ref.current, {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 500,
        easing: 'easeOutCubic',
      });
    } catch { /* entrance animation is non-critical */ }
  }, [mode]);

  return (
    <div className={`anime-visualizer ${className}`} ref={ref}>
      {mode === 'bars' && <BarsVis isPlaying={isPlaying} count={config.count} accentColor={accentColor} />}
      {mode === 'wave' && <WaveVis isPlaying={isPlaying} count={config.count} accentColor={accentColor} mutedColor={mutedColor} />}
      {mode === 'particles' && <ParticlesVis isPlaying={isPlaying} count={config.count} accentColor={accentColor} />}
    </div>
  );
}

export { MODES };
