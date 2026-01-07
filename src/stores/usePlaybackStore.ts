/**
 * usePlaybackStore
 * 
 * Standalone Zustand store for playback state when used outside of unified studio.
 * Uses the playbackSlice for consistent behavior.
 * 
 * @example
 * ```tsx
 * const { isPlaying, currentTime, play, pause, seek } = usePlaybackStore();
 * ```
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createPlaybackSlice, type PlaybackSlice } from './slices';

/**
 * Standalone playback store
 * Use when controlling playback outside of the full studio context
 */
export const usePlaybackStore = create<PlaybackSlice>()(
  subscribeWithSelector((...a) => createPlaybackSlice(...a))
);

/**
 * Hook to get playback status
 * Optimized to prevent unnecessary re-renders
 */
export function usePlaybackStatus() {
  return usePlaybackStore((state) => ({
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    duration: state.duration,
  }));
}

/**
 * Hook to get playback controls (stable references)
 */
export function usePlaybackControls() {
  return usePlaybackStore((state) => ({
    play: state.play,
    pause: state.pause,
    stop: state.stop,
    togglePlay: state.togglePlay,
    seek: state.seek,
    skipForward: state.skipForward,
    skipBackward: state.skipBackward,
  }));
}

/**
 * Hook to get loop controls
 */
export function useLoopControls() {
  return usePlaybackStore((state) => ({
    loopMode: state.loopMode,
    loopRegion: state.loopRegion,
    setLoopMode: state.setLoopMode,
    setLoopRegion: state.setLoopRegion,
    cycleLoopMode: state.cycleLoopMode,
  }));
}

/**
 * Hook to get playback progress (0-1)
 */
export function usePlaybackProgress() {
  return usePlaybackStore((state) =>
    state.duration > 0 ? state.currentTime / state.duration : 0
  );
}

/**
 * Hook to get buffering/seeking state
 */
export function usePlaybackLoadingState() {
  return usePlaybackStore((state) => ({
    isBuffering: state.isBuffering,
    isSeeking: state.isSeeking,
  }));
}
