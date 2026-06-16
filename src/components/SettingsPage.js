import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMusic } from '../context/MusicContext';
import { THEMES, LYRIC_STYLES } from '../utils/constants';
import Icon, { VolumeIcon } from './Icons';

export default function SettingsPage() {
  const {
    theme, setTheme,
    lyricStyle, setLyricStyle,
    volume, handleVolumeChange,
    playMode, cyclePlayMode,
    isMuted, toggleMute,
    clearHistory, history,
    user, handleLogout,
  } = useMusic();
  const navigate = useNavigate();

  return (
    <motion.div
      className="settings-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, delay: 0.2 }}
    >
      <button className="settings-back-btn" onClick={() => navigate(-1)}>
        <Icon name="arrow-left" size={18} /> 返回
      </button>

      <h2 className="settings-title"><Icon name="settings" size={24} /> 设置</h2>

      <div className="settings-layout">
        {/* Left Column */}
        <div className="settings-col">
          {/* Theme Selection */}
          <section className="settings-section">
            <h3 className="settings-section-title"><Icon name="palette" size={20} /> 主题风格</h3>
            <p className="settings-section-desc">选择你喜欢的界面配色方案</p>
            <div className="settings-theme-grid">
              {THEMES.map(t => (
                <button
                  key={t.key}
                  className={`settings-theme-card ${theme === t.key ? 'active' : ''}`}
                  onClick={() => setTheme(t.key)}
                >
                  <div className={`settings-theme-preview theme-preview-${t.key}`}>
                    <div className="settings-theme-preview-inner">
                      <div className="settings-theme-preview-dots">
                        <span className="stpd" />
                        <span className="stpd" />
                        <span className="stpd" />
                      </div>
                    </div>
                    {theme === t.key && <div className="settings-theme-check"><Icon name="check" size={16} /></div>}
                  </div>
                  <div className="settings-theme-info">
                    <span className="settings-theme-icon"><Icon name={t.icon} size={22} /></span>
                    <div>
                      <div className="settings-theme-name">{t.name}</div>
                      <div className="settings-theme-desc">
                        {t.key === 'minimal-light' ? 'Apple Music 风格' :
                         t.key === 'deep-dark' ? 'Spotify 风格' :
                         t.key === 'warm-red' ? '网易云 风格' : 'QQ音乐 风格'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Account */}
          <section className="settings-section">
            <h3 className="settings-section-title"><Icon name="home" size={20} /> 账户</h3>
            {user ? (
              <div className="settings-account">
                <div className="settings-account-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="settings-account-info">
                  <div className="settings-account-name">{user.username}</div>
                  <div className="settings-account-role">音乐爱好者</div>
                </div>
                <button className="settings-logout-btn" onClick={handleLogout}>
                  退出登录
                </button>
              </div>
            ) : (
              <div className="settings-account settings-account-empty">
                <span>暂未登录，部分功能受限</span>
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div className="settings-col">
          {/* Lyric Style */}
          <section className="settings-section">
            <h3 className="settings-section-title"><Icon name="edit" size={20} /> 歌词显示</h3>
            <p className="settings-section-desc">默认歌词展示风格</p>
            <div className="settings-lyric-grid">
              {LYRIC_STYLES.map(ls => (
                <button
                  key={ls.key}
                  className={`settings-lyric-card ${lyricStyle === ls.key ? 'active' : ''}`}
                  onClick={() => setLyricStyle(ls.key)}
                >
                  <span className="settings-lyric-icon"><Icon name={ls.icon} size={20} /></span>
                  <span className="settings-lyric-label">{ls.label}</span>
                  {lyricStyle === ls.key && <span className="settings-lyric-check"><Icon name="check" size={14} /></span>}
                </button>
              ))}
            </div>
          </section>

          {/* Playback Settings */}
          <section className="settings-section">
            <h3 className="settings-section-title"><Icon name="volume-2" size={20} /> 播放设置</h3>
            <div className="settings-row">
              <div className="settings-row-label">
                <VolumeIcon volume={isMuted ? 0 : volume} isMuted={isMuted} size={18} />
                <span>音量</span>
              </div>
              <div className="settings-row-right">
                <span className="settings-row-value">{isMuted ? '静音' : Math.round(volume * 100) + '%'}</span>
                <button
                  className="settings-mute-btn"
                  onClick={toggleMute}
                  title={isMuted ? '取消静音' : '静音'}
                >
                  <VolumeIcon volume={isMuted ? 0 : volume} isMuted={isMuted} size={20} />
                </button>
                <input
                  type="range"
                  className="settings-volume"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                />
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-row-label">
                <Icon name="repeat" size={18} />
                <span>播放模式</span>
              </div>
              <div className="settings-row-right">
                <div className="settings-playmode-btns">
                  {[
                    { key: 'list', icon: 'repeat', label: '列表循环' },
                    { key: 'single', icon: 'repeat-1', label: '单曲循环' },
                    { key: 'shuffle', icon: 'shuffle', label: '随机播放' },
                  ].map(m => (
                    <button
                      key={m.key}
                      className={`settings-playmode-opt ${playMode === m.key ? 'active' : ''}`}
                      onClick={cyclePlayMode}
                    >
                      <Icon name={m.icon} size={16} /> {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Data */}
          <section className="settings-section">
            <h3 className="settings-section-title"><Icon name="save" size={20} /> 数据管理</h3>
            <div className="settings-row">
              <div className="settings-row-label">
                <Icon name="clock" size={18} />
                <span>播放历史</span>
              </div>
              <div className="settings-row-right">
                <span className="settings-row-value">{history.length} 条记录</span>
                <button className="settings-action-btn" onClick={clearHistory}>
                  清空历史
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* About — full width at bottom */}
      <section className="settings-section settings-about-section">
        <h3 className="settings-section-title"><Icon name="info" size={20} /> 关于 悦动音乐</h3>
        <div className="settings-about">
          <div className="settings-about-logo"><Icon name="music" size={48} /></div>
          <h4>悦动音乐</h4>
          <p className="settings-about-desc">沉浸式在线音乐播放器，支持弹幕歌词、频谱可视化、多主题切换、本地音乐导入</p>
          <div className="settings-about-meta">
            <div className="settings-about-item">
              <span className="settings-about-label">版本</span>
              <span className="settings-about-value">v2.0.0</span>
            </div>
            <div className="settings-about-item">
              <span className="settings-about-label">技术栈</span>
              <span className="settings-about-value">React 19 + Context</span>
            </div>
            <div className="settings-about-item">
              <span className="settings-about-label">主题</span>
              <span className="settings-about-value">4 套风格配色</span>
            </div>
            <div className="settings-about-item">
              <span className="settings-about-label">存储引擎</span>
              <span className="settings-about-value">IndexedDB + LocalStorage</span>
            </div>
            <div className="settings-about-item">
              <span className="settings-about-label">歌词样式</span>
              <span className="settings-about-value">9 种展示模式</span>
            </div>
            <div className="settings-about-item">
              <span className="settings-about-label">音频格式</span>
              <span className="settings-about-value">MP3 / WAV / OGG / FLAC</span>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
