import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMusic } from '../context/MusicContext';
import { getCategorizedSongs } from '../utils/songCategories';
import Icon, { HeartFilled, HeartOutline, PlayIcon, PauseIcon, VolumeIcon } from './Icons';

export default function HomePage() {
  const { allSongs, history, playAtIndex, currentSong, isPlaying, clearHistory } = useMusic();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // ── Derived data ──────────────────────────────────
  const recentlyPlayed = useMemo(() => {
    return history
      .map(h => allSongs.find(s => s.id === h.id))
      .filter(Boolean)
      .slice(0, 5);
  }, [history, allSongs]);

  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return allSongs;
    const q = searchQuery.trim().toLowerCase();
    return allSongs.filter(s =>
      s.title.toLowerCase().includes(q) ||
      (s.artist && s.artist.toLowerCase().includes(q))
    );
  }, [allSongs, searchQuery]);

  const prebuiltSongs = useMemo(() => allSongs.filter(s => s.type === 'prebuilt'), [allSongs]);
  const userSongs = useMemo(() => allSongs.filter(s => s.type !== 'prebuilt'), [allSongs]);

  const categorizedGroups = useMemo(() => getCategorizedSongs(prebuiltSongs), [prebuiltSongs]);

  // Featured picks: 3 random prebuilt songs
  const featuredPicks = useMemo(() => {
    const pool = prebuiltSongs.length > 0 ? prebuiltSongs : allSongs;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [prebuiltSongs, allSongs]);

  // ── Handlers ───────────────────────────────────────
  const handlePlaySong = useCallback((song) => {
    playAtIndex(song.id);
  }, [playAtIndex]);

  const handleShuffleAll = useCallback(() => {
    if (allSongs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * allSongs.length);
    playAtIndex(allSongs[randomIndex].id);
  }, [allSongs, playAtIndex]);

  // ── Search mode ────────────────────────────────────
  if (searchQuery) {
    return (
      <motion.div
        className="home-asym"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        <div className="home-search-hero">
          <span className="home-search-hero-icon"><Icon name="search" size={24} /></span>
          <input
            type="text"
            className="home-search-hero-input"
            placeholder={`搜索 ${allSongs.length} 首歌曲...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus
          />
          <button className="home-search-hero-clear" onClick={() => setSearchQuery('')}>
            <Icon name="x" size={18} />
          </button>
          <button className="home-search-hero-btn" onClick={() => document.querySelector('.home-search-hero-input')?.focus()} title="聚焦搜索框">
            <Icon name="search" size={18} />
          </button>
        </div>
        <section className="home-asym-section">
          <div className="home-asym-section-hd">
            <h2 className="home-asym-section-title">搜索结果 · {filteredSongs.length} 首</h2>
          </div>
          {filteredSongs.length === 0 ? (
            <div className="home-empty-state">
              <span className="home-empty-icon"><Icon name="search" size={36} /></span>
              <p>没有找到 "{searchQuery}" 相关的歌曲</p>
            </div>
          ) : (
            <div className="home-song-grid">
              {filteredSongs.map(song => (
                <SongCard key={song.id} song={song} onPlay={handlePlaySong} isCurrent={currentSong?.id === song.id} isPlaying={isPlaying} />
              ))}
            </div>
          )}
        </section>
      </motion.div>
    );
  }

  // ── Main disrupted layout — sections interleaved, rows flipped ──
  return (
    <motion.div
      className="home-asym"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, delay: 0.2 }}
    >
      {/* ========== 1. HERO ========== */}
      <HeroSection
        prebuiltCount={prebuiltSongs.length}
        userCount={userSongs.length}
        totalCount={allSongs.length}
        onShuffle={handleShuffleAll}
        onBrowse={() => {
          const el = document.querySelector('.home-asym-section');
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        onSearch={() => {
          setSearchQuery(' ');
          setTimeout(() => setSearchQuery(''), 0);
        }}
      />

      {/* ========== 2. STATS — overlapping hero ========== */}
      <StatsStrip
        totalSongs={allSongs.length}
        prebuiltCount={prebuiltSongs.length}
        userCount={userSongs.length}
        historyCount={history.length}
        onTotalClick={() => {
          const el = document.querySelector('.home-asym-section');
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        onPrebuiltClick={() => {
          const el = document.querySelector('.home-asym-section');
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        onUserClick={() => {
          const el = document.querySelector('.home-asym-row-uploads');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          else navigate('/mymusic');
        }}
        onHistoryClick={() => navigate('/mymusic')}
      />

      {/* ========== 3. FEATURED PICKS — prominent, right at top ========== */}
      <div className="home-asym-section">
        <div className="home-asym-section-hd">
          <h2 className="home-asym-section-title"><Icon name="sparkles" size={20} /> 精选推荐</h2>
          <button className="home-asym-section-more" onClick={handleShuffleAll}>随机播放 →</button>
        </div>
        <FeaturedPicks songs={featuredPicks} onPlay={handlePlaySong} currentSong={currentSong} isPlaying={isPlaying} />
      </div>

      {/* ========== 4. First category + Recent side by side ========== */}
      <div className="home-asym-row home-asym-row-reverse">
        <div className="home-asym-col home-asym-col-narrow">
          <div className="home-asym-section-hd">
            <h2 className="home-asym-section-title"><Icon name="clock" size={20} /> 最近播放</h2>
            <div className="home-asym-section-hd-actions">
              {recentlyPlayed.length > 0 && (
                <button className="home-asym-section-more" onClick={clearHistory} title="清除播放记录">
                  清除
                </button>
              )}
              <button className="home-asym-section-more" onClick={() => navigate('/mymusic')}>全部 →</button>
            </div>
          </div>
          {recentlyPlayed.length > 0 ? (
            <RecentlyPlayedStack songs={recentlyPlayed} onPlay={handlePlaySong} currentSong={currentSong} isPlaying={isPlaying} />
          ) : (
            <div className="home-mini-empty">还没有播放记录</div>
          )}
        </div>
        <div className="home-asym-col home-asym-col-wide">
          {categorizedGroups[0] && (
            <CategorySection
              key={categorizedGroups[0].category.key}
              group={categorizedGroups[0]}
              idx={0}
              onPlay={handlePlaySong}
              currentSong={currentSong}
              isPlaying={isPlaying}
            />
          )}
        </div>
      </div>

      {/* ========== 5. Another category ========== */}
      {categorizedGroups[1] && (
        <CategorySection
          key={categorizedGroups[1].category.key}
          group={categorizedGroups[1]}
          idx={1}
          onPlay={handlePlaySong}
          currentSong={currentSong}
          isPlaying={isPlaying}
        />
      )}

      {/* ========== 6. Mood card — mid-page standalone banner ========== */}
      <div className="home-mood-banner">
        <MoodCard onShuffle={handleShuffleAll} />
      </div>

      {/* ========== 7. More categories sandwiched in ========== */}
      {categorizedGroups.slice(2, 4).map((group, idx) => (
        <CategorySection
          key={group.category.key}
          group={group}
          idx={idx + 2}
          onPlay={handlePlaySong}
          currentSong={currentSong}
          isPlaying={isPlaying}
        />
      ))}

      {/* ========== 8. User uploads (moved up, interleaved) ========== */}
      {userSongs.length > 0 && (
        <div className="home-asym-row home-asym-row-uploads">
          <div className="home-asym-col home-asym-col-wide">
            <div className="home-asym-section-hd">
              <h2 className="home-asym-section-title"><Icon name="upload" size={20} /> 我的上传</h2>
              <span className="home-badge">{userSongs.length} 首</span>
            </div>
            <UserUploadsList songs={userSongs.slice(0, 6)} onPlay={handlePlaySong} currentSong={currentSong} isPlaying={isPlaying} />
          </div>
          <div className="home-asym-col home-asym-col-narrow">
            <div className="home-quick-play-card" onClick={handleShuffleAll}>
              <span className="home-quick-play-icon"><Icon name="shuffle" size={28} /></span>
              <span className="home-quick-play-text">随机切一首</span>
            </div>
          </div>
        </div>
      )}

      {/* ========== 9. Remaining categories ========== */}
      {categorizedGroups.slice(4).map((group, idx) => (
        <CategorySection
          key={group.category.key}
          group={group}
          idx={idx + 4}
          onPlay={handlePlaySong}
          currentSong={currentSong}
          isPlaying={isPlaying}
        />
      ))}

      {/* Spacer for bottom bar */}
      <div className="home-bottom-spacer" />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// HERO SECTION — Bold asymmetric with offset visual
// ═══════════════════════════════════════════════════════
function HeroSection({ prebuiltCount, userCount, totalCount, onShuffle, onBrowse, onSearch }) {
  return (
    <div className="hero-asym">
      <div className="hero-asym-bg">
        <div className="hero-asym-glow hero-asym-glow-1" />
        <div className="hero-asym-glow hero-asym-glow-2" />
        <div className="hero-asym-pattern" />
      </div>

      <div className="hero-asym-body">
        {/* Main text block — left-aligned but not full width */}
        <div className="hero-asym-text">
          <div className="hero-asym-eyebrow">YueDong Music</div>
          <h1 className="hero-asym-title">
            你的<span className="hero-asym-accent">私人</span>
            <br />音乐空间
          </h1>
          <p className="hero-asym-desc">
            {totalCount} 首精选曲目 · 即点即播 · 沉浸听感
          </p>
          <div className="hero-asym-actions">
            <button className="hero-asym-btn hero-asym-btn-primary" onClick={onShuffle}>
              <span className="hero-asym-btn-icon"><PlayIcon size={18} /></span>
              随机播放
            </button>
            <button className="hero-asym-btn hero-asym-btn-ghost" onClick={onBrowse}>
              浏览曲库
              <span className="hero-asym-btn-arrow"><Icon name="arrow-right" size={16} /></span>
            </button>
            <button className="hero-asym-btn hero-asym-btn-search" onClick={onSearch} title="搜索歌曲">
              <span className="hero-asym-btn-icon"><Icon name="search" size={18} /></span>
              搜索
            </button>
          </div>
        </div>

        {/* Offset visual block — floating discs */}
        <div className="hero-asym-visual">
          <div className="hero-asym-disc hero-asym-disc-lg">
            <span><Icon name="music" size={40} /></span>
          </div>
          <div className="hero-asym-disc hero-asym-disc-md">
            <span><Icon name="guitar" size={28} /></span>
          </div>
          <div className="hero-asym-disc hero-asym-disc-sm">
            <span><Icon name="drum" size={20} /></span>
          </div>
          <div className="hero-asym-visual-label">
            <span className="hero-asym-visual-num">{totalCount}</span>
            <span className="hero-asym-visual-unit">首歌曲</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STATS STRIP — Uneven card widths
// ═══════════════════════════════════════════════════════
function StatsStrip({ totalSongs, prebuiltCount, userCount, historyCount, onTotalClick, onPrebuiltClick, onUserClick, onHistoryClick }) {
  const stats = [
    { value: totalSongs, label: '曲库总数', icon: 'disc-alt', wide: true, onClick: onTotalClick },
    { value: prebuiltCount, label: '内置精选', icon: 'gem', wide: false, onClick: onPrebuiltClick },
    { value: userCount, label: '我的上传', icon: 'upload', wide: false, onClick: onUserClick },
    { value: historyCount, label: '播放记录', icon: 'list', wide: false, onClick: onHistoryClick },
  ];

  return (
    <div className="stats-strip">
      {stats.map((s, i) => (
        <div
          key={i}
          className={`stats-item ${s.wide ? 'stats-item-wide' : ''}`}
          onClick={s.onClick}
          title={s.onClick ? `点击查看 ${s.label}` : undefined}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter') s.onClick?.(); }}
        >
          <span className="stats-item-icon"><Icon name={s.icon} size={28} /></span>
          <div className="stats-item-body">
            <span className="stats-item-value">{s.value}</span>
            <span className="stats-item-label">{s.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// FEATURED PICKS — 3 cards: 1 large + 2 small stacked
// ═══════════════════════════════════════════════════════
function FeaturedPicks({ songs, onPlay, currentSong, isPlaying }) {
  const { favorites, toggleFavorite } = useMusic();
  if (songs.length === 0) return <div className="home-mini-empty">暂无推荐</div>;

  return (
    <div className="featured-grid">
      {/* First card — large, spans full height */}
      {songs[0] && (
        <div className="featured-card featured-card-lg" onClick={e => onPlay(songs[0], e)}>
          <div className="featured-card-cover">
            {songs[0].cover ? (
              <img src={songs[0].cover} alt={songs[0].title} className="featured-card-img" />
            ) : (
              <span className="featured-card-letter">{songs[0].title.charAt(0)}</span>
            )}
            <div className="featured-card-play"><PlayIcon size={22} /></div>
          </div>
          <div className="featured-card-body">
            <div className="featured-card-tag">推荐</div>
            <div className="featured-card-title">{songs[0].title}</div>
            <div className="featured-card-artist">{songs[0].artist || '未知艺术家'}</div>
          </div>
          <button
            className={`card-fav-btn ${favorites.includes(songs[0].id) ? 'favorited' : ''}`}
            onClick={e => { e.stopPropagation(); toggleFavorite(songs[0].id); }}
            title={favorites.includes(songs[0].id) ? '取消收藏' : '收藏'}
          >
            {favorites.includes(songs[0].id) ? <HeartFilled size={16} /> : <HeartOutline size={16} />}
          </button>
        </div>
      )}

      {/* Right stack: 2 smaller cards */}
      <div className="featured-stack">
        {songs.slice(1, 3).map((song, i) => (
          <div key={song.id} className={`featured-card featured-card-sm ${i === 1 ? 'featured-card-alt' : ''}`} onClick={e => onPlay(song)}>
            <div className="featured-card-cover">
              {song.cover ? (
                <img src={song.cover} alt={song.title} className="featured-card-img" />
              ) : (
                <span className="featured-card-letter">{song.title.charAt(0)}</span>
              )}
            </div>
            <div className="featured-card-body">
              <div className="featured-card-title">{song.title}</div>
              <div className="featured-card-artist">{song.artist || '未知艺术家'}</div>
            </div>
            <div className="featured-card-idx">0{i + 2}</div>
            <button
              className={`card-fav-btn ${favorites.includes(song.id) ? 'favorited' : ''}`}
              onClick={e => { e.stopPropagation(); toggleFavorite(song.id); }}
              title={favorites.includes(song.id) ? '取消收藏' : '收藏'}
            >
              {favorites.includes(song.id) ? <HeartFilled size={16} /> : <HeartOutline size={16} />}
            </button>
          </div>
        ))}
        {songs.length < 3 && (
          <div className="featured-card featured-card-sm featured-card-placeholder">
            <span>更多歌曲即将上线</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// RECENTLY PLAYED — Vertical overlapping stack
// ═══════════════════════════════════════════════════════
function RecentlyPlayedStack({ songs, onPlay, currentSong, isPlaying }) {
  const { favorites, toggleFavorite } = useMusic();
  return (
    <div className="recent-stack">
      {songs.map((song, idx) => (
        <div
          key={song.id}
          className={`recent-stack-item ${currentSong?.id === song.id ? 'recent-stack-active' : ''}`}
          onClick={e => onPlay(song)}
          style={{ '--idx': idx }}
        >
          <div className="recent-stack-idx">{idx + 1}</div>
          <div className={`recent-stack-cover ${currentSong?.id === song.id && isPlaying ? 'spinning' : ''}`}>
            {song.cover ? <img src={song.cover} alt="" /> : <span>{song.title.charAt(0)}</span>}
          </div>
          <div className="recent-stack-info">
            <div className="recent-stack-title">{song.title}</div>
            <div className="recent-stack-artist">{song.artist}</div>
          </div>
          {currentSong?.id === song.id && (
            <span className="recent-stack-now"><Icon name="disc" size={14} /> 播放中</span>
          )}
          <button
            className={`card-fav-btn card-fav-btn-sm ${favorites.includes(song.id) ? 'favorited' : ''}`}
            onClick={e => { e.stopPropagation(); toggleFavorite(song.id); }}
            title={favorites.includes(song.id) ? '取消收藏' : '收藏'}
          >
            {favorites.includes(song.id) ? <HeartFilled size={14} /> : <HeartOutline size={14} />}
          </button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CATEGORY SECTION — Horizontal scroll with offset header
// ═══════════════════════════════════════════════════════
function CategorySection({ group, idx, onPlay, currentSong, isPlaying }) {
  const rowRef = useRef(null);
  const { category, songs } = group;
  const [expanded, setExpanded] = useState(false);

  const scroll = (direction) => {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  };

  const isEven = idx % 2 === 0;

  return (
    <section className={`home-asym-section ${isEven ? 'section-even' : 'section-odd'}`}>
      {/* Offset header — alternates left/right alignment */}
      <div className={`home-asym-section-hd ${isEven ? 'hd-left' : 'hd-right'}`}>
        <div className="home-asym-section-hd-inner">
          <span className="cat-icon-dot" style={{ background: category.color }} />
          <div>
            <h2 className="home-asym-section-title">
              <Icon name={category.icon} size={20} /> {category.name}
            </h2>
            <p className="home-asym-section-sub">{category.description}</p>
          </div>
        </div>
        <div className="home-asym-section-hd-actions">
          <span className="cat-count-badge">{songs.length} 首</span>
          <button className="cat-scroll-btn" onClick={() => scroll('left')}>
            <Icon name="chevron-left" size={18} />
          </button>
          <button className="cat-scroll-btn" onClick={() => scroll('right')}>
            <Icon name="chevron-right" size={18} />
          </button>
          <button
            className="home-asym-section-more cat-expand-btn"
            onClick={() => setExpanded(prev => !prev)}
            title={expanded ? '收起' : '展开全部'}
          >
            {expanded ? (
              <><Icon name="chevron-up" size={14} /> 收起</>
            ) : (
              <><Icon name="chevron-down" size={14} /> 展开全部</>
            )}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="home-song-grid cat-expanded-grid">
          {songs.map(song => (
            <SongCard key={song.id} song={song} onPlay={onPlay} isCurrent={currentSong?.id === song.id} isPlaying={isPlaying} />
          ))}
        </div>
      ) : (
        <div className="cat-row" ref={rowRef}>
          {songs.map(song => (
            <SongCard key={song.id} song={song} onPlay={onPlay} isCurrent={currentSong?.id === song.id} isPlaying={isPlaying} />
          ))}
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════
// USER UPLOADS — Horizontal list
// ═══════════════════════════════════════════════════════
function UserUploadsList({ songs, onPlay, currentSong, isPlaying }) {
  const { favorites, toggleFavorite } = useMusic();
  return (
    <div className="user-uploads-list">
      {songs.map((song, idx) => (
        <div
          key={song.id}
          className={`user-upload-item ${currentSong?.id === song.id ? 'user-upload-active' : ''}`}
          onClick={e => onPlay(song)}
        >
          <div className="user-upload-cover">
            <span>{song.title.charAt(0)}</span>
          </div>
          <div className="user-upload-info">
            <div className="user-upload-title">{song.title}</div>
            <div className="user-upload-artist">{song.artist || '未知'}</div>
          </div>
          <button
            className={`card-fav-btn card-fav-btn-sm ${favorites.includes(song.id) ? 'favorited' : ''}`}
            onClick={e => { e.stopPropagation(); toggleFavorite(song.id); }}
            title={favorites.includes(song.id) ? '取消收藏' : '收藏'}
          >
            {favorites.includes(song.id) ? <HeartFilled size={14} /> : <HeartOutline size={14} />}
          </button>
          <span className="user-upload-idx">{String(idx + 1).padStart(2, '0')}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MOOD CARD — Quick action card
// ═══════════════════════════════════════════════════════
function MoodCard({ onShuffle }) {
  return (
    <div className="mood-card" onClick={onShuffle}>
      <div className="mood-card-bg" />
      <div className="mood-card-content">
        <span className="mood-card-emoji"><Icon name="dice" size={40} /></span>
        <div className="mood-card-title">随机探索</div>
        <div className="mood-card-desc">不知道听什么？<br />让我们为你挑选</div>
        <span className="mood-card-cta">开始播放 →</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SONG CARD — Shared with framer-motion for smooth animations
// ═══════════════════════════════════════════════════════
function SongCard({ song, onPlay, isCurrent, isPlaying }) {
  const { favorites, toggleFavorite } = useMusic();
  const isFav = favorites.includes(song.id);
  return (
    <motion.div
      className={`home-song-card-asym ${isCurrent ? 'song-card-active' : ''}`}
      whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.95, transition: { duration: 0.15 } }}
      onClick={() => onPlay(song)}
    >
      <div className="home-song-cover-asym">
        {song.cover ? (
          <img src={song.cover} alt="" />
        ) : (
          <span className="home-song-cover-letter">{song.title.charAt(0)}</span>
        )}
        <div className="home-song-overlay-asym">
          <span>{isCurrent && isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}</span>
        </div>
      </div>
      <div className="home-song-info-asym">
        <div className="home-song-title-asym">{song.title}</div>
        <div className="home-song-artist-asym">{song.artist}</div>
      </div>
      {isCurrent && (
        <span className="home-song-badge-asym">
          {isPlaying ? <VolumeIcon volume={0.8} isMuted={false} size={14} /> : <PauseIcon size={14} />}
        </span>
      )}
      <button
        className={`card-fav-btn card-fav-btn-sm ${isFav ? 'favorited' : ''}`}
        onClick={e => { e.stopPropagation(); toggleFavorite(song.id); }}
        title={isFav ? '取消收藏' : '收藏'}
      >
        {isFav ? <HeartFilled size={14} /> : <HeartOutline size={14} />}
      </button>
    </motion.div>
  );
}
