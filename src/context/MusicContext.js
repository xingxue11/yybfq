import React, { createContext, useContext } from 'react';
import { useMusicPlayer } from '../hooks/useMusicPlayer';

const MusicContext = createContext(null);

export function MusicProvider({ children }) {
  const music = useMusicPlayer();
  return (
    <MusicContext.Provider value={music}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within MusicProvider');
  return ctx;
}

export default MusicContext;
