/**
 * Playback Slice
 * 
 * Zustand slice for audio playback state management.
 * Handles play/pause, time tracking, loop modes.
 * 
 * @see ADR-003 Performance Optimization Architecture
 */

import { StateCreator } from 'zustand';

// ============ Types ============

export type LoopMode = 'none' | 'all' | 'one' | 'section';

export interface LoopRegion {
  start: number;
  end: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  loopMode: LoopMode;
  loopRegion: LoopRegion | null;
  isBuffering: boolean;
  isSeeking: boolean;
}

export interface PlaybackActions {
  // Playback controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  togglePlay: () => void;
  
  // Time controls
  seek: (time: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  
  // Rate controls
  setPlaybackRate: (rate: number) => void;
  
  // Loop controls
  setLoopMode: (mode: LoopMode) => void;
  setLoopRegion: (region: LoopRegion | null) => void;
  cycleLoopMode: () => void;
  
  // Buffer/seek state
  setIsBuffering: (buffering: boolean) => void;
  setIsSeeking: (seeking: boolean) => void;
}

export type PlaybackSlice = PlaybackState & PlaybackActions;

// ============ Default State ============

const DEFAULT_PLAYBACK_STATE: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  loopMode: 'none',
  loopRegion: null,
  isBuffering: false,
  isSeeking: false,
};

// ============ Loop Mode Cycle ============

const LOOP_MODE_CYCLE: LoopMode[] = ['none', 'all', 'one'];

// ============ Slice Creator ============

export const createPlaybackSlice: StateCreator<
  PlaybackSlice,
  [],
  [],
  PlaybackSlice
> = (set, get) => ({
  ...DEFAULT_PLAYBACK_STATE,

  // ============ Playback Controls ============

  play: () => {
    set({ isPlaying: true });
  },

  pause: () => {
    set({ isPlaying: false });
  },

  stop: () => {
    set({ isPlaying: false, currentTime: 0 });
  },

  togglePlay: () => {
    set((state) => ({ isPlaying: !state.isPlaying }));
  },

  // ============ Time Controls ============

  seek: (time) => {
    const { duration } = get();
    const clampedTime = Math.max(0, Math.min(time, duration || 0));
    set({ currentTime: clampedTime, isSeeking: false });
  },

  setCurrentTime: (time) => {
    set({ currentTime: time });
  },

  setDuration: (duration) => {
    set({ duration: Math.max(0, duration) });
  },

  skipForward: (seconds = 10) => {
    const { currentTime, duration } = get();
    const newTime = Math.min(currentTime + seconds, duration || 0);
    set({ currentTime: newTime });
  },

  skipBackward: (seconds = 10) => {
    const { currentTime } = get();
    const newTime = Math.max(currentTime - seconds, 0);
    set({ currentTime: newTime });
  },

  // ============ Rate Controls ============

  setPlaybackRate: (rate) => {
    const clampedRate = Math.max(0.25, Math.min(4, rate));
    set({ playbackRate: clampedRate });
  },

  // ============ Loop Controls ============

  setLoopMode: (mode) => {
    set({ loopMode: mode });
  },

  setLoopRegion: (region) => {
    set({ loopRegion: region });
  },

  cycleLoopMode: () => {
    const { loopMode } = get();
    const currentIndex = LOOP_MODE_CYCLE.indexOf(loopMode);
    const nextIndex = (currentIndex + 1) % LOOP_MODE_CYCLE.length;
    set({ loopMode: LOOP_MODE_CYCLE[nextIndex] });
  },

  // ============ Buffer/Seek State ============

  setIsBuffering: (buffering) => {
    set({ isBuffering: buffering });
  },

  setIsSeeking: (seeking) => {
    set({ isSeeking: seeking });
  },
});

// ============ Selectors ============

/**
 * Selector for playback status (commonly used together)
 */
export const selectPlaybackStatus = (state: PlaybackSlice) => ({
  isPlaying: state.isPlaying,
  currentTime: state.currentTime,
  duration: state.duration,
});

/**
 * Selector for loop state
 */
export const selectLoopState = (state: PlaybackSlice) => ({
  loopMode: state.loopMode,
  loopRegion: state.loopRegion,
});

/**
 * Selector for playback progress (0-1)
 */
export const selectProgress = (state: PlaybackSlice) =>
  state.duration > 0 ? state.currentTime / state.duration : 0;
