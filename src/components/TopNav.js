import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMusic } from '../context/MusicContext';
import Icon from './Icons';

export default function Sidebar({ onLoginClick, collapsed, onToggleCollapse }) {
  const { user, handleLogout } = useMusic();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate('/mymusic');
    }
  };

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo + Toggle */}
      <div className="sidebar-brand-area">
        <div className="sidebar-logo-icon" onClick={() => navigate('/')}>
          <Icon name="music" size={28} />
        </div>
        <span className="sidebar-logo-text" onClick={() => navigate('/')}>悦动音乐</span>
        <button
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? '展开侧边栏' : '折叠侧边栏'}
        >
          <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <span className="sidebar-search-icon"><Icon name="search" size={16} /></span>
        <input
          type="text"
          placeholder="搜索歌曲..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <motion.button
          className={`sidebar-nav-item ${location.pathname === '/' ? 'active' : ''}`}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/')}
        >
          <span className="sidebar-nav-icon"><Icon name="home" size={20} /></span>
          <span className="sidebar-nav-label">发现音乐</span>
        </motion.button>
        <motion.button
          className={`sidebar-nav-item ${location.pathname === '/mymusic' ? 'active' : ''}`}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/mymusic')}
        >
          <span className="sidebar-nav-icon"><Icon name="music-note" size={20} /></span>
          <span className="sidebar-nav-label">我的音乐</span>
        </motion.button>
        <motion.button
          className={`sidebar-nav-item ${location.pathname === '/player' ? 'active' : ''}`}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/player')}
        >
          <span className="sidebar-nav-icon"><Icon name="headphones" size={20} /></span>
          <span className="sidebar-nav-label">播放器</span>
        </motion.button>
        <motion.button
          className={`sidebar-nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/settings')}
        >
          <span className="sidebar-nav-icon"><Icon name="settings" size={20} /></span>
          <span className="sidebar-nav-label">设置</span>
        </motion.button>
      </nav>

      {/* Spacer */}
      <div className="sidebar-spacer" />

      {/* User area */}
      <div className="sidebar-user-area" ref={menuRef}>
        {user ? (
          <>
            <button className="sidebar-user-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
              <span className="sidebar-avatar">{user.username.charAt(0).toUpperCase()}</span>
              <span className="sidebar-username">{user.username}</span>
            </button>
            {showUserMenu && (
              <div className="sidebar-user-menu">
                <button
                  className="sidebar-menu-item"
                  onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                >
                  <Icon name="settings" size={16} /> 设置
                </button>
                <button
                  className="sidebar-menu-item danger"
                  onClick={() => { handleLogout(); setShowUserMenu(false); }}
                >
                  <Icon name="logout" size={16} /> 退出登录
                </button>
              </div>
            )}
          </>
        ) : (
          <button className="sidebar-login-btn" onClick={onLoginClick}>
            登录
          </button>
        )}
      </div>
    </aside>
  );
}
