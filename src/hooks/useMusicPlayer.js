import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { parseLrc, readFileAsText } from '../utils/helpers';
import { saveAudioToDB, loadAllAudioFromDB, deleteAudioFromDB } from '../utils/db';
import { buildPrebuiltSongs, loadLyricsForSong } from '../data/localSongs';

export function useMusicPlayer() {
  // ===== 沉浸模式 =====
  const [isImmersive, setIsImmersive] = useState(false);
  const [immersiveSpectrumMode, setImmersiveSpectrumMode] = useState(() => {
    return localStorage.getItem('qqmusic_immersive_spectrum') || 'linear';
  });
  const [immersiveBgAnim, setImmersiveBgAnim] = useState(() => {
    return localStorage.getItem('qqmusic_immersive_bg') || 'glow';
  });
  const [immersiveLyricTransition, setImmersiveLyricTransition] = useState(() => {
    return localStorage.getItem('qqmusic_immersive_transition') || 'fade';
  });
  const [danmakuMode, setDanmakuMode] = useState(() => {
    return localStorage.getItem('qqmusic_danmaku_mode') || 'scroll';
  });
  const [danmakuDensity, setDanmakuDensity] = useState(() => {
    return localStorage.getItem('qqmusic_danmaku_density') || 'medium';
  });

  // ===== 主题 =====
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('qqmusic_theme') || 'minimal-light';
  });

  // ===== 用户认证 =====
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('qqmusic_user');
    return saved ? JSON.parse(saved) : null;
  });

  // ===== 播放列表 =====
  const [playlist, setPlaylist] = useState(() => {
    const saved = localStorage.getItem('qqmusic_playlist');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter(s => s.type === 'url');
      } catch { return []; }
    }
    return [];
  });

  const [localFiles, setLocalFiles] = useState(() => {
    const saved = localStorage.getItem('qqmusic_local_files');
    if (saved) {
      try { return JSON.parse(saved); }
      catch { return []; }
    }
    return [];
  });

  const [prebuiltSongs, setPrebuiltSongs] = useState(() => {
    return buildPrebuiltSongs(process.env.PUBLIC_URL || '');
  });

  // ===== 播放状态 =====
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const v = localStorage.getItem('qqmusic_volume');
    return v ? parseFloat(v) : 0.8;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ===== 历史 & 收藏 =====
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('qqmusic_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('qqmusic_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // ===== 播放模式 =====
  const [playMode, setPlayMode] = useState(() => {
    return localStorage.getItem('qqmusic_playmode') || 'list';
  });
  const [shuffleHistory, setShuffleHistory] = useState([]);

  // ===== 歌词样式 =====
  const [lyricStyle, setLyricStyle] = useState(() => {
    return localStorage.getItem('qqmusic_lyric_style') || 'default';
  });

  // ===== 歌词编辑 =====
  const [editingLyricId, setEditingLyricId] = useState(null);
  const [editingLyricText, setEditingLyricText] = useState('');
  const [lyricSearchQuery, setLyricSearchQuery] = useState('');
  const [lyricSearching, setLyricSearching] = useState(false);

  // ===== 登录弹窗控制 =====
  const [showLoginModal, setShowLoginModal] = useState(false);

  // ===== 其他 =====
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [loadTrigger, setLoadTrigger] = useState(0);

  // ===== Refs =====
  const audioRef = useRef(null);
  const handleNextRef = useRef(null);
  const lyricsRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingPlayRef = useRef(false);
  const dbRestoredRef = useRef(false);

  // ===== 派生数据 =====
  const allSongs = useMemo(() => [...prebuiltSongs, ...localFiles, ...playlist], [prebuiltSongs, localFiles, playlist]);
  const currentSong = allSongs[currentIndex] || null;
  const lyrics = useMemo(() => (currentSong ? parseLrc(currentSong.lyrics || '') : []), [currentSong]);

  // ===== IndexedDB 恢复 =====
  useEffect(() => {
    if (dbRestoredRef.current) return;
    dbRestoredRef.current = true;
    (async () => {
      const restored = await loadAllAudioFromDB(localFiles);
      if (restored.some(f => f.blobUrl)) {
        setLocalFiles(restored);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== 预置歌曲歌词加载 =====
  const lyricsLoadRef = useRef(false);
  useEffect(() => {
    if (lyricsLoadRef.current) return;
    lyricsLoadRef.current = true;
    (async () => {
      const loaded = await Promise.all(prebuiltSongs.map(s => loadLyricsForSong(s)));
      setPrebuiltSongs(loaded);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== 持久化 =====
  useEffect(() => {
    const meta = localFiles.map(f => ({
      id: f.id, title: f.title, artist: f.artist, lyrics: f.lyrics, type: 'local', mimeType: f.mimeType,
    }));
    localStorage.setItem('qqmusic_local_files', JSON.stringify(meta));
  }, [localFiles]);

  useEffect(() => { localStorage.setItem('qqmusic_playlist', JSON.stringify(playlist)); }, [playlist]);
  useEffect(() => { localStorage.setItem('qqmusic_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('qqmusic_volume', volume.toString()); }, [volume]);
  useEffect(() => { localStorage.setItem('qqmusic_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('qqmusic_playmode', playMode); }, [playMode]);
  useEffect(() => { localStorage.setItem('qqmusic_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('qqmusic_lyric_style', lyricStyle); }, [lyricStyle]);
  useEffect(() => { localStorage.setItem('qqmusic_immersive_spectrum', immersiveSpectrumMode); }, [immersiveSpectrumMode]);
  useEffect(() => { localStorage.setItem('qqmusic_immersive_bg', immersiveBgAnim); }, [immersiveBgAnim]);
  useEffect(() => { localStorage.setItem('qqmusic_immersive_transition', immersiveLyricTransition); }, [immersiveLyricTransition]);
  useEffect(() => { localStorage.setItem('qqmusic_danmaku_mode', danmakuMode); }, [danmakuMode]);
  useEffect(() => { localStorage.setItem('qqmusic_danmaku_density', danmakuDensity); }, [danmakuDensity]);

  // 首次添加用户歌曲时自动加载（预置歌曲不算）
  const prevSongCount = useRef(prebuiltSongs.length);
  useEffect(() => {
    if (prevSongCount.current === prebuiltSongs.length && allSongs.length > prebuiltSongs.length) {
      setLoadTrigger(n => n + 1);
    }
    prevSongCount.current = allSongs.length;
  }, [allSongs.length, prebuiltSongs.length]);

  // ===== 音频事件 =====
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
      setAudioError('');
    };
    const onEnded = () => {
      const next = handleNextRef.current;
      if (next) next();
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      setAudioError('无法加载音频文件');
      setIsLoading(false);
      setIsPlaying(false);
      setDuration(0);
    };
    const onAbort = () => {
      setAudioError('音频加载被中断');
      setIsLoading(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);
    audio.addEventListener('abort', onAbort);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('abort', onAbort);
    };
  }, []);

  // 切换歌曲时加载
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    setIsLoading(true);
    setAudioError('');

    if (currentSong.type === 'local' && currentSong.blobUrl) {
      audio.src = currentSong.blobUrl;
    } else if (currentSong.type === 'prebuilt' && currentSong.src) {
      audio.src = currentSong.src;
    } else {
      audio.src = currentSong.url || '';
    }

    audio.load();
    audio.currentTime = 0;
    setCurrentTime(0);
    setActiveLyricIndex(-1);

    if (pendingPlayRef.current) {
      pendingPlayRef.current = false;
      const tryPlay = () => {
        audio.play().catch(err => {
          console.warn('Auto-play after load failed:', err.message);
        });
      };
      if (audio.readyState >= 1) {
        tryPlay();
      } else {
        const onReady = () => {
          audio.removeEventListener('loadedmetadata', onReady);
          tryPlay();
        };
        audio.addEventListener('loadedmetadata', onReady);
      }
    }

    if (currentSong) {
      setHistory(prev => {
        const filtered = prev.filter(h => h.id !== currentSong.id);
        return [{ id: currentSong.id, title: currentSong.title, artist: currentSong.artist, time: new Date().toLocaleString() }, ...filtered].slice(0, 50);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, loadTrigger]);

  // 音量
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // 歌词高亮
  useEffect(() => {
    if (!lyrics.length) { setActiveLyricIndex(-1); return; }
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) idx = i;
      else break;
    }
    setActiveLyricIndex(idx);
  }, [currentTime, lyrics]);

  // 歌词滚动
  useEffect(() => {
    if (lyricsRef.current && activeLyricIndex >= 0) {
      const activeEl = lyricsRef.current.children[activeLyricIndex];
      if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLyricIndex]);

  // ===== 播放控制 =====
  const getShuffleIndex = useCallback(() => {
    if (allSongs.length <= 1) return 0;
    const remaining = allSongs
      .map((_, i) => i)
      .filter(i => !shuffleHistory.includes(i));
    if (remaining.length === 0) {
      setShuffleHistory([currentIndex]);
      const others = allSongs.map((_, i) => i).filter(i => i !== currentIndex);
      return others[Math.floor(Math.random() * others.length)] || 0;
    }
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    setShuffleHistory(prev => [...prev.slice(-Math.floor(allSongs.length / 2)), pick]);
    return pick;
  }, [allSongs, shuffleHistory, currentIndex]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    if (isPlaying) {
      audio.pause();
    } else {
      if (!audio.src || audio.src === window.location.href) {
        pendingPlayRef.current = true;
        setLoadTrigger(n => n + 1);
        return;
      }
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(err => {
          if (err.name === 'NotSupportedError') {
            pendingPlayRef.current = true;
            setLoadTrigger(n => n + 1);
          } else if (err.name === 'AbortError') {
            setAudioError('音频加载中，请稍候...');
          } else {
            setAudioError('播放失败: ' + err.message);
          }
        });
      }
    }
  }, [isPlaying, currentSong]);

  const handlePrev = useCallback(() => {
    if (allSongs.length === 0) return;
    pendingPlayRef.current = true;
    if (playMode === 'shuffle') {
      setCurrentIndex(getShuffleIndex());
    } else if (playMode === 'single') {
      setLoadTrigger(n => n + 1);
    } else {
      setCurrentIndex(prev => (prev - 1 + allSongs.length) % allSongs.length);
    }
  }, [allSongs.length, playMode, getShuffleIndex]);

  const handleNext = useCallback(() => {
    if (allSongs.length === 0) return;
    pendingPlayRef.current = true;
    if (playMode === 'shuffle') {
      const nextIdx = getShuffleIndex();
      setCurrentIndex(nextIdx);
    } else if (playMode === 'single') {
      setLoadTrigger(n => n + 1);
    } else {
      setCurrentIndex(prev => {
        const next = (prev + 1) % allSongs.length;
        return next;
      });
    }
  }, [allSongs.length, playMode, getShuffleIndex]);

  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  const cyclePlayMode = () => {
    const modes = ['list', 'single', 'shuffle'];
    const idx = modes.indexOf(playMode);
    setPlayMode(modes[(idx + 1) % modes.length]);
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (audio) { audio.currentTime = val; setCurrentTime(val); }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted(prev => !prev);

  const playAtIndex = (index) => {
    const realIndex = allSongs.findIndex(s => s.id === index);
    if (realIndex < 0) return;

    if (realIndex === currentIndex) {
      const audio = audioRef.current;
      if (isPlaying) {
        audio?.pause();
      } else {
        pendingPlayRef.current = true;
        setLoadTrigger(n => n + 1);
      }
    } else {
      pendingPlayRef.current = true;
      setCurrentIndex(realIndex);
    }
  };

  const removeSong = (id) => {
    // Prebuilt songs cannot be removed
    if (prebuiltSongs.some(s => s.id === id)) return;
    const isLocal = localFiles.some(s => s.id === id);
    // Find the index in the combined allSongs list
    const allIdx = allSongs.findIndex(s => s.id === id);

    if (isLocal) {
      deleteAudioFromDB(id);
      setLocalFiles(prev => {
        const song = prev.find(s => s.id === id);
        if (song?.blobUrl) URL.revokeObjectURL(song.blobUrl);
        const newList = prev.filter(s => s.id !== id);
        const remainingTotal = newList.length + playlist.length;
        if (remainingTotal === 0) {
          setIsPlaying(false);
          setCurrentIndex(0);
        } else if (allIdx < currentIndex) {
          setCurrentIndex(prevIdx => Math.max(0, prevIdx - 1));
        } else if (allIdx === currentIndex) {
          // Removing current song: stay at same index (next song slides in)
          // If it was the last song, go to 0
          if (allIdx >= remainingTotal) {
            setCurrentIndex(0);
          }
          // otherwise currentIndex stays the same (next song now at this position)
        }
        return newList;
      });
    } else {
      setPlaylist(prev => {
        const newList = prev.filter(s => s.id !== id);
        const remainingTotal = newList.length + localFiles.length;
        if (remainingTotal === 0) {
          setIsPlaying(false);
          setCurrentIndex(0);
        } else if (allIdx < currentIndex) {
          setCurrentIndex(prevIdx => Math.max(0, prevIdx - 1));
        } else if (allIdx === currentIndex) {
          if (allIdx >= remainingTotal) {
            setCurrentIndex(0);
          }
        }
        return newList;
      });
    }
    setFavorites(prev => prev.filter(fid => fid !== id));
  };

  const moveSong = (index, direction) => {
    const list = [...allSongs];
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    // Don't allow moving prebuilt songs
    if (list[index].type === 'prebuilt' || list[target].type === 'prebuilt') return;
    [list[index], list[target]] = [list[target], list[index]];

    const newLocalFiles = list.filter(s => s.type === 'local');
    const newPlaylist = list.filter(s => s.type === 'url');
    setLocalFiles(newLocalFiles);
    setPlaylist(newPlaylist);

    if (index === currentIndex) setCurrentIndex(target);
    else if (target === currentIndex) setCurrentIndex(index);
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      if (prev.includes(id)) return prev.filter(fid => fid !== id);
      return [...prev, id];
    });
  };

  // ===== 文件处理 =====
  const processFiles = (files) => {
    const fileArray = Array.from(files);
    const audioFiles = fileArray.filter(f => f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|ogg|flac|m4a|aac|wma)$/i));
    const lrcFiles = fileArray.filter(f => f.name.match(/\.lrc$/i));

    if (audioFiles.length === 0) {
      setAudioError('请选择音频文件（mp3, wav, ogg等）');
      return;
    }

    // Build .lrc filename → content map (strip .lrc extension for matching)
    const lrcMap = {};
    lrcFiles.forEach(f => {
      const baseName = f.name.replace(/\.lrc$/i, '');
      lrcMap[baseName] = f;
    });

    // Process audio files with paired lyrics
    const processPromises = audioFiles.map(async (file) => {
      const blobUrl = URL.createObjectURL(file);
      const name = file.name.replace(/\.[^/.]+$/, '');
      let lyrics = `[00:00.00]${name}\n[00:05.00]暂无歌词`;

      // Check for matching .lrc file by filename
      const matchedLrc = lrcMap[name];
      if (matchedLrc) {
        try {
          lyrics = await readFileAsText(matchedLrc);
        } catch (e) {
          console.warn('Failed to read .lrc file:', matchedLrc.name, e);
        }
      }

      return {
        id: Date.now() + Math.random(),
        title: name,
        artist: '本地音乐',
        blobUrl,
        type: 'local',
        mimeType: file.type || 'audio/mpeg',
        lyrics,
      };
    });

    Promise.all(processPromises).then(newFiles => {
      setLocalFiles(prev => [...prev, ...newFiles]);
      setAudioError('');
      newFiles.forEach(f => saveAudioToDB(f));
    });
  };

  // Update lyrics for a specific song from an .lrc file
  const updateLyricsFromFile = (songId, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const lrcText = e.target.result;
      setLocalFiles(prev => prev.map(s =>
        s.id === songId ? { ...s, lyrics: lrcText } : s
      ));
      setPlaylist(prev => prev.map(s =>
        s.id === songId ? { ...s, lyrics: lrcText } : s
      ));
    };
    reader.readAsText(file, 'GBK');
  };

  const addSong = (songData) => {
    const song = {
      id: Date.now(),
      title: songData.title.trim(),
      artist: songData.artist.trim() || '未知艺术家',
      url: '',
      cover: '',
      lyrics: songData.lyrics.trim() || `[00:00.00]${songData.title.trim()}\n[00:05.00]暂无歌词`,
      type: 'url',
    };
    setPlaylist(prev => [...prev, song]);
  };

  const clearHistory = () => setHistory([]);

  // ===== 歌词编辑 & 搜索 =====
  const startEditLyrics = (song) => {
    setEditingLyricId(song.id);
    setEditingLyricText(song.lyrics || `[00:00.00]${song.title}\n[00:05.00]暂无歌词`);
    setLyricSearchQuery('');
    const realIndex = allSongs.findIndex(s => s.id === song.id);
    if (realIndex >= 0 && realIndex !== currentIndex) {
      setCurrentIndex(realIndex);
    }
  };

  const saveLyrics = () => {
    if (!editingLyricId) return;
    const isLocal = localFiles.some(s => s.id === editingLyricId);
    if (isLocal) {
      setLocalFiles(prev => prev.map(s =>
        s.id === editingLyricId ? { ...s, lyrics: editingLyricText } : s
      ));
    } else {
      setPlaylist(prev => prev.map(s =>
        s.id === editingLyricId ? { ...s, lyrics: editingLyricText } : s
      ));
    }
    setEditingLyricId(null);
    setEditingLyricText('');
  };

  const searchLyrics = async () => {
    if (!lyricSearchQuery.trim()) return;
    setLyricSearching(true);
    try {
      const parts = lyricSearchQuery.trim().split('-').map(s => s.trim());
      const artist = parts[1] || '';
      const title = parts[0];
      const resp = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.lyrics) {
          const lines = data.lyrics.split('\n').filter(l => l.trim());
          const lrc = lines.map((line, i) => {
            const min = Math.floor(i * 5 / 60);
            const sec = (i * 5) % 60;
            return `[${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.00]${line}`;
          }).join('\n');
          setEditingLyricText(lrc);
          setAudioError('');
        } else {
          setAudioError('未找到歌词，请尝试"歌手-歌名"格式');
        }
      } else {
        setAudioError('未找到歌词，请手动输入或尝试其他关键词');
      }
    } catch {
      setAudioError('歌词搜索失败，请检查网络连接');
    }
    setLyricSearching(false);
  };

  // ===== 登录 =====
  const handleLogin = (loginForm) => {
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      return { error: '请输入用户名和密码' };
    }
    const newUser = { username: loginForm.username.trim() };
    setUser(newUser);
    localStorage.setItem('qqmusic_user', JSON.stringify(newUser));
    return { error: '', user: newUser };
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('qqmusic_user');
    setIsPlaying(false);
  };

  return {
    // 沉浸模式
    isImmersive, setIsImmersive,
    immersiveSpectrumMode, setImmersiveSpectrumMode,
    immersiveBgAnim, setImmersiveBgAnim,
    immersiveLyricTransition, setImmersiveLyricTransition,
    // 弹幕
    danmakuMode, setDanmakuMode,
    danmakuDensity, setDanmakuDensity,
    // 主题
    theme, setTheme,
    // 用户
    user, handleLogin, handleLogout,
    // 登录弹窗
    showLoginModal, setShowLoginModal,
    // 数据
    playlist, setPlaylist,
    localFiles, setLocalFiles,
    prebuiltSongs, setPrebuiltSongs,
    allSongs, currentSong,
    // 播放状态
    currentIndex, setCurrentIndex,
    isPlaying, setIsPlaying,
    currentTime, duration,
    volume, isMuted,
    audioError, isLoading,
    playMode, cyclePlayMode,
    // 历史 & 收藏
    history, favorites,
    toggleFavorite, clearHistory,
    // 播放控制
    togglePlay, handlePrev, handleNext,
    playAtIndex, removeSong, moveSong,
    handleSeek, handleVolumeChange, toggleMute,
    // 文件 & 歌曲管理
    addSong, processFiles, updateLyricsFromFile,
    // 歌词
    lyrics, lyricStyle, setLyricStyle,
    activeLyricIndex,
    editingLyricId, editingLyricText, setEditingLyricText,
    lyricSearchQuery, setLyricSearchQuery,
    lyricSearching, searchLyrics,
    startEditLyrics, saveLyrics,
    setEditingLyricId,
    // Refs
    audioRef, fileInputRef, lyricsRef,
  };
}
