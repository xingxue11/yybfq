import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusic } from '../context/MusicContext';
import { formatTime } from '../utils/helpers';
import { PLAY_MODES, LYRIC_STYLES, PLAYER_TABS, AUDIO_FORMATS, IMMERSIVE_SPECTRUM_MODES, IMMERSIVE_BG_ANIMATIONS, IMMERSIVE_LYRIC_STYLES } from '../utils/constants';
import AnimeVisualizer from './AnimeVisualizer';
import SpectrumVisualizer from './SpectrumVisualizer';
import ThreeBackground from './ThreeBackground';
import CommentSection from './CommentSection';
import DanmakuOverlay from './DanmakuOverlay';
import { DANMAKU_MODES, DANMAKU_DENSITIES } from '../utils/constants';
import Icon, { HeartFilled, HeartOutline, PlayIcon, PauseIcon, VolumeIcon } from './Icons';

/* ===== Immersive Background Animations ===== */

function GlowBg() {
  const orbs = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    size: 280 + i * 90 + Math.sin(i * 1.7) * 50,
    xBase: 10 + i * 16,
    yBase: 10 + i * 16,
    hueShift: i * 50,
    dur: 6 + i * 2.2,
    delay: i * 1.1,
  })), []);
  return (
    <div className="immersive-bg-anim immersive-bg-glow">
      {orbs.map((o, i) => (
        <motion.div key={i} className="immersive-glow-orb"
          style={{
            width: o.size, height: o.size,
            left: `${o.xBase}%`, top: `${o.yBase}%`,
            '--hue-shift': o.hueShift,
          }}
          animate={{
            x: [0, 70, -40, 30, -15, 0],
            y: [0, -50, 30, -20, 40, 0],
            scale: [1, 1.2, 0.85, 1.12, 0.95, 1],
            opacity: [0.28, 0.4, 0.2, 0.35, 0.22, 0.28],
          }}
          transition={{
            duration: o.dur,
            delay: o.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function ParticlesBg() {
  // ===== Chaotic burst particles (200) — random positions, sizes, trajectories =====
  const burst = useMemo(() => Array.from({ length: 200 }, (_, i) => ({
    id: `b-${i}`,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 1 + Math.random() * 7,
    dur: 2 + Math.random() * 5,
    delay: Math.random() * 4,
    hue: 180 + Math.random() * 100,
    xAmp: (Math.random() - 0.5) * 120,
    yAmp: (Math.random() - 0.5) * 120,
    xAmp2: (Math.random() - 0.5) * 80,
    yAmp2: (Math.random() - 0.5) * 80,
  })), []);

  // ===== Swarm particles (150) — messy swirling clusters =====
  const swarm = useMemo(() => Array.from({ length: 150 }, (_, i) => {
    const cx = 30 + (i % 5) * 15 + Math.random() * 10;
    const cy = 25 + Math.floor(i / 50) * 35 + Math.random() * 15;
    const orbitR = 10 + Math.random() * 35;
    return {
      id: `s-${i}`,
      centerX: cx,
      centerY: cy,
      orbitR,
      angle: Math.random() * Math.PI * 2,
      size: 1.5 + Math.random() * 5,
      dur: 3 + Math.random() * 6,
      delay: Math.random() * 3,
      hue: 190 + Math.random() * 80,
      clockwise: Math.random() > 0.5,
      wobble: Math.random() * 15,
      opacity: 0.3 + Math.random() * 0.6,
    };
  }), []);

  // ===== Shooting streaks (40) — fast diagonal flashes =====
  const streaks = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    id: `st-${i}`,
    left: Math.random() * 90,
    top: Math.random() * 80,
    size: 1.5 + Math.random() * 3,
    dur: 0.6 + Math.random() * 1.2,
    delay: i * 0.4 + Math.random() * 6,
    angle: (Math.random() - 0.5) * 60,
    hue: 200 + Math.random() * 40,
  })), []);

  // ===== Floating embers (80) — rising with chaotic drift =====
  const embers = useMemo(() => Array.from({ length: 80 }, (_, i) => ({
    id: `e-${i}`,
    left: Math.random() * 100,
    size: 1.5 + Math.random() * 5,
    dur: 2.5 + Math.random() * 5,
    delay: Math.random() * 5,
    hue: 180 + Math.random() * 80,
    path: Array.from({ length: 5 }, () => (Math.random() - 0.5) * 90),
  })), []);

  return (
    <div className="immersive-bg-anim immersive-bg-particles">
      {burst.map(p => (
        <motion.div key={p.id} className="imm-galaxy-particle"
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size, '--particle-hue': p.hue, '--particle-opacity': 0.7 }}
          animate={{ x: [0, p.xAmp, p.xAmp2, -p.xAmp * 0.6, p.xAmp * 0.3, 0], y: [0, p.yAmp, p.yAmp2, -p.yAmp * 0.5, p.yAmp * 0.4, 0], opacity: [0, 0.9, 0.5, 0.8, 0.2, 0], scale: [0, 1.5, 0.4, 1, 0.3, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
      {swarm.map(p => (
        <motion.div key={p.id} className="imm-galaxy-particle"
          style={{ left: `${p.centerX}%`, top: `${p.centerY}%`, width: p.size, height: p.size, '--particle-hue': p.hue, '--particle-opacity': p.opacity }}
          animate={{ x: [Math.cos(p.angle) * p.orbitR, Math.cos(p.angle + 1.2) * (p.orbitR + p.wobble), Math.cos(p.angle + 2.5) * (p.orbitR - p.wobble * 0.6), Math.cos(p.angle + 3.8) * (p.orbitR + p.wobble * 0.8), Math.cos(p.angle + 5.0) * p.orbitR, Math.cos(p.angle + 6.2) * (p.orbitR - p.wobble * 0.4)], y: [Math.sin(p.angle) * p.orbitR, Math.sin(p.angle + 1.2) * (p.orbitR - p.wobble * 0.5), Math.sin(p.angle + 2.5) * (p.orbitR + p.wobble * 0.7), Math.sin(p.angle + 3.8) * (p.orbitR - p.wobble * 0.3), Math.sin(p.angle + 5.0) * p.orbitR, Math.sin(p.angle + 6.2) * (p.orbitR + p.wobble * 0.5)], opacity: [p.opacity * 0.3, p.opacity, p.opacity * 0.5, p.opacity, p.opacity * 0.4, p.opacity * 0.3], scale: [0.4, 1.2, 0.7, 1.1, 0.5, 0.4] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
      {streaks.map(s => (
        <motion.div key={s.id} className="imm-sparkle"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size * 4, '--particle-hue': s.hue, borderRadius: '40%' }}
          animate={{ x: [0, Math.cos(s.angle) * 200, Math.cos(s.angle) * 300], y: [0, Math.sin(s.angle) * 100, Math.sin(s.angle) * 200], opacity: [0, 1, 0], scale: [0.2, 1.5, 0] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeOut' }} />
      ))}
      {embers.map(e => (
        <motion.div key={e.id} className="imm-drift-particle"
          style={{ left: `${e.left}%`, width: e.size, height: e.size, '--particle-hue': e.hue }}
          animate={{ y: ['110vh', '-10vh'], x: [0, e.path[0], e.path[1], e.path[2], e.path[3], e.path[4], 0], opacity: [0, 0.85, 0.5, 0.7, 0.3, 0.6, 0], scale: [0.2, 1.3, 0.6, 1, 0.4, 0.7, 0.1] }}
          transition={{ duration: e.dur, delay: e.delay, repeat: Infinity, ease: 'linear' }} />
      ))}
    </div>
  );
}

function RipplesBg() {
  const rippleCenters = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    left: 8 + i * 12, top: 15 + (i % 4) * 22, delay: i * 0.7, dur: 2.8 + (i % 3) * 0.6, size: 1.5 + (i % 3) * 1.5, hue: 190 + i * 20,
  })), []);
  return (
    <div className="immersive-bg-anim immersive-bg-ripples">
      {rippleCenters.map((rc, i) => (
        <motion.div key={i} className="immersive-ripple-ring"
          style={{ left: `${rc.left}%`, top: `${rc.top}%`, width: 40 + rc.size * 10, height: 40 + rc.size * 10, '--ripple-hue': rc.hue }}
          animate={{ scale: [0, 5], opacity: [0.6, 0] }}
          transition={{ duration: rc.dur, delay: rc.delay, repeat: Infinity, ease: 'easeOut' }} />
      ))}
    </div>
  );
}

function AuroraBg() {
  return (
    <div className="immersive-bg-anim immersive-bg-aurora">
      <motion.div className="immersive-aurora-layer immersive-aurora-1" animate={{ x: ['-35%', '35%', '-35%'], opacity: [0.4, 0.65, 0.4], scaleX: [1, 1.2, 1] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="immersive-aurora-layer immersive-aurora-2" animate={{ x: ['30%', '-30%', '30%'], opacity: [0.35, 0.6, 0.35], scaleX: [1.1, 0.9, 1.1] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }} />
      <motion.div className="immersive-aurora-layer immersive-aurora-3" animate={{ x: ['-20%', '20%', '-20%'], opacity: [0.3, 0.55, 0.3], scaleY: [1, 1.15, 1] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 5 }} />
      <motion.div className="immersive-aurora-layer immersive-aurora-4" animate={{ x: ['15%', '-25%', '15%'], opacity: [0.25, 0.5, 0.25], scaleX: [0.9, 1.15, 0.9] }} transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 7 }} />
    </div>
  );
}

function StardustBg() {
  const stars = useMemo(() => Array.from({ length: 120 }, (_, i) => ({
    left: Math.random() * 100, top: Math.random() * 100, size: 1.5 + Math.random() * 4.5, delay: Math.random() * 6, dur: 1.2 + Math.random() * 3.5, driftDur: 8 + Math.random() * 20, hue: 200 + Math.random() * 40, glow: Math.random() > 0.6,
  })), []);
  const shootingStars = useMemo(() => Array.from({ length: 3 }, (_, i) => ({
    left: 10 + Math.random() * 80, top: 5 + Math.random() * 50, delay: i * 4 + Math.random() * 5, dur: 1.5 + Math.random() * 1.5, angle: -20 + Math.random() * -30,
  })), []);
  return (
    <div className="immersive-bg-anim immersive-bg-stardust">
      <div className="imm-stardust-nebula" />
      <div className="imm-stardust-nebula imm-stardust-nebula-2" />
      {stars.map((s, i) => (
        <motion.div key={`star-${i}`} className={`imm-star ${s.glow ? 'imm-star-glow' : ''}`}
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, '--star-hue': s.hue }}
          animate={{ opacity: [0.15, 1, 0.2, 0.95, 0.15], scale: [0.6, 1.4, 0.7, 1.2, 0.6] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
      {shootingStars.map((ss, i) => (
        <motion.div key={`shoot-${i}`} className="imm-shooting-star"
          style={{ left: `${ss.left}%`, top: `${ss.top}%`, '--shoot-angle': `${ss.angle}deg` }}
          animate={{ opacity: [0, 1, 0], x: [0, 300], y: [0, 80] }}
          transition={{ duration: ss.dur, delay: ss.delay, repeat: Infinity, ease: 'easeOut' }} />
      ))}
    </div>
  );
}

const BG_ANIM_MAP = {
  glow: GlowBg,
  stardust: StardustBg,
  particles: ParticlesBg,
  ripples: RipplesBg,
  aurora: AuroraBg,
  none: () => null,
};

/* ===== Immersive Mode Overlay ===== */
function ImmersiveMode({ lyrics, activeLyricIndex, isPlaying, currentTime, duration, onExit,
  togglePlay, handlePrev, handleNext, handleSeek,
  currentSong, favorites, toggleFavorite,
  playMode, cyclePlayMode,
  spectrumMode, setSpectrumMode,
  lyricStyle, setLyricStyle,
  bgAnim, setBgAnim,
  lyricTransition,
  danmakuMode, setDanmakuMode,
  danmakuDensity, setDanmakuDensity }) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const BgComponent = BG_ANIM_MAP[bgAnim] || BG_ANIM_MAP.glow;
  const modeInfo = PLAY_MODES.find(m => m.key === playMode) || PLAY_MODES[0];
  const isFav = currentSong ? favorites.includes(currentSong.id) : false;

  const handleProgressClick = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    handleSeek({ target: { value: ratio * duration } });
  };

  const FULLSCREEN_SPECTRUM_MODES = ['raindrop', 'circular', 'particles'];
  const isFullscreenSpectrum = FULLSCREEN_SPECTRUM_MODES.includes(spectrumMode);

  const [uiVisible, setUiVisible] = useState(true);
  const idleTimerRef = useRef(null);
  const IDLE_DELAY = 5000;

  const handleMouseMove = useCallback(() => {
    setUiVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => { setUiVisible(false); }, IDLE_DELAY);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    idleTimerRef.current = setTimeout(() => { setUiVisible(false); }, IDLE_DELAY);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [handleMouseMove]);

  const getTransitionVariants = (dist) => {
    const isActive = dist === 0;
    switch (lyricTransition) {
      case 'slide': return { initial: { opacity: 0, x: dist > 0 ? 80 : -80, scale: 0.95 }, animate: { opacity: isActive ? 1 : 0.25 + Math.max(0, 0.25 - Math.abs(dist) * 0.08), x: 0, scale: isActive ? 1 : 0.96 }, exit: { opacity: 0, x: dist > 0 ? -80 : 80, scale: 0.95 } };
      case 'blur': return { initial: { opacity: 0, filter: 'blur(12px)' }, animate: { opacity: isActive ? 1 : 0.25 + Math.max(0, 0.25 - Math.abs(dist) * 0.08), filter: 'blur(0px)' }, exit: { opacity: 0, filter: 'blur(12px)' } };
      case 'scale': return { initial: { opacity: 0, scale: 0.7 }, animate: { opacity: isActive ? 1 : 0.25 + Math.max(0, 0.25 - Math.abs(dist) * 0.08), scale: 1 }, exit: { opacity: 0, scale: 0.7 } };
      case 'flip': return { initial: { opacity: 0, rotateX: -90 }, animate: { opacity: isActive ? 1 : 0.25 + Math.max(0, 0.25 - Math.abs(dist) * 0.08), rotateX: 0 }, exit: { opacity: 0, rotateX: 90 } };
      case 'bounce': return { initial: { opacity: 0, y: dist > 0 ? 40 : -40, scale: 0.8 }, animate: { opacity: isActive ? 1 : 0.25 + Math.max(0, 0.25 - Math.abs(dist) * 0.08), y: 0, scale: 1 }, exit: { opacity: 0, y: dist > 0 ? -40 : 40, scale: 0.8 } };
      case 'spring': return { initial: { opacity: 0, scale: 0.5, y: dist > 0 ? 50 : -50 }, animate: { opacity: isActive ? 1 : 0.25 + Math.max(0, 0.25 - Math.abs(dist) * 0.08), scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.5, y: dist > 0 ? -50 : 50 } };
      case 'glitch': return { initial: { opacity: 0, x: [0, -4, 4, -2, 0][Math.abs(dist) % 5] * 6, filter: 'hue-rotate(90deg)' }, animate: { opacity: isActive ? 1 : 0.25 + Math.max(0, 0.25 - Math.abs(dist) * 0.08), x: 0, filter: 'hue-rotate(0deg)' }, exit: { opacity: 0, x: [-3, 5, -5, 3][Math.abs(dist) % 4] * 5, filter: 'hue-rotate(-90deg)' } };
      case 'swing': return { initial: { opacity: 0, rotateZ: dist > 0 ? 15 : -15, y: dist > 0 ? 30 : -30 }, animate: { opacity: isActive ? 1 : 0.25 + Math.max(0, 0.25 - Math.abs(dist) * 0.08), rotateZ: 0, y: 0 }, exit: { opacity: 0, rotateZ: dist > 0 ? -15 : 15, y: dist > 0 ? -30 : 30 } };
      case 'twirl': return { initial: { opacity: 0, rotateY: dist > 0 ? 180 : -180, scale: 0.3 }, animate: { opacity: isActive ? 1 : 0.25 + Math.max(0, 0.25 - Math.abs(dist) * 0.08), rotateY: 0, scale: 1 }, exit: { opacity: 0, rotateY: dist > 0 ? -180 : 180, scale: 0.3 } };
      default: return { initial: { opacity: 0, y: dist > 0 ? 30 : -30, scale: 0.92 }, animate: { opacity: isActive ? 1 : 0.25 + Math.max(0, 0.25 - Math.abs(dist) * 0.08), y: 0, scale: isActive ? 1 : 0.94 + Math.max(0, 0.06 - Math.abs(dist) * 0.015) }, exit: { opacity: 0, y: dist > 0 ? -30 : 30, scale: 0.92 } };
    }
  };

  const getTransitionConfig = () => {
    switch (lyricTransition) {
      case 'bounce': return { duration: 0.65, ease: [0.34, 1.56, 0.64, 1] };
      case 'spring': return { duration: 0.75, ease: [0.34, 1.56, 0.64, 1] };
      case 'flip': return { duration: 0.65, ease: [0.4, 0, 0.2, 1] };
      case 'slide': return { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] };
      case 'blur': return { duration: 0.6, ease: 'easeOut' };
      case 'scale': return { duration: 0.55, ease: [0.34, 1.56, 0.64, 1] };
      case 'glitch': return { duration: 0.4, ease: 'easeOut' };
      case 'swing': return { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] };
      case 'twirl': return { duration: 0.65, ease: [0.4, 0, 0.2, 1] };
      default: return { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] };
    }
  };

  return (
    <div className="immersive-overlay">
      <div className="immersive-bg"><BgComponent /></div>

      {isFullscreenSpectrum && (
        <div className="immersive-spectrum-fullscreen">
          <SpectrumVisualizer mode={spectrumMode} isPlaying={isPlaying} className="immersive-sv-fullscreen" />
        </div>
      )}

      <DanmakuOverlay currentSong={currentSong} mode={danmakuMode} density={danmakuDensity} isPlaying={isPlaying} />

      {/* Top bar */}
      <div className={`immersive-top${uiVisible ? ' visible' : ''}`}>
        <div className="immersive-top-left"><AudioMonitor isPlaying={isPlaying} variant="immersive" /></div>
        <div className="immersive-top-center">
          <div className="immersive-style-dots" title="歌词样式">
            {IMMERSIVE_LYRIC_STYLES.map(ls => (
              <button key={ls.key} className={`immersive-style-dot ${lyricStyle === ls.key ? 'active' : ''}`}
                onClick={() => setLyricStyle(ls.key)} title={ls.label}>
                <Icon name={ls.icon} size={14} />
              </button>
            ))}
          </div>
          <div className="immersive-bg-dots" title="背景动画">
            {IMMERSIVE_BG_ANIMATIONS.map(ba => (
              <button key={ba.key} className={`immersive-bg-dot ${bgAnim === ba.key ? 'active' : ''}`}
                onClick={() => setBgAnim(ba.key)} title={ba.label}>
                <Icon name={ba.icon} size={14} />
              </button>
            ))}
          </div>
          <div className="immersive-danmaku-dots" title="弹幕模式">
            <span className="immersive-danmaku-label">弹幕</span>
            {DANMAKU_MODES.map(dm => (
              <button key={dm.key} className={`immersive-danmaku-dot ${danmakuMode === dm.key ? 'active' : ''}`}
                onClick={() => setDanmakuMode(dm.key)} title={dm.label}>
                <Icon name={dm.icon} size={14} />
              </button>
            ))}
            <button className="immersive-danmaku-density"
              onClick={() => {
                const keys = DANMAKU_DENSITIES.map(d => d.key);
                const idx = keys.indexOf(danmakuDensity);
                setDanmakuDensity(keys[(idx + 1) % keys.length]);
              }}
              title={`弹幕密度: ${DANMAKU_DENSITIES.find(d => d.key === danmakuDensity)?.label || '适中'}`}>
              {DANMAKU_DENSITIES.find(d => d.key === danmakuDensity)?.label || '适中'}
            </button>
          </div>
        </div>
        <div className="immersive-top-right">
          {currentSong && (
            <button className={`immersive-fav-btn ${isFav ? 'favorited' : ''}`}
              onClick={() => toggleFavorite(currentSong.id)}
              title={isFav ? '取消收藏' : '收藏歌曲'}>
              {isFav ? <HeartFilled size={18} /> : <HeartOutline size={18} />}
            </button>
          )}
          <button className="immersive-exit-btn" onClick={onExit}>
            <Icon name="x" size={16} /> 退出
          </button>
        </div>
      </div>

      {/* Center lyrics */}
      <AnimatePresence mode="wait">
        <motion.div key={`${lyricStyle}-${lyricTransition}`} className={`immersive-lyrics`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          {lyrics.length === 0 ? (
            <div className="immersive-empty">
              <div className="immersive-empty-icon"><Icon name="music" size={48} /></div>
              <p>暂无歌词，请添加歌词后体验沉浸模式</p>
            </div>
          ) : lyricStyle === 'minimal' ? (
            <div className="imm-lyric-minimal">
              {activeLyricIndex >= 0 && (
                <motion.div key={activeLyricIndex} className="imm-lyric-minimal-line" {...getTransitionVariants(0)} transition={getTransitionConfig()}>
                  {lyrics[activeLyricIndex].text}
                </motion.div>
              )}
              {activeLyricIndex + 1 < lyrics.length && (
                <motion.div key={`next-${activeLyricIndex + 1}`} className="imm-lyric-minimal-next"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 0.4, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
                  {lyrics[activeLyricIndex + 1].text}
                </motion.div>
              )}
            </div>
          ) : lyricStyle === 'scroll' ? (
            <div className="imm-lyric-scroll">
              {lyrics.map((line, i) => {
                const dist = i - activeLyricIndex;
                const variants = getTransitionVariants(dist);
                return (
                  <motion.div key={i} className={`imm-lyric-scroll-line ${dist === 0 ? 'active' : ''}`}
                    initial={variants.initial} animate={variants.animate} transition={getTransitionConfig()}>
                    {line.text}
                  </motion.div>
                );
              })}
            </div>
          ) : lyricStyle === 'karaoke' ? (
            <div className="imm-lyric-karaoke">
              {activeLyricIndex >= 0 && (
                <motion.div key={activeLyricIndex} className="imm-lyric-karaoke-line"
                  style={{ '--progress': `${Math.max(0, Math.min(100, (currentTime - lyrics[activeLyricIndex].time) / Math.max(0.1, (lyrics[activeLyricIndex + 1]?.time || duration) - lyrics[activeLyricIndex].time) * 100))}%` }}
                  {...getTransitionVariants(0)} transition={getTransitionConfig()}>
                  <span className="imm-lyric-karaoke-fill">{lyrics[activeLyricIndex].text}</span>
                  <span className="imm-lyric-karaoke-text">{lyrics[activeLyricIndex].text}</span>
                </motion.div>
              )}
              {activeLyricIndex + 1 < lyrics.length && (
                <motion.div key={`next-${activeLyricIndex + 1}`} className="imm-lyric-karaoke-next"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 0.35, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
                  {lyrics[activeLyricIndex + 1].text}
                </motion.div>
              )}
            </div>
          ) : lyricStyle === 'neon' ? (
            <div className="imm-lyric-neon">
              {(() => {
                const visibleLyrics = [];
                for (let i = Math.max(0, activeLyricIndex - 4); i <= Math.min(lyrics.length - 1, activeLyricIndex + 4); i++) {
                  visibleLyrics.push({ ...lyrics[i], index: i, dist: i - activeLyricIndex });
                }
                return (
                  <AnimatePresence mode="popLayout">
                    {visibleLyrics.map((line) => {
                      const variants = getTransitionVariants(line.dist);
                      return (
                        <motion.div key={line.index} className={`imm-lyric-neon-line ${line.dist === 0 ? 'active' : ''}`} data-dist={Math.abs(line.dist)} layout
                          initial={variants.initial} animate={variants.animate} exit={variants.exit} transition={getTransitionConfig()}>
                          <span className="imm-lyric-neon-glow">{line.text}</span>
                          <span className="imm-lyric-neon-core">{line.text}</span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                );
              })()}
            </div>
          ) : lyricStyle === 'typewriter' ? (
            <div className="imm-lyric-typewriter">
              {(() => {
                const visibleLyrics = [];
                for (let i = Math.max(0, activeLyricIndex - 2); i <= Math.min(lyrics.length - 1, activeLyricIndex + 2); i++) {
                  visibleLyrics.push({ ...lyrics[i], index: i, dist: i - activeLyricIndex });
                }
                return (
                  <AnimatePresence mode="popLayout">
                    {visibleLyrics.map((line) => {
                      const variants = getTransitionVariants(line.dist);
                      return (
                        <motion.div key={line.index} className={`imm-lyric-typewriter-line ${line.dist === 0 ? 'active' : ''}`} data-dist={Math.abs(line.dist)} layout
                          initial={variants.initial} animate={variants.animate} exit={variants.exit} transition={getTransitionConfig()}>
                          {line.dist === 0 ? (
                            <span className="imm-typewriter-reveal">
                              {line.text.split('').map((char, ci) => (
                                <motion.span key={ci} className="imm-typewriter-char" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                  transition={{ delay: ci * 0.03, duration: 0.1 }}>
                                  {char === ' ' ? ' ' : char}
                                </motion.span>
                              ))}
                              <motion.span className="imm-typewriter-caret" animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}>|</motion.span>
                            </span>
                          ) : (
                            <span>{line.text}</span>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                );
              })()}
            </div>
          ) : lyricStyle === 'spotlight' ? (
            <div className="imm-lyric-spotlight">
              {(() => {
                const visibleLyrics = [];
                for (let i = Math.max(0, activeLyricIndex - 5); i <= Math.min(lyrics.length - 1, activeLyricIndex + 5); i++) {
                  visibleLyrics.push({ ...lyrics[i], index: i, dist: i - activeLyricIndex });
                }
                return (
                  <AnimatePresence mode="popLayout">
                    {visibleLyrics.map((line) => {
                      const variants = getTransitionVariants(line.dist);
                      return (
                        <motion.div key={line.index} className={`imm-lyric-spotlight-line ${line.dist === 0 ? 'active' : ''}`} data-dist={Math.abs(line.dist)} layout
                          initial={variants.initial} animate={variants.animate} exit={variants.exit} transition={getTransitionConfig()}>
                          {line.text}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                );
              })()}
            </div>
          ) : lyricStyle === 'card' ? (
            <div className="imm-lyric-card">
              {(() => {
                const visibleLyrics = [];
                for (let i = Math.max(0, activeLyricIndex - 1); i <= Math.min(lyrics.length - 1, activeLyricIndex + 1); i++) {
                  visibleLyrics.push({ ...lyrics[i], index: i, dist: i - activeLyricIndex });
                }
                return (
                  <AnimatePresence mode="popLayout">
                    {visibleLyrics.map((line) => {
                      const variants = getTransitionVariants(line.dist);
                      return (
                        <motion.div key={line.index} className={`imm-lyric-card-line ${line.dist === 0 ? 'active' : line.dist < 0 ? 'prev' : 'next'}`} data-dist={Math.abs(line.dist)} layout
                          initial={variants.initial} animate={variants.animate} exit={variants.exit} transition={getTransitionConfig()}>
                          {line.text}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                );
              })()}
            </div>
          ) : lyricStyle === 'wave' ? (
            <div className="imm-lyric-wave">
              {(() => {
                const visibleLyrics = [];
                for (let i = Math.max(0, activeLyricIndex - 2); i <= Math.min(lyrics.length - 1, activeLyricIndex + 2); i++) {
                  visibleLyrics.push({ ...lyrics[i], index: i, dist: i - activeLyricIndex });
                }
                return (
                  <AnimatePresence mode="popLayout">
                    {visibleLyrics.map((line) => {
                      const variants = getTransitionVariants(line.dist);
                      return (
                        <motion.div key={line.index} className={`imm-lyric-wave-line ${line.dist === 0 ? 'active' : ''}`} data-dist={Math.abs(line.dist)} layout
                          initial={variants.initial} animate={variants.animate} exit={variants.exit} transition={getTransitionConfig()}>
                          {line.dist === 0 ? (
                            line.text.split('').map((char, ci) => (
                              <motion.span key={ci} className="imm-wave-char"
                                animate={{ y: [0, Math.sin(ci * 0.7) * -8, Math.sin(ci * 0.7) * 8, 0] }}
                                transition={{ duration: 1.8, delay: ci * 0.04, repeat: Infinity, ease: 'easeInOut' }}>
                                {char === ' ' ? ' ' : char}
                              </motion.span>
                            ))
                          ) : (
                            <span>{line.text}</span>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                );
              })()}
            </div>
          ) : (
            /* Cinema (default) */
            (() => {
              const visibleLyrics = [];
              for (let i = Math.max(0, activeLyricIndex - 4); i <= Math.min(lyrics.length - 1, activeLyricIndex + 4); i++) {
                visibleLyrics.push({ ...lyrics[i], index: i, dist: i - activeLyricIndex });
              }
              return (
                <AnimatePresence mode="popLayout">
                  {visibleLyrics.map((line) => {
                    const variants = getTransitionVariants(line.dist);
                    return (
                      <motion.div key={line.index} className={`immersive-lyric-line ${line.dist === 0 ? 'active' : ''}`} data-dist={Math.abs(line.dist)} layout
                        initial={variants.initial} animate={variants.animate} exit={variants.exit} transition={getTransitionConfig()}>
                        {line.text}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              );
            })()
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom */}
      <div className="immersive-spectrum-area immersive-sv-always" style={isFullscreenSpectrum ? { display: 'none' } : undefined}>
        <SpectrumVisualizer mode={spectrumMode} isPlaying={isPlaying} className="immersive-sv" />
      </div>

      <div className={`immersive-bottom${uiVisible ? ' visible' : ''}`}>
        <div className="immersive-bottom-overlay">
          <div className="immersive-spec-dots">
            {IMMERSIVE_SPECTRUM_MODES.map(sm => (
              <button key={sm.key} className={`immersive-spec-dot ${spectrumMode === sm.key ? 'active' : ''}`}
                onClick={() => setSpectrumMode(sm.key)} title={sm.label}>
                <span className="imm-spec-dot-icon"><Icon name={sm.icon} size={14} /></span>
              </button>
            ))}
          </div>

          <div className="immersive-playback-controls">
            <motion.button className={`immersive-mode-btn ${playMode !== 'list' ? 'active-mode' : ''}`}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={cyclePlayMode} title={modeInfo.label}>
              <Icon name={modeInfo.icon} size={20} />
            </motion.button>
            <motion.button className="immersive-ctrl-btn" whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
              onClick={handlePrev} title="上一首">
              <Icon name="skip-back" size={22} />
            </motion.button>
            <motion.button className="immersive-play-btn" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={togglePlay} title={isPlaying ? '暂停' : '播放'}>
              {isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
            </motion.button>
            <motion.button className="immersive-ctrl-btn" whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
              onClick={handleNext} title="下一首">
              <Icon name="skip-forward" size={22} />
            </motion.button>
            {currentSong && (
              <motion.button className={`immersive-ctrl-btn ${isFav ? 'favorited' : ''}`}
                whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
                onClick={() => toggleFavorite(currentSong.id)}
                title={isFav ? '取消收藏' : '收藏'}>
                {isFav ? <HeartFilled size={20} /> : <HeartOutline size={20} />}
              </motion.button>
            )}
          </div>

          <div className="immersive-progress-wrap">
            <div className="immersive-progress-bar" onClick={handleProgressClick} title="点击跳转">
              <div className="immersive-progress-fill" style={{ width: `${progress}%` }} />
              <div className="immersive-progress-thumb" style={{ left: `${progress}%` }} />
            </div>
            <div className="immersive-progress-time">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Audio Monitor ===== */
function AudioMonitor({ isPlaying, variant = 'compact' }) {
  if (variant === 'immersive') {
    return (
      <div className="audio-monitor-immersive" title="音频监听">
        <div className="audio-monitor-immersive-bars">
          {Array.from({ length: 32 }, (_, i) => (
            <div key={i} className={`audio-monitor-immersive-bar ${isPlaying ? 'active' : ''}`}
              style={{ animationDelay: `${(i * 0.04) + (i % 5) * 0.07}s`, animationDuration: `${0.35 + (i % 3) * 0.15 + Math.sin(i * 0.5) * 0.1}s`, '--bar-hue': `${(i / 32) * 60 + 200}` }}>
              <div className="audio-monitor-immersive-fill" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="audio-monitor" title="音频监听">
      <div className="audio-monitor-bars">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={`audio-monitor-bar ${isPlaying ? 'active' : ''}`} style={{ animationDelay: `${i * 0.12}s` }}>
            <div className="audio-monitor-fill" />
          </div>
        ))}
      </div>
      <span className="audio-monitor-label">AUDIO</span>
    </div>
  );
}

const VISUAL_FORMATS = [
  { key: 'cover', icon: 'disc', label: '封面' },
  { key: 'bars', icon: 'chart', label: '柱状' },
  { key: 'wave', icon: 'wave', label: '波浪' },
  { key: 'particles', icon: 'sparkles', label: '粒子' },
];

function CoverDisplay({ currentSong, isPlaying, visualFormat }) {
  if (visualFormat === 'bars' || visualFormat === 'wave' || visualFormat === 'particles') {
    return (
      <div className={`cover-art no-bg ${isPlaying ? 'breathing-playing' : 'breathing'}`}>
        <AnimeVisualizer mode={visualFormat} isPlaying={isPlaying} />
      </div>
    );
  }
  return (
    <div className="cover-wrapper">
      <motion.div className={`cover-art ${isPlaying ? 'spinning breathing-playing' : 'breathing'}`}
        layoutId={currentSong ? `song-cover-${currentSong.id}` : undefined}
        transition={{ layout: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}>
        {currentSong?.cover ? (
          <img src={currentSong.cover} alt="cover" />
        ) : (
          <div className="cover-placeholder" />
        )}
      </motion.div>
      <div className={`vinyl-tonearm ${isPlaying ? '' : 'resting'}`}>
        <div className="tonearm-base" />
        <div className="tonearm-arm" />
        <div className="tonearm-head" />
      </div>
    </div>
  );
}

/* ===== Song Info Panel ===== */
function SongInfoPanel({ currentSong, lyrics, duration, currentTime }) {
  if (!currentSong) {
    return (
      <div className="detail-empty">
        <div className="detail-empty-icon" />
        <p>请选择一首歌曲</p>
      </div>
    );
  }
  const format = currentSong.mimeType ? (AUDIO_FORMATS[currentSong.mimeType] || '未知') : '未知';
  const infoRows = [
    { label: '歌名', value: currentSong.title },
    { label: '艺术家', value: currentSong.artist || '未知' },
    { label: '专辑', value: currentSong.album || '未知专辑' },
    { label: '格式', value: format },
    { label: '码率', value: currentSong.bitrate || '—' },
    { label: '风格', value: currentSong.genre || '流行' },
    { label: '年份', value: currentSong.year || '—' },
    { label: '大小', value: currentSong.size ? `${(currentSong.size / 1024 / 1024).toFixed(1)} MB` : '—' },
    { label: '时长', value: formatTime(duration) },
    { label: '来源', value: currentSong.type === 'local' ? '本地音乐' : '在线音乐' },
  ];
  const currentLyricLine = lyrics.find((l, i) => {
    const next = lyrics[i + 1];
    return currentTime >= l.time && (!next || currentTime < next.time);
  });
  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div className="detail-mini-cover">
          {currentSong.cover ? <img src={currentSong.cover} alt="" /> : <span className="detail-cover-icon" />}
        </div>
        <div className="detail-title-area">
          <h3 className="detail-title">{currentSong.title}</h3>
          <p className="detail-artist">{currentSong.artist || '未知艺术家'}</p>
          {currentSong.album && <p className="detail-album"><Icon name="disc" size={14} /> {currentSong.album}</p>}
        </div>
      </div>
      {currentLyricLine && (
        <div className="detail-now-playing">
          <span className="detail-np-label">正在唱</span>
          <span className="detail-np-text">{currentLyricLine.text}</span>
        </div>
      )}
      <div className="detail-info-grid">
        {infoRows.map(row => (
          <div key={row.label} className="detail-info-row">
            <span className="detail-info-label">{row.label}</span>
            <span className="detail-info-value">{row.value}</span>
          </div>
        ))}
      </div>
      <div className="detail-progress">
        <div className="detail-progress-bar">
          <div className="detail-progress-fill" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
        </div>
        <div className="detail-progress-time">
          <span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

/* ===== Main PlayerPage ===== */
export default function PlayerPage() {
  const {
    currentSong, isPlaying, isLoading, audioError,
    currentTime, duration, volume, isMuted,
    playMode, cyclePlayMode,
    togglePlay, handlePrev, handleNext, handleSeek,
    handleVolumeChange, toggleMute,
    lyricStyle, setLyricStyle,
    editingLyricId, editingLyricText, setEditingLyricText,
    lyricSearchQuery, setLyricSearchQuery,
    lyricSearching, searchLyrics,
    startEditLyrics, saveLyrics, setEditingLyricId,
    activeLyricIndex, lyrics,
    allSongs, currentIndex, favorites, toggleFavorite,
    playAtIndex, removeSong,
    isImmersive, setIsImmersive, lyricsRef,
    immersiveSpectrumMode, setImmersiveSpectrumMode,
    immersiveBgAnim, setImmersiveBgAnim,
    immersiveLyricTransition,
    danmakuMode, setDanmakuMode,
    danmakuDensity, setDanmakuDensity,
    setShowLoginModal,
  } = useMusic();
  const navigate = useNavigate();

  const [visualFormat, setVisualFormat] = useState(() =>
    localStorage.getItem('qqmusic_visual_format') || 'cover'
  );
  const [activeTab, setActiveTab] = useState('lyrics');
  const [showSidebar, setShowSidebar] = useState(() =>
    localStorage.getItem('qqmusic_show_sidebar') !== 'false'
  );

  const modeInfo = PLAY_MODES.find(m => m.key === playMode) || PLAY_MODES[0];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleVisualFormatChange = (key) => {
    setVisualFormat(key);
    localStorage.setItem('qqmusic_visual_format', key);
  };

  const toggleSidebar = () => {
    const next = !showSidebar;
    setShowSidebar(next);
    localStorage.setItem('qqmusic_show_sidebar', next);
  };

  useEffect(() => {
    if (isImmersive) { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }
  }, [isImmersive]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'f' || e.key === 'F') { setIsImmersive(prev => !prev); return; }
      if (isImmersive) {
        if (e.key === 'Escape') setIsImmersive(false);
        if (e.key === ' ') { e.preventDefault(); togglePlay(); }
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'ArrowRight') handleNext();
        return;
      }
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'm' || e.key === 'M') toggleMute();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isImmersive, togglePlay, handlePrev, handleNext, toggleMute, setIsImmersive]);

  return (
    <motion.div className="player-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, delay: 0.2 }}>
      {isImmersive && (
        <ImmersiveMode
          lyrics={lyrics} activeLyricIndex={activeLyricIndex} isPlaying={isPlaying} currentTime={currentTime} duration={duration}
          onExit={() => setIsImmersive(false)} togglePlay={togglePlay} handlePrev={handlePrev} handleNext={handleNext} handleSeek={handleSeek}
          currentSong={currentSong} favorites={favorites} toggleFavorite={toggleFavorite}
          playMode={playMode} cyclePlayMode={cyclePlayMode}
          spectrumMode={immersiveSpectrumMode} setSpectrumMode={setImmersiveSpectrumMode}
          lyricStyle={lyricStyle} setLyricStyle={setLyricStyle}
          bgAnim={immersiveBgAnim} setBgAnim={setImmersiveBgAnim}
          lyricTransition={immersiveLyricTransition}
          danmakuMode={danmakuMode} setDanmakuMode={setDanmakuMode}
          danmakuDensity={danmakuDensity} setDanmakuDensity={setDanmakuDensity}
        />
      )}

      {/* Top bar */}
      <div className="player-topbar">
        <div className="player-topbar-left">
          <button className="player-back-btn" onClick={() => navigate(-1)}>
            <Icon name="arrow-left" size={18} /> 返回
          </button>
          {currentSong && (
            <div className="player-topbar-song">
              <div className="player-topbar-cover">
                {currentSong.cover ? <img src={currentSong.cover} alt="" /> : <span className="topbar-cover-dot" />}
              </div>
              <div className="player-topbar-info">
                <span className="player-topbar-title">{currentSong.title}</span>
                <span className="player-topbar-artist">{currentSong.artist}</span>
              </div>
            </div>
          )}
        </div>
        <div className="player-topbar-right">
          <AudioMonitor isPlaying={isPlaying} currentTime={currentTime} />
          <button className={`topbar-action-btn topbar-immersive-btn ${isImmersive ? 'active' : ''} ${currentSong ? 'has-song' : ''}`}
            onClick={() => setIsImmersive(true)} title="沉浸模式 (F) — 全屏歌词 + 弹幕 + 频谱" disabled={!currentSong}>
            <span className="topbar-immersive-icon"><Icon name="sparkles" size={16} /></span>
            <span className="topbar-immersive-label">沉浸</span>
          </button>
          <button className={`topbar-action-btn ${showSidebar ? 'active' : ''}`} onClick={toggleSidebar}
            title={showSidebar ? '隐藏详情面板' : '显示详情面板'}>
            <Icon name={showSidebar ? 'sidebar-hide' : 'sidebar-show'} size={18} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className={`player-page-body ${showSidebar ? 'with-sidebar' : ''}`}>
        <div className="player-center">
          <div className={`player-visual-area visual-${visualFormat}${currentSong ? ' immersive-ready' : ''}`}
            onClick={() => currentSong && setIsImmersive(true)} title={currentSong ? '点击进入沉浸模式 (F)' : ''}>
            <ThreeBackground isPlaying={isPlaying} />
            <CoverDisplay currentSong={currentSong} isPlaying={isPlaying} visualFormat={visualFormat} />
            {currentSong && (
              <div className="player-cover-immersive-overlay">
                <span className="player-cover-immersive-icon"><Icon name="sparkles" size={20} /></span>
                <span className="player-cover-immersive-text">沉浸模式</span>
              </div>
            )}
          </div>

          <div className="player-song-info">
            <h3 className="player-song-title">{currentSong?.title || '未选择歌曲'}</h3>
            <p className="player-song-artist">{currentSong?.artist || '-'}</p>
            {currentSong?.album && (
              <p className="player-song-album"><Icon name="disc" size={14} /> {currentSong.album}</p>
            )}
            {isLoading && <span className="song-status loading"><Icon name="loading" size={14} /> 加载中...</span>}
            {audioError && <span className="song-status error"><Icon name="error" size={14} /> {audioError}</span>}
          </div>

          {/* Progress */}
          <div className="progress-area">
            <div className="progress-bar-wrap">
              <div className="progress-bar-bg" onClick={(e) => {
                if (!duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                handleSeek({ target: { value: ratio * duration } });
              }}>
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                <div className="progress-bar-thumb" style={{ left: `${progress}%` }} />
              </div>
              <input type="range" className="progress-bar" min={0} max={duration || 0} step={0.1} value={currentTime} onChange={handleSeek} />
            </div>
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              {currentSong && <span className="time-remaining">-{formatTime(Math.max(0, duration - currentTime))}</span>}
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="controls">
            <motion.button className={`mode-btn ${playMode !== 'list' ? 'active-mode' : ''}`}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
              onClick={cyclePlayMode} title={modeInfo.label}>
              <Icon name={modeInfo.icon} size={22} />
            </motion.button>
            <motion.button className="ctrl-btn" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={handlePrev} title="上一首 (←)">
              <Icon name="skip-back" size={24} />
            </motion.button>
            <motion.button className="play-btn" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={togglePlay} title={isPlaying ? '暂停 (Space)' : '播放 (Space)'}>
              {isPlaying ? <PauseIcon size={36} /> : <PlayIcon size={36} />}
            </motion.button>
            <motion.button className="ctrl-btn" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={handleNext} title="下一首 (→)">
              <Icon name="skip-forward" size={24} />
            </motion.button>
            <motion.button className={`ctrl-btn ${favorites.includes(currentSong?.id) ? 'favorited' : ''}`}
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
              onClick={() => currentSong && toggleFavorite(currentSong.id)}
              title={favorites.includes(currentSong?.id) ? '取消收藏' : '收藏'}>
              {favorites.includes(currentSong?.id) ? <HeartFilled size={22} /> : <HeartOutline size={22} />}
            </motion.button>
          </div>

          {/* Visual format + Volume */}
          <div className="player-bottom-row">
            <div className="visual-format-bar">
              {VISUAL_FORMATS.map(vf => (
                <motion.button key={vf.key} className={`visual-format-btn ${visualFormat === vf.key ? 'active' : ''}`}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                  onClick={() => handleVisualFormatChange(vf.key)} title={vf.label}>
                  <span className="visual-format-icon"><Icon name={vf.icon} size={18} /></span>
                  <span className="visual-format-label">{vf.label}</span>
                </motion.button>
              ))}
            </div>
            <div className="volume-area">
              <button className="vol-btn" onClick={toggleMute} title={isMuted ? '取消静音 (M)' : '静音 (M)'}>
                <VolumeIcon volume={isMuted ? 0 : volume} isMuted={isMuted} size={20} />
              </button>
              <input type="range" className="volume-slider" min={0} max={1} step={0.01} value={isMuted ? 0 : volume} onChange={handleVolumeChange} />
              <span className="volume-percent">{Math.round(volume * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        {showSidebar && (
          <div className="player-sidebar">
            <div className="player-tabs-bar">
              {PLAYER_TABS.map(tab => (
                <button key={tab.key} className={`player-tab ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}>
                  <span className="player-tab-icon"><Icon name={tab.icon} size={16} /></span>
                  <span className="player-tab-label">{tab.label}</span>
                </button>
              ))}
            </div>

            {activeTab === 'info' && (
              <div className="player-tab-content">
                <SongInfoPanel currentSong={currentSong} lyrics={lyrics} duration={duration} currentTime={currentTime} />
              </div>
            )}

            {activeTab === 'lyrics' && (
              <div className={`lyrics-section style-${lyricStyle}`}>
                <div className="lyrics-header">
                  <h4><Icon name="edit" size={16} /> 歌词</h4>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: '3px', marginRight: '6px' }}>
                      {LYRIC_STYLES.map(ls => (
                        <button key={ls.key} onClick={() => setLyricStyle(ls.key)} title={ls.label}
                          style={{
                            width: '26px', height: '26px', borderRadius: '50%',
                            border: lyricStyle === ls.key ? '2px solid var(--accent)' : '2px solid transparent',
                            background: lyricStyle === ls.key ? 'var(--accent-light)' : 'var(--bg-hover)',
                            cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', transition: 'var(--transition)',
                          }}>
                          <Icon name={ls.icon} size={12} />
                        </button>
                      ))}
                    </div>
                    {currentSong && (
                      <>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {activeLyricIndex >= 0 ? activeLyricIndex + 1 : 0}/{lyrics.length}
                        </span>
                        <button className="panel-tab" style={{ fontSize: '11px' }}
                          onClick={() => {
                            if (editingLyricId === currentSong.id) setEditingLyricId(null);
                            else startEditLyrics(currentSong);
                          }}>
                          {editingLyricId === currentSong.id ? '取消' : <><Icon name="edit" size={12} /> 编辑</>}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editingLyricId && (
                  <div className="lyrics-editor">
                    <div className="lyrics-editor-search">
                      <input placeholder="歌手-歌名 搜索歌词" value={lyricSearchQuery}
                        onChange={e => setLyricSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && searchLyrics()} />
                      <button onClick={searchLyrics} disabled={lyricSearching}>
                        {lyricSearching ? '搜索中...' : <><Icon name="search" size={14} /> 搜索</>}
                      </button>
                    </div>
                    <textarea value={editingLyricText} onChange={e => setEditingLyricText(e.target.value)}
                      placeholder="LRC 歌词格式：[00:00.00]歌词内容" rows={6} />
                    <div className="lyrics-editor-actions">
                      <button className="btn-save-lyric" onClick={saveLyrics}>
                        <Icon name="save" size={14} /> 保存歌词
                      </button>
                      <button className="btn-cancel-lyric" onClick={() => setEditingLyricId(null)}>取消</button>
                      <span className="lyrics-format-hint">格式: [mm:ss.xx]歌词</span>
                    </div>
                  </div>
                )}

                <div className="lyrics-box" ref={lyricsRef}>
                  {lyrics.length === 0 ? (
                    <div className="lyrics-empty">
                      <div className="lyrics-empty-icon"><Icon name="music-note-sm" size={32} /></div>
                      <div className="lyrics-empty-text">
                        {currentSong ? '点击 ✏️ 编辑 添加歌词' : '选择一首歌曲开始播放'}
                      </div>
                    </div>
                  ) : lyricStyle === 'minimal' ? (
                    <div className="lyrics-minimal">
                      {activeLyricIndex >= 0 ? (
                        <div className="lyrics-minimal-line">{lyrics[activeLyricIndex].text}</div>
                      ) : <div className="lyrics-minimal-line" style={{ opacity: 0.4 }}><Icon name="music-note-sm" size={20} /></div>}
                      {activeLyricIndex + 1 < lyrics.length && (
                        <div className="lyrics-minimal-next">{lyrics[activeLyricIndex + 1].text}</div>
                      )}
                    </div>
                  ) : lyricStyle === 'cinema' ? (
                    <div className="lyrics-cinema">
                      {lyrics.map((line, i) => {
                        const dist = i - activeLyricIndex;
                        if (Math.abs(dist) > 2) return null;
                        return (
                          <div key={i} className={`lyrics-cinema-line ${dist === 0 ? 'active' : ''}`} data-dist={Math.abs(dist)}>
                            {line.text}
                          </div>
                        );
                      })}
                    </div>
                  ) : lyricStyle === 'karaoke' ? (
                    <div className="lyrics-karaoke">
                      {lyrics.map((line, i) => (
                        <div key={i} className={`lyrics-karaoke-line ${i === activeLyricIndex ? 'active' : ''}`}
                          style={i === activeLyricIndex ? {
                            '--progress': `${Math.max(0, Math.min(100, (currentTime - line.time) /
                              Math.max(0.1, (lyrics[i + 1]?.time || duration) - line.time) * 100))}%`
                          } : {}}>
                          <span className="lyrics-karaoke-fill">{line.text}</span>
                          <span className="lyrics-karaoke-text">{line.text}</span>
                        </div>
                      ))}
                    </div>
                  ) : lyricStyle === 'card' ? (
                    <div className="lyrics-card">
                      {lyrics.map((line, i) => {
                        const dist = i - activeLyricIndex;
                        if (Math.abs(dist) > 1) return null;
                        return (
                          <div key={i} className={`lyrics-card-line ${dist === 0 ? 'active' : dist < 0 ? 'prev' : 'next'}`}>{line.text}</div>
                        );
                      })}
                    </div>
                  ) : lyricStyle === 'neon' ? (
                    <div className="lyrics-neon">
                      {lyrics.map((line, i) => {
                        const dist = i - activeLyricIndex;
                        if (Math.abs(dist) > 3) return null;
                        return (
                          <div key={i} className={`lyrics-neon-line ${dist === 0 ? 'active' : ''}`} data-dist={Math.abs(dist)}>
                            <span className="lyrics-neon-glow">{line.text}</span>
                            <span className="lyrics-neon-text">{line.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : lyricStyle === 'typewriter' ? (
                    <div className="lyrics-typewriter">
                      {(() => {
                        const visibleLyrics = [];
                        for (let i = Math.max(0, activeLyricIndex - 2); i <= Math.min(lyrics.length - 1, activeLyricIndex + 1); i++) {
                          visibleLyrics.push({ ...lyrics[i], index: i, dist: i - activeLyricIndex });
                        }
                        return visibleLyrics.map((line) => (
                          <div key={line.index} className={`lyrics-typewriter-line ${line.dist === 0 ? 'active' : ''}`} data-dist={Math.abs(line.dist)}>
                            {line.dist === 0 ? (
                              <span className="lyrics-typewriter-cursor">
                                {line.text}
                                <span className="typewriter-caret">|</span>
                              </span>
                            ) : (
                              <span>{line.text}</span>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  ) : lyricStyle === 'spotlight' ? (
                    <div className="lyrics-spotlight">
                      <div className="lyrics-spotlight-beam" style={{ top: `${Math.max(0, activeLyricIndex) * 44 + 44}px` }} />
                      {lyrics.map((line, i) => {
                        const dist = i - activeLyricIndex;
                        if (Math.abs(dist) > 4) return null;
                        return (
                          <div key={i} className={`lyrics-spotlight-line ${dist === 0 ? 'active' : ''}`} data-dist={Math.abs(dist)}>
                            {line.text}
                          </div>
                        );
                      })}
                    </div>
                  ) : lyricStyle === 'wave' ? (
                    <div className="lyrics-wave">
                      {lyrics.map((line, i) => {
                        const dist = i - activeLyricIndex;
                        if (Math.abs(dist) > 2) return null;
                        const words = line.text.split('');
                        return (
                          <div key={i} className={`lyrics-wave-line ${dist === 0 ? 'active' : ''}`} data-dist={Math.abs(dist)}>
                            {dist === 0 ? words.map((char, ci) => (
                              <span key={ci} className="lyrics-wave-char"
                                style={{ animationDelay: `${ci * 0.04}s`, '--wave-offset': `${Math.sin(ci * 0.6) * 8}px` }}>
                                {char === ' ' ? ' ' : char}
                              </span>
                            )) : line.text}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    lyrics.map((line, i) => (
                      <div key={i} className={`lyrics-line ${i === activeLyricIndex ? 'active' : ''}`}>{line.text}</div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="player-tab-content">
                <CommentSection currentSong={currentSong} onLoginClick={() => setShowLoginModal(true)} />
              </div>
            )}

            {activeTab === 'playlist' && (
              <div className="queue-panel">
                <div className="queue-header">
                  <h4><Icon name="list" size={16} /> 播放列表</h4>
                  <span className="queue-count">{allSongs.length} 首</span>
                </div>
                <div className="queue-list">
                  {allSongs.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><Icon name="empty" size={36} /></div>
                      <p>播放列表为空</p>
                      <p style={{ fontSize: '11px', opacity: 0.6, marginTop: 4 }}>去「我的音乐」添加歌曲吧</p>
                    </div>
                  ) : (
                    allSongs.map((song, idx) => {
                      const isFav = favorites.includes(song.id);
                      const fmt = song.mimeType ? (AUDIO_FORMATS[song.mimeType] || '?') : '?';
                      return (
                        <div key={song.id} className={`playlist-item ${idx === currentIndex ? 'playing' : ''}`}
                          onDoubleClick={() => playAtIndex(song.id)}>
                          <div className="pl-idx" onClick={() => playAtIndex(song.id)} style={{ cursor: 'pointer' }}>
                            {idx === currentIndex && isPlaying ? <VolumeIcon volume={0.8} isMuted={false} size={14} /> : idx + 1}
                          </div>
                          <div className="pl-cover">
                            {song.cover ? <img src={song.cover} alt="" /> : <span className="pl-cover-dot" />}
                          </div>
                          <div className="pl-info">
                            <div className="pl-title">{song.title}</div>
                            <div className="pl-artist">
                              {song.artist}
                              <span className="pl-format-tag">{fmt}</span>
                              {song.type === 'local' ? ' 本地' : ''}
                            </div>
                          </div>
                          <div className="pl-actions">
                            <button className={`fav-btn ${isFav ? 'favorited' : ''}`}
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(song.id); }}>
                              {isFav ? <HeartFilled size={14} /> : <HeartOutline size={14} />}
                            </button>
                            <button className="del-btn"
                              onClick={(e) => { e.stopPropagation(); removeSong(song.id); }}>
                              <Icon name="x" size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
