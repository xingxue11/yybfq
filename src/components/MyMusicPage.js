import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useMusic } from '../context/MusicContext';
import Icon, { HeartFilled, HeartOutline } from './Icons';

export default function MyMusicPage() {
  const {
    allSongs, currentIndex, isPlaying,
    favorites, toggleFavorite,
    playAtIndex, removeSong, moveSong,
    addSong, processFiles, updateLyricsFromFile,
    startEditLyrics,
    fileInputRef, audioError,
    history, clearHistory,
  } = useMusic();

  const lrcInputRef = useRef(null);
  const [lrcTargetId, setLrcTargetId] = useState(null);

  // Local state
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSong, setNewSong] = useState({ title: '', artist: '', lyrics: '' });
  const [dragOver, setDragOver] = useState(false);

  const favoriteCount = useMemo(() => {
    return allSongs.filter(s => favorites.includes(s.id)).length;
  }, [allSongs, favorites]);

  const filteredSongs = useMemo(() => {
    let list = allSongs;
    if (activeTab === 'favorites') {
      list = list.filter(s => favorites.includes(s.id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) ||
        (s.artist && s.artist.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allSongs, searchQuery, activeTab, favorites]);

  const handleAddSong = (e) => {
    e.preventDefault();
    if (!newSong.title.trim()) return;
    addSong(newSong);
    setNewSong({ title: '', artist: '', lyrics: '' });
    setShowAddForm(false);
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.length > 0) processFiles(e.target.files);
    e.target.value = '';
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length > 0) processFiles(e.dataTransfer.files);
  };

  return (
    <motion.div
      className="mymusic-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, delay: 0.2 }}
    >
      {/* Header */}
      <div className="mymusic-header">
        <h2><Icon name="music-note" size={24} /> 我的音乐</h2>
        <div className="mymusic-header-actions">
          <div className="search-box">
            <span className="search-icon"><Icon name="search" size={16} /></span>
            <input
              type="text"
              placeholder="搜索歌曲或艺术家..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
          <button
            className="mymusic-action-btn"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '取消' : '+ 添加歌曲'}
          </button>
          <button
            className="mymusic-action-btn primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon name="folder" size={16} /> 导入音乐
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.lrc"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <input
            ref={lrcInputRef}
            type="file"
            accept=".lrc"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.[0] && lrcTargetId) {
                updateLyricsFromFile(lrcTargetId, e.target.files[0]);
                setLrcTargetId(null);
              }
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mymusic-tabs">
        <button
          className={`mymusic-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          全部歌曲 ({allSongs.length})
        </button>
        <button
          className={`mymusic-tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          <Icon name="heart" size={16} /> 我的收藏 ({favoriteCount})
        </button>
      </div>

      {/* Add Song Form */}
      {showAddForm && (
        <form className="add-song-form" onSubmit={handleAddSong}>
          <input
            placeholder="歌曲名称 *"
            value={newSong.title}
            onChange={e => setNewSong({ ...newSong, title: e.target.value })}
            required
          />
          <input
            placeholder="艺术家"
            value={newSong.artist}
            onChange={e => setNewSong({ ...newSong, artist: e.target.value })}
          />
          <textarea
            placeholder="LRC 歌词（可选）"
            value={newSong.lyrics}
            onChange={e => setNewSong({ ...newSong, lyrics: e.target.value })}
            rows={3}
          />
          <button type="submit" className="btn-submit">添加到列表</button>
        </form>
      )}

      {/* Drag & Drop Area */}
      <div
        className={`upload-area ${dragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-icon"><Icon name="folder-open" size={36} /></div>
        <div className="upload-text">拖拽音频文件到此处，或点击选择</div>
        <div className="upload-hint">支持 MP3 / WAV / OGG / FLAC 等格式，可同时选择 .lrc 歌词文件</div>
      </div>

      {audioError && (
        <div className="mymusic-error"><Icon name="error" size={16} /> {audioError}</div>
      )}

      {/* Song List */}
      <div className="mymusic-content">
        <div className="mymusic-content-header">
          <span>
            {activeTab === 'favorites' ? (
              <><Icon name="heart" size={16} /> 收藏列表</>
            ) : (
              <><Icon name="music-note" size={16} /> 歌曲列表</>
            )}
            <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '8px' }}>
              {filteredSongs.length} 首
            </span>
          </span>
        </div>

        <div className="mymusic-list">
          {filteredSongs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                {searchQuery ? (
                  <Icon name="search" size={32} />
                ) : activeTab === 'favorites' ? (
                  <Icon name="heart-broken" size={32} />
                ) : (
                  <Icon name="music-note" size={32} />
                )}
              </div>
              <div>
                {searchQuery
                  ? `没有找到 "${searchQuery}" 相关的歌曲`
                  : activeTab === 'favorites'
                    ? '还没有收藏歌曲，点击 ♡ 收藏吧'
                    : '列表空空，上传音乐或添加歌曲吧'}
              </div>
            </div>
          ) : (
            filteredSongs.map((song, idx) => {
              const realIndex = allSongs.findIndex(s => s.id === song.id);
              const isFav = favorites.includes(song.id);
              return (
                <div
                  key={song.id}
                  className={`playlist-item ${realIndex === currentIndex ? 'playing' : ''}`}
                  onDoubleClick={() => playAtIndex(song.id)}
                >
                  <div className="pl-idx" onClick={() => playAtIndex(song.id)} style={{ cursor: 'pointer' }}>
                    {realIndex === currentIndex && isPlaying ? (
                      <Icon name="volume-2" size={16} />
                    ) : idx + 1}
                  </div>
                  <div className="pl-cover">
                    {song.cover ? <img src={song.cover} alt="" /> : <Icon name="music-note" size={20} />}
                  </div>
                  <div className="pl-info">
                    <div className="pl-title">{song.title}</div>
                    <div className="pl-artist">{song.artist}{song.type === 'local' ? ' 本地' : ''}</div>
                  </div>
                  <div className="pl-actions">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditLyrics(song); }}
                      title="编辑歌词"
                    >
                      <Icon name="edit" size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLrcTargetId(song.id);
                        lrcInputRef.current?.click();
                      }}
                      title="导入LRC歌词文件"
                    >
                      <Icon name="file" size={16} />
                    </button>
                    <button
                      className={`fav-btn ${isFav ? 'favorited' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(song.id); }}
                      title={isFav ? '取消收藏' : '收藏'}
                    >
                      {isFav ? <HeartFilled size={16} /> : <HeartOutline size={16} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSong(realIndex, -1); }}
                      title="上移"
                    >
                      <Icon name="chevron-up" size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSong(realIndex, 1); }}
                      title="下移"
                    >
                      <Icon name="chevron-down" size={16} />
                    </button>
                    <button
                      className="del-btn"
                      onClick={(e) => { e.stopPropagation(); removeSong(song.id); }}
                      title="删除"
                    >
                      <Icon name="x" size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* History Section */}
      <div className="mymusic-history">
        <div className="mymusic-content-header">
          <span><Icon name="clock" size={16} /> 播放历史</span>
          <button className="panel-tab" onClick={clearHistory} style={{ fontSize: '11px' }}>清空</button>
        </div>
        <div className="mymusic-history-list">
          {history.length === 0 ? (
            <div className="empty-state" style={{ padding: '12px 0' }}>
              <div style={{ fontSize: '13px' }}>暂无播放记录</div>
            </div>
          ) : (
            history.slice(0, 15).map((h, i) => (
              <div
                key={i}
                className="history-item"
                onDoubleClick={() => {
                  const song = allSongs.find(s => s.id === h.id);
                  if (song) playAtIndex(song.id);
                }}
              >
                <span className="h-icon"><Icon name="clock" size={14} /></span>
                <div className="h-info">
                  <div className="h-title">{h.title}</div>
                  <div className="h-artist">{h.artist}</div>
                </div>
                <span className="h-time">{h.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
