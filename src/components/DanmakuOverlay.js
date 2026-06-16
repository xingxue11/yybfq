import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DANMAKU_MODES, DANMAKU_DENSITIES } from '../utils/constants';
import { getSeedComments } from '../data/seedComments';

const COMMENTS_KEY = 'qqmusic_comments';

function loadCommentsForSong(songId, songIndex) {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    if (!all[songId] || all[songId].length === 0) {
      const seeds = getSeedComments(songIndex);
      if (seeds.length > 0) {
        all[songId] = seeds;
        localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
        return seeds;
      }
    }
    return all[songId] || [];
  } catch {
    return [];
  }
}

let idCounter = 0;

const MIXED_POOL = ['scroll', 'fall', 'fade', 'rain', 'bubble', 'pulse', 'typewriter'];

/* ===== Collision avoidance helpers ===== */

// Scroll mode: lane-based, 5vh per lane
const SCROLL_LANE_H = 5;
const SCROLL_TOP_MIN = 3;
const SCROLL_TOP_MAX = 22;
const SCROLL_BOT_MIN = 75;
const SCROLL_BOT_MAX = 92;

function getOccupiedScrollLanes(items) {
  const lanes = new Set();
  for (const item of items) {
    if (item.mode === 'scroll' && item.style.top) {
      const y = parseFloat(item.style.top);
      if (!isNaN(y)) lanes.add(Math.floor(y / SCROLL_LANE_H));
    }
  }
  return lanes;
}

function pickScrollY(occupiedLanes) {
  const freeTop = [];
  const freeBot = [];
  for (let lane = 0; lane < 20; lane++) {
    if (occupiedLanes.has(lane)) continue;
    const y = lane * SCROLL_LANE_H;
    if (y >= SCROLL_TOP_MIN && y <= SCROLL_TOP_MAX) freeTop.push(lane);
    if (y >= SCROLL_BOT_MIN && y <= SCROLL_BOT_MAX) freeBot.push(lane);
  }

  const hasTop = freeTop.length > 0;
  const hasBot = freeBot.length > 0;

  if (!hasTop && !hasBot) {
    // All full, fall back to random placement
    return Math.random() > 0.5
      ? SCROLL_TOP_MIN + Math.random() * (SCROLL_TOP_MAX - SCROLL_TOP_MIN)
      : SCROLL_BOT_MIN + Math.random() * (SCROLL_BOT_MAX - SCROLL_BOT_MIN);
  }

  let pool;
  if (hasTop && hasBot) {
    pool = Math.random() > 0.5 ? freeTop : freeBot;
    if (pool.length === 0) pool = freeTop.length > 0 ? freeTop : freeBot;
  } else {
    pool = hasTop ? freeTop : freeBot;
  }

  const lane = pool[Math.floor(Math.random() * pool.length)];
  return lane * SCROLL_LANE_H + Math.random() * 3;
}

// Distance check for non-scroll modes — returns true if too close to any active item
function isTooClose(mode, style, activeItems) {
  const nx = parseFloat(style.left);
  const ny = parseFloat(style.top);
  const nb = parseFloat(style.bottom);

  // Per-mode minimum gap (% of viewport)
  let gapX, gapY;
  switch (mode) {
    case 'fall':   gapX = 7;  gapY = 0;  break; // vertical — only X matters
    case 'rain':   gapX = 12; gapY = 0;  break; // diagonal — only X matters
    case 'fade':   gapX = 14; gapY = 12; break; // scattered — both axes
    case 'bubble': gapX = 12; gapY = 0;  break; // rising — only X matters
    case 'pulse':  gapX = 18; gapY = 16; break; // centered burst — needs more room (ring)
    case 'typewriter': gapX = 16; gapY = 10; break; // horizontal band
    default:       gapX = 10; gapY = 8;
  }

  for (const item of activeItems) {
    if (!item.style) continue;
    const ix = parseFloat(item.style.left);
    const iy = parseFloat(item.style.top);
    const ib = parseFloat(item.style.bottom);

    const xOk = isNaN(nx) || isNaN(ix) || Math.abs(nx - ix) >= gapX;
    // Compare vertical positions — use whichever key is present
    let yOk = true;
    if (gapY > 0) {
      if (!isNaN(ny) && !isNaN(iy)) {
        yOk = Math.abs(ny - iy) >= gapY;
      } else if (!isNaN(nb) && !isNaN(ib)) {
        yOk = Math.abs(nb - ib) >= gapY;
      }
    }

    if (!xOk && !yOk) return true;
  }
  return false;
}

/* ===== Danmaku factory ===== */

function createDanmaku(comment, mode, activeItems = []) {
  const id = `dm-${Date.now()}-${++idCounter}`;
  const text = comment.content;
  const username = comment.username;
  let style = {};
  let extra = {};

  const actualMode = mode === 'mixed'
    ? MIXED_POOL[Math.floor(Math.random() * MIXED_POOL.length)]
    : mode;

  const MAX_RETRIES = 8;

  switch (actualMode) {
    case 'scroll': {
      // Lane-based: pick a free lane, fall back to random if all occupied
      const occupiedLanes = getOccupiedScrollLanes(activeItems);
      const y = pickScrollY(occupiedLanes);
      const dur = 14 + Math.random() * 14;
      style = {
        top: `${y}%`,
        left: '105%',
        '--dm-dur': `${dur}s`,
      };
      break;
    }
    case 'fall': {
      // Vertical text — retry X to avoid horizontal overlap
      let x, dur, drift;
      for (let r = 0; r < MAX_RETRIES; r++) {
        x = 4 + Math.random() * 92;
        dur = 14 + Math.random() * 14;
        drift = (Math.random() - 0.5) * 40;
        const testStyle = { left: `${x}%`, top: '-15%', '--dm-dur': `${dur}s` };
        if (!isTooClose('fall', testStyle, activeItems)) break;
      }
      style = {
        left: `${x}%`,
        top: '-15%',
        '--dm-drift': `${drift}px`,
        '--dm-dur': `${dur}s`,
      };
      break;
    }
    case 'fade': {
      // Ethereal scatter — retry both X and Y
      let x, y, dur;
      for (let r = 0; r < MAX_RETRIES; r++) {
        x = 2 + Math.random() * 96;
        y = 4 + Math.random() * 92;
        dur = 10 + Math.random() * 10;
        const testStyle = { top: `${y}%`, left: `${x}%`, '--dm-dur': `${dur}s` };
        if (!isTooClose('fade', testStyle, activeItems)) break;
      }
      style = {
        top: `${y}%`,
        left: `${x}%`,
        '--dm-dur': `${dur}s`,
        '--dm-delay': `${Math.random() * 6}s`,
      };
      break;
    }
    case 'rain': {
      // Phrase rain — retry X to avoid cluster overlap
      let x, angle, dur;
      for (let r = 0; r < MAX_RETRIES; r++) {
        x = 8 + Math.random() * 84;
        const testStyle = { left: `${x}%`, top: '-5%' };
        if (!isTooClose('rain', testStyle, activeItems)) break;
      }
      angle = -55 - Math.random() * 30;
      dur = 7 + Math.random() * 9;
      const chars = [...text].filter(c => c.trim().length > 0 || c === ' ');
      extra.rainChars = chars.map((char, ci) => ({
        char: char === ' ' ? ' ' : char,
        offsetX: (ci - chars.length / 2 + 0.5) * 14 + (Math.random() - 0.5) * 10,
        delay: ci * 0.035 + Math.random() * 0.06,
      }));
      style = {
        left: `${x}%`,
        top: '-5%',
        '--dm-rain-angle': `${angle}deg`,
        '--dm-rain-dist': `${95 + Math.random() * 85}vh`,
        '--dm-dur': `${dur}s`,
      };
      break;
    }
    case 'bubble': {
      // Rising bubble — retry X to avoid horizontal overlap
      let x, size, dur, wobble;
      for (let r = 0; r < MAX_RETRIES; r++) {
        x = 5 + Math.random() * 90;
        const testStyle = { left: `${x}%`, bottom: '-10%' };
        if (!isTooClose('bubble', testStyle, activeItems)) break;
      }
      size = 100 + Math.random() * 140;
      dur = 12 + Math.random() * 14;
      wobble = (Math.random() - 0.5) * 50;
      style = {
        left: `${x}%`,
        bottom: '-10%',
        '--dm-wobble': `${wobble}px`,
        '--dm-dur': `${dur}s`,
        '--dm-size': `${size}px`,
      };
      break;
    }
    case 'pulse': {
      // Heartbeat burst — retry both axes (needs more room for ring)
      let x, y, dur;
      for (let r = 0; r < MAX_RETRIES; r++) {
        x = 25 + Math.random() * 50;
        y = 22 + Math.random() * 56;
        const testStyle = { top: `${y}%`, left: `${x}%` };
        if (!isTooClose('pulse', testStyle, activeItems)) break;
      }
      dur = 6 + Math.random() * 7;
      style = {
        top: `${y}%`,
        left: `${x}%`,
        '--dm-dur': `${dur}s`,
        '--dm-delay': `${Math.random() * 4}s`,
      };
      break;
    }
    case 'typewriter': {
      // Typing band — retry both axes
      let x, y, displayText, totalDur;
      for (let r = 0; r < MAX_RETRIES; r++) {
        x = 5 + Math.random() * 90;
        y = Math.random() > 0.5 ? 8 + Math.random() * 22 : 72 + Math.random() * 22;
        const testStyle = { top: `${y}%`, left: `${x}%` };
        if (!isTooClose('typewriter', testStyle, activeItems)) break;
      }
      displayText = text.length > 20 ? text.slice(0, 20) + '…' : text;
      extra.typewriterChars = [...displayText];
      totalDur = 3 + extra.typewriterChars.length * 0.18 + 5;
      style = {
        top: `${y}%`,
        left: `${x}%`,
        '--dm-dur': `${totalDur}s`,
        '--dm-char-count': extra.typewriterChars.length,
      };
      break;
    }
    default:
      style = { display: 'none' };
  }

  const duration = parseFloat(style['--dm-dur']) || 10;
  return { id, text, username, mode: actualMode, style, duration, extra };
}

/**
 * DanmakuOverlay — floating comment barrage for immersive mode.
 * Mixed mode randomly picks from all 7 animation styles per item.
 * Other modes use collision avoidance to reduce overlap.
 */
export default function DanmakuOverlay({ currentSong, mode, density, isPlaying }) {
  const [items, setItems] = useState([]);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  // Lightweight shadow of active items for collision avoidance (synced with state)
  const activeItemsRef = useRef([]);

  const songIndex = currentSong?.id?.startsWith('prebuilt-')
    ? parseInt(currentSong.id.replace('prebuilt-', ''), 10)
    : -1;

  const comments = useMemo(() => {
    if (!currentSong) return [];
    return loadCommentsForSong(currentSong.id, songIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.id]);

  const validComments = useMemo(
    () => comments.filter(c => c.content && c.content.trim()),
    [comments]
  );

  const densityConfig = DANMAKU_DENSITIES.find(d => d.key === density) || DANMAKU_DENSITIES[1];
  const maxItems = densityConfig.count;

  // Spawn items
  useEffect(() => {
    if (mode === 'off' || !isPlaying || validComments.length === 0) {
      if (mode === 'off') {
        setItems([]);
        activeItemsRef.current = [];
      }
      return;
    }

    const intervals = {
      rain: 450,
      fall: 1800,
      fade: 4000,
      scroll: 1800,
      bubble: 1400,
      pulse: 2000,
      typewriter: 3200,
      mixed: 1600,
    };
    const spawnInterval = intervals[mode] || 1800;

    const spawn = () => {
      if (modeRef.current === 'off' || !isPlayingRef.current) return;
      const comment = validComments[Math.floor(Math.random() * validComments.length)];
      const newItem = createDanmaku(comment, mode, activeItemsRef.current);

      // Sync ref immediately so the next spawn sees this item
      activeItemsRef.current = [...activeItemsRef.current, {
        id: newItem.id, mode: newItem.mode, style: newItem.style,
      }];
      // Cap ref to avoid unbounded growth
      if (activeItemsRef.current.length > maxItems * 3) {
        activeItemsRef.current = activeItemsRef.current.slice(-maxItems * 2);
      }

      setItems(prev => {
        const next = [...prev, newItem];
        return next.length > maxItems ? next.slice(next.length - maxItems) : next;
      });
    };

    const burst = mode === 'rain' ? Math.floor(maxItems * 1.2) : Math.floor(maxItems * 0.5);
    for (let i = 0; i < burst; i++) {
      setTimeout(spawn, i * (mode === 'rain' ? 140 : 500));
    }

    const timer = setInterval(spawn, spawnInterval);
    return () => clearInterval(timer);
  }, [mode, isPlaying, validComments, maxItems]);

  // Cleanup old items — also sync the shadow ref
  useEffect(() => {
    const cleanup = setInterval(() => {
      setItems(prev => {
        const now = Date.now();
        const filtered = prev.filter(item => {
          const ts = parseInt(item.id.split('-')[1], 10);
          return (now - ts) < (item.duration + 2) * 1000;
        });
        // Keep ref in sync
        const keepIds = new Set(filtered.map(i => i.id));
        activeItemsRef.current = activeItemsRef.current.filter(a => keepIds.has(a.id));
        return filtered;
      });
    }, 4000);
    return () => clearInterval(cleanup);
  }, []);

  if (mode === 'off' || validComments.length === 0) return null;

  return (
    <div className="danmaku-overlay" style={{ pointerEvents: 'none' }}>
      <AnimatePresence>
        {items.map(item => {
          if (item.mode === 'rain' && item.extra.rainChars) {
            return (
              <div key={item.id} className="danmaku-rain-cluster" style={item.style}>
                {item.extra.rainChars.map((rc, ci) => (
                  <motion.div
                    key={ci}
                    className="danmaku-item danmaku-rain danmaku-char-drop"
                    style={{ '--dm-char-offset': `${rc.offsetX}px`, '--dm-char-delay': `${rc.delay}s` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, delay: rc.delay }}
                  >
                    {rc.char}
                  </motion.div>
                ))}
              </div>
            );
          }
          if (item.mode === 'fall') {
            return (
              <motion.div
                key={item.id}
                className="danmaku-item danmaku-fall danmaku-vertical"
                style={item.style}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <span className="danmaku-v-text">{item.text}</span>
                <span className="danmaku-v-user">{item.username}</span>
              </motion.div>
            );
          }
          if (item.mode === 'typewriter' && item.extra.typewriterChars) {
            return (
              <motion.div
                key={item.id}
                className="danmaku-item danmaku-typewriter"
                style={item.style}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {item.extra.typewriterChars.map((char, ci) => (
                  <motion.span
                    key={ci}
                    className="danmaku-tw-char"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: ci * 0.18, duration: 0.25 }}
                  >
                    {char === ' ' ? ' ' : char}
                  </motion.span>
                ))}
              </motion.div>
            );
          }
          return (
            <motion.div
              key={item.id}
              className={`danmaku-item danmaku-${item.mode}`}
              style={item.style}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <span className="danmaku-text">{item.text}</span>
              <span className="danmaku-user"> — {item.username}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export { DANMAKU_MODES, DANMAKU_DENSITIES };
