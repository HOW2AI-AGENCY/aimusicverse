/**
 * Playback Store
 *
 * Manages studio playback controls (play, pause, stop, seek).
 * Extracted from useUnifiedStudioStore for better maintainability.
 *
 * @module stores/studio/usePlaybackStore
 *
 * @example
 * ```tsx
 * import { usePlaybackStore } from '@/stores/studio';
 *
 * function TransportControls() {
 *   const { isPlaying, play, pause, seek, currentTime } = usePlaybackStore();
 *
 *   return (
 *     <div>
 *       <button onClick={isPlaying ? pause : play}>
 *         {isPlaying ? 'Pause' : 'Play'}
 *       </button>
 *       <span>{currentTime}s</span>
 *     </div>
 *   );
 * }
 * ```
 */

import { create } from 'zustand';
import { logger } from '@/lib/logger';

const playbackLogger = logger.child({ module: 'PlaybackStore' });

// ============ State Interface ============

/**
 * Playback state and actions
 */
interface PlaybackState {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Current playback position in seconds */
  currentTime: number;

  /** Start playback */
  play: () => void;
  /** Pause playback */
  pause: () => void;
  /** Stop playback and reset to beginning */
  stop: () => void;
  /** Seek to specific time in seconds */
  seek: (time: number) => void;
  /** Toggle between play and pause */
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
