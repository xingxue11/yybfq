import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMusic } from '../context/MusicContext';
import { formatTime } from '../utils/helpers';
import Icon, { PlayIcon, PauseIcon } from './Icons';

export default function MiniPlayer() {
  const {
    currentSong, isPlaying, currentTime, duration,
    togglePlay, handleNext,
  } = useMusic();
  const navigate = useNavigate();
  const [justAppeared, setJustAppeared] = useState(true);

  useEffect(() => {
    setJustAppeared(true);
    const timer = setTimeout(() => setJustAppeared(false), 2000);
    return () => clearTimeout(timer);
  }, [currentSong?.id]);

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const expandPlayer = () => {
    navigate('/player');
  };

  return (
    <motion.div
      className={`mini-player ${justAppeared ? 'mini-player-fresh' : ''}`}
      onClick={expandPlayer}
      title="点击展开完整播放器"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="mini-player-progress-bg">
        <div className="mini-player-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="mini-player-body">
        <div className="mini-player-info">
          <motion.div
            className={`mini-player-cover ${isPlaying ? 'spinning' : ''}`}
            layoutId={`song-cover-${currentSong.id}`}
            transition={{ layout: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
          >
            {currentSong.cover ? (
              <img src={currentSong.cover} alt="" />
            ) : (
              <span className="mini-cover-dot" />
            )}
          </motion.div>
          <div className="mini-player-text">
            <div className="mini-player-title">{currentSong.title || '未知歌曲'}</div>
            <div className="mini-player-artist">{currentSong.artist || '-'}</div>
          </div>
        </div>

        <div className="mini-player-controls" onClick={e => e.stopPropagation()}>
          <motion.button className="mini-player-btn"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            onClick={togglePlay} title={isPlaying ? '暂停' : '播放'}>
            {isPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
          </motion.button>
          <motion.button className="mini-player-btn"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            onClick={handleNext} title="下一首">
            <Icon name="skip-forward" size={22} />
          </motion.button>
        </div>

        <div className="mini-player-time">
          <span>{formatTime(currentTime)}</span>
          <span> / </span>
          <span>{formatTime(duration)}</span>
        </div>

        <motion.div className="mini-player-expand"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={expandPlayer} title="展开播放器">
          <Icon name="chevron-up" size={16} />
          <span className="mini-player-expand-text">展开</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
