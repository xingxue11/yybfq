import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

/* ================================================================
   Smooth frequency data generator — target + lerp approach
   ================================================================ */
function useFreqData(binCount, isPlaying, updateMs = 100) {
  const [data, setData] = useState(() => Array.from({ length: binCount }, () => 0.05));
  const currentRef = useRef(Array.from({ length: binCount }, () => 0.05));
  const targetRef = useRef(Array.from({ length: binCount }, () => 0.05));
  const rafRef = useRef(null);
  const lastTargetRef = useRef(0);

  // Generate new target values using smooth random walk
  const updateTargets = useCallback(() => {
    const current = targetRef.current;
    const newTargets = current.map(v => {
      // Smaller random walk for smoother transitions
      const delta = (Math.random() - 0.5) * 0.22;
      let next = v + delta;
      // Occasional larger jumps (less frequent, smaller)
      if (Math.random() < 0.04) next = 0.4 + Math.random() * 0.5;
      return Math.max(0.04, Math.min(0.9, next));
    });
    targetRef.current = newTargets;
  }, []);

  // Lerp current values toward targets every frame
  const tick = useCallback((ts) => {
    // Update targets periodically
    if (ts - lastTargetRef.current >= updateMs) {
      lastTargetRef.current = ts;
      updateTargets();
    }

    // Gentler lerp for smoother transitions
    const lerpFactor = 0.05;
    const cur = currentRef.current;
    const tgt = targetRef.current;
    let changed = false;
    for (let i = 0; i < cur.length; i++) {
      const prev = cur[i];
      cur[i] = prev + (tgt[i] - prev) * lerpFactor;
      if (Math.abs(cur[i] - prev) > 0.0005) changed = true;
    }

    if (changed) {
      setData([...cur]);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [updateMs, updateTargets]);

  useEffect(() => {
    if (isPlaying) {
      lastTargetRef.current = performance.now();
      // Initialize targets to current values to avoid jump
      targetRef.current = [...currentRef.current];
      rafRef.current = requestAnimationFrame(tick);
    } else {
      // Lerp toward static sine-wave pattern
      const lerpToIdle = () => {
        const cur = currentRef.current;
        let changed = false;
        for (let i = 0; i < cur.length; i++) {
          const t = i / cur.length;
          const idle = 0.06 + 0.12 * Math.sin(t * Math.PI * 3) + 0.05 * Math.cos(t * Math.PI * 7);
          const prev = cur[i];
          cur[i] = prev + (idle - prev) * 0.08;
          if (Math.abs(cur[i] - prev) > 0.0005) changed = true;
        }
        if (changed) {
          setData([...cur]);
          rafRef.current = requestAnimationFrame(lerpToIdle);
        }
      };
      rafRef.current = requestAnimationFrame(lerpToIdle);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, tick]);

  return data;
}

/* ================================================================
   1. Linear Bars — 线性柱状 (framer-motion springs)
   ================================================================ */
function LinearBars({ freqData, isPlaying }) {
  return (
    <div className="sv-linear">
      {freqData.map((h, i) => (
        <div key={i} className="sv-linear-bar-wrap">
          <motion.div
            className="sv-linear-bar"
            animate={{ scaleY: Math.max(0.04, h) }}
            transition={{
              type: 'spring',
              stiffness: 120,
              damping: 26,
              mass: 1.0,
            }}
            style={{ originY: 1 }}
          >
            <div className="sv-linear-fill" />
            <div className={`sv-linear-glow ${isPlaying ? 'active' : ''}`} />
          </motion.div>
        </div>
      ))}
      <div className="sv-linear-base-glow" />
    </div>
  );
}

/* ================================================================
   2. Wave — 波浪形
   ================================================================ */
function WaveVis({ freqData, isPlaying }) {
  const width = 800, height = 200;
  const layers = useMemo(() => [
    { amp: 0.35, freq: 2.5, speed: 0.8, opacity: 0.9, yOff: 0.5 },
    { amp: 0.25, freq: 3.8, speed: -1.2, opacity: 0.55, yOff: 0.45 },
    { amp: 0.18, freq: 5.2, speed: 1.6, opacity: 0.35, yOff: 0.55 },
    { amp: 0.10, freq: 7.0, speed: -2.0, opacity: 0.2, yOff: 0.48 },
  ], []);

  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!isPlaying) { setPhase(0); return; }
    let animId;
    const animate = () => {
      setPhase(p => p + 0.008);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const paths = useMemo(() => layers.map((layer, idx) => {
    const centerY = height * layer.yOff;
    const points = 160;
    let d = `M 0 ${centerY}`;
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * width;
      const dataIdx = Math.floor((i / points) * freqData.length);
      const dataMod = freqData[Math.min(dataIdx, freqData.length - 1)] || 0.3;
      const actualAmp = layer.amp * (0.5 + dataMod) * height * 0.45;
      const y = centerY + Math.sin(i * 0.08 * layer.freq + phase * layer.speed) * actualAmp;
      d += ` L ${x} ${y}`;
    }
    d += ` L ${width} ${height} L 0 ${height} Z`;
    return { d, idx };
  }), [freqData, phase, layers, width, height]);

  return (
    <div className="sv-wave">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="sv-wave-svg">
        <defs>
          <linearGradient id="waveGrad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sv-accent)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--sv-accent)" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="waveGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sv-accent-2)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="var(--sv-accent-2)" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="waveGrad3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sv-accent)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--sv-accent)" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="waveGrad4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sv-accent-2)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--sv-accent-2)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {paths.map(({ d, idx }) => (
          <path
            key={idx}
            d={d}
            fill={`url(#waveGrad${idx + 1})`}
            className="sv-wave-path"
          />
        ))}
      </svg>
      <div className={`sv-wave-glow ${isPlaying ? 'active' : ''}`} />
    </div>
  );
}

/* ================================================================
   3. Flowing — 流动形
   ================================================================ */
function FlowingVis({ freqData, isPlaying }) {
  const width = 800, height = 200;
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isPlaying) { setPhase(0); return; }
    let animId;
    const animate = () => {
      setPhase(p => p + 0.006);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const ribbonCount = 5;
  const ribbons = useMemo(() => Array.from({ length: ribbonCount }, (_, ri) => {
    const baseY = height * (0.2 + ri * 0.15);
    const segments = 100;
    let d = `M 0 ${baseY}`;
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      const dataIdx = Math.floor(((i + ri * 10) % segments) / segments * freqData.length);
      const dataMod = freqData[Math.min(dataIdx, freqData.length - 1)] || 0.3;
      const offset = Math.sin(i * 0.15 + phase * (1 + ri * 0.3)) * 30 * dataMod
        + Math.cos(i * 0.25 + phase * 1.4) * 18 * dataMod
        + Math.sin(i * 0.08 - phase * 0.6) * 15;
      d += ` L ${x} ${baseY + offset}`;
    }
    return { d, opacity: 0.18 + ri * 0.04, width: 1.5 + ri * 0.3 };
  }), [freqData, phase, width, height]);

  const particles = useMemo(() => isPlaying ? Array.from({ length: 24 }, (_, i) => {
    const t = ((i * 0.35 + phase * 0.5) % 1 + 1) % 1;
    const x = t * width;
    const ri = i % ribbonCount;
    const baseY = height * (0.2 + ri * 0.15);
    const dataIdx = Math.floor(t * freqData.length);
    const dm = freqData[Math.min(dataIdx, freqData.length - 1)] || 0.3;
    const y = baseY + Math.sin(t * Math.PI * 8 + phase * (1 + ri * 0.3)) * 25 * dm;
    return { x, y, r: 2 + dm * 3, opacity: 0.4 + dm * 0.6 };
  }) : [], [freqData, phase, isPlaying, width, height]);

  return (
    <div className="sv-flowing">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="sv-flowing-svg">
        <defs>
          <filter id="flowBlur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
          <filter id="flowGlow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {ribbons.map((rib, idx) => (
          <path
            key={`rib-${idx}`}
            d={rib.d}
            fill="none"
            stroke="var(--sv-accent)"
            strokeWidth={rib.width}
            strokeOpacity={rib.opacity}
            filter="url(#flowBlur)"
            className="sv-flowing-ribbon"
          />
        ))}
        <path
          d={ribbons[2]?.d}
          fill="none"
          stroke="var(--sv-accent)"
          strokeWidth="2.5"
          strokeOpacity="0.75"
          filter="url(#flowGlow)"
          className="sv-flowing-center"
        />
        {particles.map((p, i) => (
          <circle key={`p-${i}`} cx={p.x} cy={p.y} r={p.r}
            fill="var(--sv-accent)" opacity={p.opacity}
            className="sv-flowing-particle" />
        ))}
      </svg>
    </div>
  );
}

/* ================================================================
   4. Raindrop — 雨滴形
   ================================================================ */
function RaindropVis({ freqData, isPlaying }) {
  const drops = useMemo(() => Array.from({ length: 35 }, (_, i) => {
    const col = i % 10;
    const row = Math.floor(i / 10);
    const x = 5 + col * 10;
    const y = 8 + row * 32;
    const delay = (i * 0.17 + col * 0.4) % 3;
    const size = 3 + (freqData[i % freqData.length] || 0.3) * 10;
    return { id: i, x, y, delay, size };
  }), [freqData]);

  return (
    <div className="sv-raindrop">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="sv-raindrop-svg">
        <defs>
          <radialGradient id="dropGrad">
            <stop offset="0%" stopColor="var(--sv-accent)" stopOpacity="0.45" />
            <stop offset="60%" stopColor="var(--sv-accent)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--sv-accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {Array.from({ length: 20 }, (_, i) => (
          <line
            key={`rain-${i}`}
            x1={2 + i * 5.2} y1={-5 + ((i * 9) % 25)}
            x2={0 + i * 5.2} y2={12 + ((i * 9) % 25)}
            stroke="var(--sv-accent)" strokeWidth="0.4"
            strokeOpacity={0.08 + (freqData[i % freqData.length] || 0.3) * 0.2}
            className={`sv-rain-line ${isPlaying ? 'active' : ''}`}
            style={{ animationDelay: `${i * 0.25}s` }}
          />
        ))}
        {drops.map(d => (
          <g key={d.id}>
            {[1, 2].map(ring => (
              <circle key={ring} cx={d.x} cy={d.y} r={d.size * ring * 0.6}
                fill="none" stroke="var(--sv-accent)" strokeWidth="0.4"
                strokeOpacity={0.18 / ring}
                className={`sv-ripple ${isPlaying ? 'active' : ''}`}
                style={{ animationDelay: `${d.delay + ring * 0.3}s` }} />
            ))}
            <circle cx={d.x} cy={d.y} r={d.size * 0.25}
              fill="url(#dropGrad)"
              className={`sv-drop-core ${isPlaying ? 'active' : ''}`}
              style={{ animationDelay: `${d.delay}s` }} />
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ================================================================
   5. Circular — 环形频谱
   ================================================================ */
function CircularVis({ freqData, isPlaying }) {
  const bars = 48;
  const centerX = 50, centerY = 50;
  const innerR = 6, maxLen = 42;

  return (
    <div className="sv-circular">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="sv-circular-svg">
        <defs>
          <radialGradient id="circGlow">
            <stop offset="0%" stopColor="var(--sv-accent)" stopOpacity="0.3" />
            <stop offset="80%" stopColor="var(--sv-accent)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--sv-accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={centerX} cy={centerY} r={innerR * 1.8} fill="url(#circGlow)"
          className={`sv-circ-glow ${isPlaying ? 'active' : ''}`} />
        {Array.from({ length: bars }, (_, i) => {
          const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
          const h = freqData[i % freqData.length] || 0.2;
          const len = innerR + h * maxLen;
          const x1 = centerX + Math.cos(angle) * innerR;
          const y1 = centerY + Math.sin(angle) * innerR;
          const x2 = centerX + Math.cos(angle) * len;
          const y2 = centerY + Math.sin(angle) * len;
          return (
            <motion.line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="var(--sv-accent)"
              strokeWidth={1.0 + h * 2.0}
              strokeLinecap="round"
              strokeOpacity={0.55 + h * 0.25}
              className="sv-circ-bar"
              animate={{ opacity: isPlaying ? 0.7 : 0.3 }}
              transition={{ duration: 0.3 }}
            />
          );
        })}
      </svg>
    </div>
  );
}

/* ================================================================
   6. Particles — 粒子跳动
   ================================================================ */
function ParticlesVis({ freqData, isPlaying }) {
  const particles = useMemo(() => Array.from({ length: 55 }, (_, i) => {
    const angle = (i / 55) * Math.PI * 2;
    const dist = 12 + (i % 7) * 6.5;
    return {
      id: i,
      baseX: 50 + Math.cos(angle) * dist,
      baseY: 50 + Math.sin(angle) * dist,
      size: 1.2 + (i % 4) * 0.6,
      delay: (i * 0.15) % 2,
      speed: 0.8 + (i % 3) * 0.6,
    };
  }), []);

  return (
    <div className="sv-particles">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="sv-particles-svg">
        <defs>
          <filter id="partGlow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" />
          </filter>
        </defs>
        {isPlaying && particles.slice(0, 40).map((p, i) => {
          const next = particles[(i + 1) % particles.length];
          const dx = p.baseX - next.baseX;
          const dy = p.baseY - next.baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 22) return null;
          return (
            <line key={`conn-${i}`}
              x1={p.baseX} y1={p.baseY} x2={next.baseX} y2={next.baseY}
              stroke="var(--sv-accent)" strokeWidth="0.2"
              strokeOpacity={0.06 * (1 - dist / 22)}
              className="sv-part-conn" />
          );
        })}
        {particles.map(p => {
          const fi = Math.floor((p.id / particles.length) * freqData.length);
          const amp = freqData[Math.min(fi, freqData.length - 1)] || 0.3;
          const r = p.size * (0.5 + amp * 1.2);
          return (
            <motion.circle
              key={p.id}
              cx={p.baseX} cy={p.baseY} r={r}
              fill="var(--sv-accent)"
              opacity={0.15 + amp * 0.35}
              filter="url(#partGlow)"
              animate={{
                r: [r, r * 1.3, r],
                opacity: [0.15 + amp * 0.35, 0.25 + amp * 0.25, 0.15 + amp * 0.35],
              }}
              transition={{
                duration: p.speed,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}

/* ================================================================
   7. Fire — 火焰跳动 (framer-motion springs)
   ================================================================ */
function FireVis({ freqData, isPlaying }) {
  const flames = 28;
  const width = 800, height = 200;

  return (
    <div className="sv-fire">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="sv-fire-svg">
        <defs>
          <filter id="fireBlur1">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
          <filter id="fireBlur2">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
          </filter>
          <linearGradient id="fireGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="var(--sv-accent)" stopOpacity="0.9" />
            <stop offset="30%" stopColor="var(--sv-accent-2)" stopOpacity="0.7" />
            <stop offset="65%" stopColor="#ff9500" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ff3b30" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx={width / 2} cy={height - 5} rx={width * 0.45} ry={18}
          fill="var(--sv-accent)" opacity="0.25" filter="url(#fireBlur2)"
          className={`sv-fire-base ${isPlaying ? 'active' : ''}`} />
        {Array.from({ length: flames }, (_, i) => {
          const h = (freqData[i % freqData.length] || 0.15);
          const barW = width / flames;
          const x = i * barW + barW * 0.2;
          const barActualW = barW * 0.6;
          const flameH = h * height * 0.85;
          return (
            <motion.rect
              key={i}
              x={x}
              width={barActualW}
              rx={barActualW / 2}
              fill="url(#fireGrad)"
              filter="url(#fireBlur1)"
              className="sv-fire-bar"
              animate={{
                y: height - flameH,
                height: flameH,
              }}
              transition={{
                type: 'spring',
                stiffness: 100,
                damping: 24,
                mass: 1.0,
              }}
            />
          );
        })}
        {isPlaying && Array.from({ length: 14 }, (_, i) => {
          const x = 40 + (i / 14) * (width - 80);
          const fi = Math.floor((i / 14) * freqData.length);
          const amp = freqData[Math.min(fi, freqData.length - 1)] || 0.3;
          const y = height - 30 - amp * height * 0.6;
          return (
            <circle key={`ember-${i}`}
              cx={x} cy={y} r={1 + amp * 3}
              fill="#ff9500" opacity={0.2 + amp * 0.6}
              filter="url(#fireBlur1)"
              className="sv-ember"
              style={{ animationDelay: `${i * 0.2}s` }} />
          );
        })}
      </svg>
    </div>
  );
}

/* ================================================================
   Main SpectrumVisualizer Component
   ================================================================ */
const MODE_COMPONENTS = {
  linear: LinearBars,
  wave: WaveVis,
  flowing: FlowingVis,
  raindrop: RaindropVis,
  circular: CircularVis,
  particles: ParticlesVis,
  fire: FireVis,
};

const MODE_BIN_COUNTS = {
  linear: 40,
  wave: 32,
  flowing: 32,
  raindrop: 22,
  circular: 48,
  particles: 24,
  fire: 30,
};

export default function SpectrumVisualizer({ mode, isPlaying, className }) {
  const binCount = MODE_BIN_COUNTS[mode] || 32;
  const freqData = useFreqData(binCount, isPlaying, 80);

  const Comp = MODE_COMPONENTS[mode];
  if (!Comp) return null;

  return (
    <div className={`spectrum-visualizer sv-${mode} ${className || ''}`}>
      <Comp freqData={freqData} isPlaying={isPlaying} />
    </div>
  );
}

export {
  LinearBars, WaveVis, FlowingVis, RaindropVis,
  CircularVis, ParticlesVis, FireVis,
};
