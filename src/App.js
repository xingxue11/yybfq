import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { MusicProvider, useMusic } from './context/MusicContext';
import TopNav from './components/TopNav';
import HomePage from './components/HomePage';
import MyMusicPage from './components/MyMusicPage';
import PlayerPage from './components/PlayerPage';
import SettingsPage from './components/SettingsPage';
import MiniPlayer from './components/MiniPlayer';
import HomeBottomBar from './components/HomeBottomBar';
import LoginModal from './components/LoginModal';
import './App.css';

/* Page-level transition wrapper — spring + scale for fluid feel */
function PageWrapper({ children }) {
  return (
    <motion.div
      className="page-wrapper"
      initial={{ opacity: 0, y: 36, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -18, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }}
    >
      {children}
    </motion.div>
  );
}

function AppShell() {
  const ctx = useMusic();
  const location = useLocation();

  // Sidebar collapse state — persisted in localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    localStorage.getItem('qqmusic_sidebar_collapsed') === 'true'
  );
  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('qqmusic_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Determine if a bottom bar is visible for content height adjustment
  const showBottomBar = location.pathname === '/' && !ctx.isImmersive;
  const showMiniPlayer = ctx.currentSong && location.pathname !== '/' && location.pathname !== '/player' && !ctx.isImmersive;
  const hasBottomBar = showBottomBar || showMiniPlayer;

  return (
    <div className="app" data-theme={ctx.theme}>
      {/* Hidden audio element — controlled by useMusicPlayer hook */}
      <audio ref={ctx.audioRef} preload="metadata" />

      <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Left Sidebar Navigation — hidden during immersive mode */}
        {!ctx.isImmersive && (
          <TopNav
            onLoginClick={() => ctx.setShowLoginModal(true)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
          />
        )}

        <LayoutGroup>
          {/* Page Content — with route-level transitions */}
          <div className={`app-content ${hasBottomBar ? 'has-bottom-bar' : ''} ${showBottomBar ? 'has-home-bar' : ''} ${showMiniPlayer ? 'has-mini-player' : ''}`}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
                <Route path="/mymusic" element={<PageWrapper><MyMusicPage /></PageWrapper>} />
                <Route path="/player" element={<PageWrapper><PlayerPage /></PageWrapper>} />
                <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
              </Routes>
            </AnimatePresence>
          </div>

          {/* Shared-element bottom bars — wrapped in AnimatePresence (no mode="wait") so layoutId can overlap */}
          <AnimatePresence>
            {showBottomBar && (
              <HomeBottomBar key="home-bottom-bar" />
            )}
            {showMiniPlayer && (
              <MiniPlayer key="mini-player" />
            )}
          </AnimatePresence>
        </LayoutGroup>
      </div>

      {/* Login Modal */}
      {ctx.showLoginModal && <LoginModal onClose={() => ctx.setShowLoginModal(false)} />}
    </div>
  );
}

function App() {
  return (
    <MusicProvider>
      <AppShell />
    </MusicProvider>
  );
}

export default App;
