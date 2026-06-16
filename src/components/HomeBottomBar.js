import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMusic } from '../context/MusicContext';
import { formatTime } from '../utils/helpers';
import Icon, { PlayIcon, PauseIcon } from './Icons';

/**
 * Persistent bottom bar on homepage.
 * - When no song is active: shows a subtle "waiting for music" state.
 * - When a song is playing: shows MiniPlayer controls.
 * Always visible on the homepage — acts as the permanent music dock.
 */
export default function HomeBottomBar() {
  const {
    currentSong, isPlaying, currentTime, duration,
    togglePlay, handleNext, handlePrev,
  } = useMusic();
  const navigate = useNavigate();
  const [justAppeared, setJustAppeared] = useState(false);

  useEffect(() => {
    if (!currentSong) return;
    setJustAppeared(true);
    const timer = setTimeout(() => setJustAppeared(false), 2000);
    return () => clearTimeout(timer);
  }, [currentSong]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasSong = !!currentSong;

  const expandPlayer = () => {
    if (hasSong) {
      navigate('/player');
    } else {
      // Scroll to song sections so the user can pick a song
      const el = document.querySelector('.home-asym-section') || document.querySelector('.featured-grid');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <motion.div
      className={`home-bottom-bar ${hasSong ? 'has-song' : 'no-song'} ${justAppeared ? 'fresh-pulse' : ''}`}
      onClick={expandPlayer}
      title={hasSong ? '点击展开完整播放器' : '点击浏览曲库，选择一首歌曲开始播放'}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Top progress line — only when playing */}
      {hasSong && (
        <div className="hbb-progress-track">
          <div className="hbb-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="hbb-inner">
        {/* Left: Cover + Info */}
        <div className="hbb-left">
          <motion.div
            className={`hbb-cover ${hasSong && isPlaying ? 'spinning' : ''} ${!hasSong ? 'empty' : ''}`}
            layoutId={hasSong ? `song-cover-${currentSong.id}` : undefined}
            transition={{ layout: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
          >
            {hasSong ? (
              currentSong.cover ? (
                <img src={currentSong.cover} alt="" />
              ) : (
                <span className="hbb-cover-emoji" />
              )
            ) : (
              <span className="hbb-cover-emoji" />
            )}
          </motion.div>
          <div className="hbb-info">
            <div className="hbb-title">
              {hasSong ? currentSong.title : '未在播放'}
            </div>
            <div className="hbb-artist">
              {hasSong ? currentSong.artist : '选择歌曲开始聆听'}
            </div>
          </div>
        </div>

        {/* Center: Controls — only when song is loaded */}
        {hasSong && (
          <div className="hbb-controls" onClick={e => e.stopPropagation()}>
            <motion.button className="hbb-ctrl-btn"
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              onClick={handlePrev} title="上一首">
              <Icon name="skip-back" size={22} />
            </motion.button>
            <motion.button className="hbb-play-btn"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={togglePlay} title={isPlaying ? '暂停' : '播放'}>
              {isPlaying ? <PauseIcon size={26} /> : <PlayIcon size={26} />}
            </motion.button>
            <motion.button className="hbb-ctrl-btn"
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              onClick={handleNext} title="下一首">
              <Icon name="skip-forward" size={22} />
            </motion.button>
          </div>
        )}

        {/* Right: Time or hint */}
        <div className="hbb-right">
          {hasSong ? (
            <>
              <span className="hbb-time">{formatTime(currentTime)}</span>
              <span className="hbb-time-sep">/</span>
              <span className="hbb-time">{formatTime(duration)}</span>
            </>
          ) : (
            <span className="hbb-hint">点击曲库开始 →</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
