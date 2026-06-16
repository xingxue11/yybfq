export const PLAY_MODES = [
  { key: 'list', icon: 'repeat', label: '列表循环' },
  { key: 'single', icon: 'repeat-1', label: '单曲循环' },
  { key: 'shuffle', icon: 'shuffle', label: '随机播放' },
];

export const THEMES = [
  { key: 'minimal-light', name: '极简白', icon: 'cloud', dotClass: 'minimal-light' },
  { key: 'deep-dark', name: '深邃黑', icon: 'moon', dotClass: 'deep-dark' },
  { key: 'warm-red', name: '暖橘红', icon: 'fire', dotClass: 'warm-red' },
  { key: 'qq-green', name: 'QQ绿', icon: 'heart-green', dotClass: 'qq-green' },
];

export const LYRIC_STYLES = [
  { key: 'default', icon: 'list', label: '经典列表' },
  { key: 'cinema', icon: 'clapperboard', label: '影院模式' },
  { key: 'minimal', icon: 'sparkles', label: '极简单行' },
  { key: 'karaoke', icon: 'mic', label: '卡拉OK' },
  { key: 'card', icon: 'card', label: '卡片翻转' },
  { key: 'neon', icon: 'bulb', label: '霓虹发光' },
  { key: 'typewriter', icon: 'keyboard', label: '打字机' },
  { key: 'spotlight', icon: 'spotlight', label: '聚光灯' },
  { key: 'wave', icon: 'wave', label: '波浪文字' },
];

// Visual formats shown on main PlayerPage (4 basic modes)
export const PLAYER_VISUAL_FORMATS = [
  { key: 'cover', icon: 'disc', label: '专辑封面' },
  { key: 'bars', icon: 'chart', label: '柱状' },
  { key: 'wave', icon: 'wave', label: '波浪' },
  { key: 'particles', icon: 'sparkles', label: '粒子' },
];

// Spectrum modes shown only in immersive mode (7 advanced modes)
export const IMMERSIVE_SPECTRUM_MODES = [
  { key: 'linear', icon: 'signal', label: '线性柱状' },
  { key: 'wave', icon: 'wave', label: '波浪形' },
  { key: 'flowing', icon: 'droplet', label: '流动形' },
  { key: 'raindrop', icon: 'raindrop', label: '雨滴形' },
  { key: 'circular', icon: 'circle', label: '环形频谱' },
  { key: 'particles', icon: 'sparkles', label: '粒子跳动' },
  { key: 'fire', icon: 'fire', label: '火焰跳动' },
];

// Combined for backwards compatibility
export const VISUAL_FORMATS = [...PLAYER_VISUAL_FORMATS, ...IMMERSIVE_SPECTRUM_MODES];

// Background animation options for immersive mode
export const IMMERSIVE_BG_ANIMATIONS = [
  { key: 'glow', icon: 'glow', label: '流光溢彩' },
  { key: 'stardust', icon: 'star', label: '璀璨星空' },
  { key: 'particles', icon: 'sparkles', label: '星河流转' },
  { key: 'ripples', icon: 'droplet', label: '涟漪扩散' },
  { key: 'aurora', icon: 'aurora', label: '极光幻境' },
  { key: 'none', icon: 'square', label: '无动画' },
];

// Lyric display styles in immersive mode
export const IMMERSIVE_LYRIC_STYLES = [
  { key: 'cinema', icon: 'clapperboard', label: '影院' },
  { key: 'minimal', icon: 'sparkles', label: '极简' },
  { key: 'scroll', icon: 'scroll', label: '滚动' },
  { key: 'karaoke', icon: 'mic', label: '卡拉OK' },
  { key: 'neon', icon: 'bulb', label: '霓虹' },
  { key: 'typewriter', icon: 'keyboard', label: '打字机' },
  { key: 'spotlight', icon: 'spotlight', label: '聚光灯' },
  { key: 'card', icon: 'card', label: '卡片' },
  { key: 'wave', icon: 'wave', label: '波浪' },
];

// Lyric transition animation types
export const LYRIC_TRANSITIONS = [
  { key: 'fade', icon: 'fog', label: '渐显' },
  { key: 'slide', icon: 'wind', label: '飘入' },
  { key: 'blur', icon: 'blur', label: '模糊' },
  { key: 'scale', icon: 'twirl', label: '缩放' },
  { key: 'flip', icon: 'flip', label: '翻转' },
  { key: 'bounce', icon: 'bounce', label: '弹跳' },
  { key: 'spring', icon: 'spring', label: '弹性' },
  { key: 'glitch', icon: 'glitch', label: '故障' },
  { key: 'swing', icon: 'drama', label: '摇摆' },
  { key: 'twirl', icon: 'cyclone', label: '旋转' },
];

export const PLAYER_TABS = [
  { key: 'info', icon: 'info', label: '歌曲信息' },
  { key: 'lyrics', icon: 'edit', label: '歌词' },
  { key: 'comments', icon: 'comment', label: '评论' },
  { key: 'playlist', icon: 'list', label: '播放列表' },
];

// Danmaku (弹幕) display modes for immersive mode
export const DANMAKU_MODES = [
  { key: 'off', icon: 'ban', label: '关闭弹幕' },
  { key: 'scroll', icon: 'arrow-right', label: '经典飘屏' },
  { key: 'fall', icon: 'arrow-down', label: '竖排天降' },
  { key: 'fade', icon: 'sparkles', label: '随机渐显' },
  { key: 'rain', icon: 'rain', label: '字雨滴落' },
  { key: 'bubble', icon: 'bubble', label: '气泡升腾' },
  { key: 'pulse', icon: 'twirl', label: '脉冲绽放' },
  { key: 'typewriter', icon: 'keyboard', label: '逐字浮现' },
  { key: 'mixed', icon: 'dice', label: '混合模式' },
];

export const DANMAKU_DENSITIES = [
  { key: 'low', label: '稀疏', count: 3 },
  { key: 'medium', label: '适中', count: 6 },
  { key: 'high', label: '密集', count: 12 },
];

export const AUDIO_FORMATS = {
  'audio/mpeg': 'MP3',
  'audio/mp3': 'MP3',
  'audio/wav': 'WAV',
  'audio/wave': 'WAV',
  'audio/ogg': 'OGG',
  'audio/flac': 'FLAC',
  'audio/x-flac': 'FLAC',
  'audio/mp4': 'M4A',
  'audio/m4a': 'M4A',
  'audio/x-m4a': 'M4A',
  'audio/aac': 'AAC',
  'audio/wma': 'WMA',
};
