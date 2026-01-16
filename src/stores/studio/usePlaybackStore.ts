/**
 * Playback Store
 *
 * Manages studio playback controls (play, pause, stop, seek).
 * Extracted from useUnifiedStudioStore for better maintainability.
 *
 * @module stores/studio/usePlaybackStore
 */

import { create } from 'zustand';
import { logger } from '@/lib/logger';

const playbackLogger = logger.child({ module: 'PlaybackStore' });

// ============ State Interface ============

interface PlaybackState {
  // Playback state
  isPlaying: boolean;
  currentTime: number;

  // Actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  togglePlayback: () => void;
}

// ============ Store Implementation ============

export const usePlaybackStore = create<PlaybackState>()((set, get) => ({
  // Initial state
  isPlaying: false,
  currentTime: 0,

  /**
   * Start playback
   */
  play: () => {
    set({ isPlaying: true });
    playbackLogger.debug('Playback started');
  },

  /**
   * Pause playback
   */
  pause: () => {
    set({ isPlaying: false });
    playbackLogger.debug('Playback paused');
  },

  /**
   * Stop playback and reset to beginning
   */
  stop: () => {
    set({ isPlaying: false, currentTime: 0 });
    playbackLogger.debug('Playback stopped');
  },

  /**
   * Seek to specific time
   */
  seek: (time: number) => {
    set({ currentTime: Math.max(0, time) });
    playbackLogger.debug('Seeked', { time });
  },

  /**
   * Toggle playback state
   */
  togglePlayback: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },
}));
