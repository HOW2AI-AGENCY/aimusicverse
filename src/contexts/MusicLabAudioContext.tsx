import { createContext, useContext, useRef, ReactNode } from 'react';
import { createAudioContext } from '@/lib/audio/audioContextHelper';

/**
 * Music Lab Audio Context
 * 
 * Provides shared audio context and utilities for all Music Lab tools.
 * Ensures consistent audio routing and prevents conflicts between tools.
 * 
 * Sprint 025: US-025-001
 */

interface MusicLabAudioContextValue {
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  getAudioContext: () => AudioContext;
}

const MusicLabAudioContext = createContext<MusicLabAudioContextValue | null>(null);

export function MusicLabAudioProvider({ children }: { children: ReactNode }) {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }
    return audioContextRef.current;
  };

  return (
    <MusicLabAudioContext.Provider value={{ audioContextRef, getAudioContext }}>
      {children}
    </MusicLabAudioContext.Provider>
  );
}

export function useMusicLabAudio() {
  const context = useContext(MusicLabAudioContext);
  if (!context) {
    throw new Error('useMusicLabAudio must be used within MusicLabAudioProvider');
  }
  return context;
}
