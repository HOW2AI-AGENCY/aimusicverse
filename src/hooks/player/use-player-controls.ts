/**
 * usePlayerControls Hook
 * 
 * Implementation for User Story 2 (Phase 4): Business Logic Extraction
 * Per tasks.md T048 - Player controls (play, pause, seek, queue management)
 * 
 * Consolidates player control logic from multiple components:
 * - ExpandedPlayer, MobileFullscreenPlayer
 * - CompactPlayer, MiniPlayer
 * - PlaybackQueue components
 */

import { useCallback, useEffect, useState } from 'react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { logger } from '@/lib/logger';
import { playerStore } from '@/stores/playerStore';
import type { Track } from '@/types/database';

type RepeatMode = 'off' | 'all' | 'one';

interface UsePlayerControlsReturn {
  // Playback state
  currentTrack: Track | null;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  error: Error | null;

  // Playback controls
  play: (track: Track) => Promise<void>;
  pause: () => void;
  stop: () => void;
  togglePlayPause: () => void;

  // Seek controls
  seek: (time: number) => void;
  seekForward: (seconds?: number) => void;
  seekBackward: (seconds?: number) => void;

  // Volume controls
  volume: number;
  isMuted: boolean;
  setVolume: (volume: number) => void;
  toggleMute: () => void;

  // Queue management
  queue: Track[];
  queueIndex: number;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;

  // Playback modes
  repeatMode: RepeatMode;
  toggleRepeat: () => void;
  isShuffled: boolean;
  toggleShuffle: () => void;

  // Playback speed
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
}

/**
 * Hook for managing audio player controls with haptic feedback
 * and integration with global player store
 */
export function usePlayerControls(): UsePlayerControlsReturn {
  const haptic = useHapticFeedback();
  
  // Local state for UI responsiveness
  const [localState, setLocalState] = useState({
    currentTrack: null as Track | null,
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    error: null as Error | null,
    volume: 1,
    isMuted: false,
    queue: [] as Track[],
    queueIndex: -1,
    repeatMode: 'off' as RepeatMode,
    isShuffled: false,
    playbackSpeed: 1,
    previousVolume: 1, // For mute/unmute
  });

  // Sync with player store
  useEffect(() => {
    const unsubscribe = playerStore.subscribe((state) => {
      setLocalState(prev => ({
        ...prev,
        currentTrack: state.currentTrack || null,
        isPlaying: state.isPlaying || false,
        isPaused: state.isPaused || false,
        currentTime: state.currentTime || 0,
        duration: state.duration || 0,
        volume: state.volume ?? 1,
        isMuted: state.isMuted || false,
        queue: state.queue || [],
        queueIndex: state.queueIndex ?? -1,
        repeatMode: state.repeatMode || 'off',
        isShuffled: state.isShuffled || false,
        playbackSpeed: state.playbackSpeed || 1,
      }));
    });

    return unsubscribe;
  }, []);

  /**
   * Play a track
   */
  const play = useCallback(async (track: Track) => {
    try {
      haptic.impact('medium');

      // Update store
      playerStore.setState({
        currentTrack: track,
        isPlaying: true,
        isPaused: false,
        error: null,
      });

      // Update local state
      setLocalState(prev => ({
        ...prev,
        currentTrack: track,
        isPlaying: true,
        isPaused: false,
        error: null,
      }));

      logger.info('Playing track:', track.id);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error playing track:', err);
      
      setLocalState(prev => ({
        ...prev,
        error: err,
        isPlaying: false,
      }));

      haptic.notification('error');
      throw err;
    }
  }, [haptic]);

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    haptic.impact('light');

    playerStore.setState({
      isPlaying: false,
      isPaused: true,
    });

    setLocalState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: true,
    }));

    logger.info('Paused playback');
  }, [haptic]);

  /**
   * Stop playback and clear track
   */
  const stop = useCallback(() => {
    haptic.impact('light');

    playerStore.setState({
      currentTrack: null,
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
    });

    setLocalState(prev => ({
      ...prev,
      currentTrack: null,
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
    }));

    logger.info('Stopped playback');
  }, [haptic]);

  /**
   * Toggle play/pause
   */
  const togglePlayPause = useCallback(() => {
    if (localState.isPlaying) {
      pause();
    } else if (localState.currentTrack) {
      play(localState.currentTrack);
    }
  }, [localState.isPlaying, localState.currentTrack, play, pause]);

  /**
   * Seek to specific time
   */
  const seek = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, localState.duration));
    
    haptic.impact('light');

    playerStore.setState({
      currentTime: clampedTime,
    });

    setLocalState(prev => ({
      ...prev,
      currentTime: clampedTime,
    }));

    logger.info('Seeked to:', clampedTime);
  }, [localState.duration, haptic]);

  /**
   * Seek forward by specified seconds (default 10)
   */
  const seekForward = useCallback((seconds: number = 10) => {
    seek(localState.currentTime + seconds);
  }, [localState.currentTime, seek]);

  /**
   * Seek backward by specified seconds (default 10)
   */
  const seekBackward = useCallback((seconds: number = 10) => {
    seek(localState.currentTime - seconds);
  }, [localState.currentTime, seek]);

  /**
   * Set volume (0-1)
   */
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));

    playerStore.setState({
      volume: clampedVolume,
      isMuted: clampedVolume === 0,
    });

    setLocalState(prev => ({
      ...prev,
      volume: clampedVolume,
      isMuted: clampedVolume === 0,
    }));
  }, []);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    haptic.impact('light');

    if (localState.isMuted) {
      // Unmute - restore previous volume
      const volumeToRestore = localState.previousVolume || 0.7;
      setVolume(volumeToRestore);
      
      setLocalState(prev => ({
        ...prev,
        isMuted: false,
      }));
    } else {
      // Mute - save current volume
      setLocalState(prev => ({
        ...prev,
        previousVolume: prev.volume,
        isMuted: true,
      }));
      
      setVolume(0);
    }
  }, [localState.isMuted, localState.previousVolume, setVolume, haptic]);

  /**
   * Add track to queue
   */
  const addToQueue = useCallback((track: Track) => {
    haptic.impact('light');

    const newQueue = [...localState.queue, track];

    playerStore.setState({
      queue: newQueue,
    });

    setLocalState(prev => ({
      ...prev,
      queue: newQueue,
    }));

    logger.info('Added to queue:', track.id);
  }, [localState.queue, haptic]);

  /**
   * Remove track from queue
   */
  const removeFromQueue = useCallback((index: number) => {
    haptic.impact('light');

    const newQueue = localState.queue.filter((_, i) => i !== index);

    playerStore.setState({
      queue: newQueue,
    });

    setLocalState(prev => ({
      ...prev,
      queue: newQueue,
    }));
  }, [localState.queue, haptic]);

  /**
   * Clear queue
   */
  const clearQueue = useCallback(() => {
    haptic.impact('medium');

    playerStore.setState({
      queue: [],
      queueIndex: -1,
    });

    setLocalState(prev => ({
      ...prev,
      queue: [],
      queueIndex: -1,
    }));

    logger.info('Cleared queue');
  }, [haptic]);

  /**
   * Play next track in queue
   */
  const playNext = useCallback(async () => {
    const { queue, queueIndex, repeatMode, currentTrack } = localState;

    // Repeat one - replay current track
    if (repeatMode === 'one' && currentTrack) {
      seek(0);
      await play(currentTrack);
      return;
    }

    const nextIndex = queueIndex + 1;

    // Check if there's a next track
    if (nextIndex < queue.length) {
      const nextTrack = queue[nextIndex];
      
      playerStore.setState({
        queueIndex: nextIndex,
      });

      setLocalState(prev => ({
        ...prev,
        queueIndex: nextIndex,
      }));

      await play(nextTrack);
    } else if (repeatMode === 'all' && queue.length > 0) {
      // Repeat all - go back to start
      playerStore.setState({
        queueIndex: 0,
      });

      setLocalState(prev => ({
        ...prev,
        queueIndex: 0,
      }));

      await play(queue[0]);
    } else {
      // No more tracks
      stop();
    }
  }, [localState, play, stop, seek]);

  /**
   * Play previous track
   */
  const playPrevious = useCallback(async () => {
    const { queue, queueIndex } = localState;

    const prevIndex = queueIndex - 1;

    if (prevIndex >= 0 && prevIndex < queue.length) {
      const prevTrack = queue[prevIndex];
      
      playerStore.setState({
        queueIndex: prevIndex,
      });

      setLocalState(prev => ({
        ...prev,
        queueIndex: prevIndex,
      }));

      await play(prevTrack);
    }
  }, [localState, play]);

  /**
   * Toggle repeat mode (off -> all -> one -> off)
   */
  const toggleRepeat = useCallback(() => {
    haptic.impact('light');

    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(localState.repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];

    playerStore.setState({
      repeatMode: nextMode,
    });

    setLocalState(prev => ({
      ...prev,
      repeatMode: nextMode,
    }));

    logger.info('Repeat mode:', nextMode);
  }, [localState.repeatMode, haptic]);

  /**
   * Toggle shuffle
   */
  const toggleShuffle = useCallback(() => {
    haptic.impact('light');

    const newShuffleState = !localState.isShuffled;

    // If enabling shuffle, shuffle the queue
    if (newShuffleState && localState.queue.length > 0) {
      const shuffledQueue = [...localState.queue].sort(() => Math.random() - 0.5);
      
      playerStore.setState({
        queue: shuffledQueue,
        isShuffled: true,
        queueIndex: 0,
      });

      setLocalState(prev => ({
        ...prev,
        queue: shuffledQueue,
        isShuffled: true,
        queueIndex: 0,
      }));
    } else {
      playerStore.setState({
        isShuffled: false,
      });

      setLocalState(prev => ({
        ...prev,
        isShuffled: false,
      }));
    }

    logger.info('Shuffle:', newShuffleState);
  }, [localState.isShuffled, localState.queue, haptic]);

  /**
   * Set playback speed (0.5 - 2.0)
   */
  const setPlaybackSpeed = useCallback((speed: number) => {
    const clampedSpeed = Math.max(0.5, Math.min(2.0, speed));

    playerStore.setState({
      playbackSpeed: clampedSpeed,
    });

    setLocalState(prev => ({
      ...prev,
      playbackSpeed: clampedSpeed,
    }));

    logger.info('Playback speed:', clampedSpeed);
  }, []);

  return {
    // Playback state
    currentTrack: localState.currentTrack,
    isPlaying: localState.isPlaying,
    isPaused: localState.isPaused,
    currentTime: localState.currentTime,
    duration: localState.duration,
    buffered: localState.buffered,
    error: localState.error,

    // Playback controls
    play,
    pause,
    stop,
    togglePlayPause,

    // Seek controls
    seek,
    seekForward,
    seekBackward,

    // Volume controls
    volume: localState.volume,
    isMuted: localState.isMuted,
    setVolume,
    toggleMute,

    // Queue management
    queue: localState.queue,
    queueIndex: localState.queueIndex,
    addToQueue,
    removeFromQueue,
    clearQueue,
    playNext,
    playPrevious,

    // Playback modes
    repeatMode: localState.repeatMode,
    toggleRepeat,
    isShuffled: localState.isShuffled,
    toggleShuffle,

    // Playback speed
    playbackSpeed: localState.playbackSpeed,
    setPlaybackSpeed,
  };
}
