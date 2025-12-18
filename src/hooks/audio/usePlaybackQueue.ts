/**
 * Playback Queue Hook
 * 
 * Comprehensive queue management system for the music player.
 * Provides high-level operations for queue manipulation, mode control,
 * and state persistence.
 * 
 * Features:
 * - Add/remove/reorder tracks with smart index management
 * - Shuffle and repeat mode control with queue transformation
 * - Automatic localStorage persistence with error handling
 * - Queue restoration on app restart
 * - Jump to specific track functionality
 * - Batch operations for multiple tracks
 * 
 * @module usePlaybackQueue
 */

import { useCallback, useEffect } from 'react';
import { usePlayerStore } from './usePlayerState';
import { shuffleQueue } from '@/lib/player-utils';
import type { Track } from '@/types/track';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'PlaybackQueue' });

// Storage keys for queue persistence
const QUEUE_STORAGE_KEY = 'musicverse-playback-queue';
const QUEUE_STATE_STORAGE_KEY = 'musicverse-queue-state';

/**
 * Hook for managing playback queue
 */
export function usePlaybackQueue() {
  const {
    queue,
    currentIndex,
    shuffle,
    repeat,
    addToQueue,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    toggleShuffle,
    toggleRepeat,
  } = usePlayerStore();

  /**
   * Add track to queue
   */
  const addTrack = useCallback(
    (track: Track, playNow: boolean = false) => {
      if (playNow) {
        // Add to beginning and play
        const newQueue = [track, ...queue];
        usePlayerStore.setState({
          queue: newQueue,
          activeTrack: track,
          currentIndex: 0,
          isPlaying: true,
        });
      } else {
        addToQueue(track);
      }
    },
    [queue, addToQueue]
  );

  /**
   * Add multiple tracks to queue
   */
  const addTracks = useCallback(
    (tracks: Track[], playFirst: boolean = false) => {
      if (tracks.length === 0) return;

      if (playFirst) {
        const newQueue = [...tracks, ...queue];
        usePlayerStore.setState({
          queue: newQueue,
          activeTrack: tracks[0],
          currentIndex: 0,
          isPlaying: true,
        });
      } else {
        const newQueue = [...queue, ...tracks];
        usePlayerStore.setState({ queue: newQueue });
      }
    },
    [queue]
  );

  /**
   * Replace entire queue with new tracks
   */
  const setQueue = useCallback((tracks: Track[], startIndex: number = 0) => {
    if (tracks.length === 0) {
      clearQueue();
      return;
    }

    const safeIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
    usePlayerStore.setState({
      queue: tracks,
      activeTrack: tracks[safeIndex],
      currentIndex: safeIndex,
      isPlaying: true,
      playerMode: 'compact', // Auto-open player when setting queue
    });
  }, [clearQueue]);

  /**
   * Remove track from queue by index
   */
  const removeTrack = useCallback(
    (index: number) => {
      removeFromQueue(index);
    },
    [removeFromQueue]
  );

  /**
   * Clear all tracks from queue
   */
  const clear = useCallback(() => {
    clearQueue();
  }, [clearQueue]);

  /**
   * Reorder tracks in queue (drag and drop)
   */
  const reorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      reorderQueue(fromIndex, toIndex);
    },
    [reorderQueue]
  );

  /**
   * Toggle shuffle mode
   */
  const toggleShuffleMode = useCallback(() => {
    const newShuffleState = !shuffle;
    
    if (newShuffleState) {
      // Shuffle the queue, keeping current track at the beginning
      const shuffled = shuffleQueue(queue, currentIndex);
      usePlayerStore.setState({
        queue: shuffled,
        currentIndex: 0,
        shuffle: true,
      });
    } else {
      // When turning off shuffle, we keep the current queue order
      // (it would be complex to restore original order)
      toggleShuffle();
    }
  }, [shuffle, queue, currentIndex, toggleShuffle]);

  /**
   * Toggle repeat mode (off -> all -> one -> off)
   */
  const toggleRepeatMode = useCallback(() => {
    toggleRepeat();
  }, [toggleRepeat]);

  /**
   * Jump to specific track in queue
   */
  const jumpToTrack = useCallback(
    (index: number) => {
      if (index < 0 || index >= queue.length) return;

      usePlayerStore.setState({
        activeTrack: queue[index],
        currentIndex: index,
        isPlaying: true,
      });
    },
    [queue]
  );

  /**
   * Save queue to localStorage
   * 
   * Persists both the queue data and state (index, modes) separately
   * for better error recovery and data integrity.
   * 
   * Error handling: Fails silently (logs error) to not disrupt user experience
   * Common errors: QuotaExceededError (storage full), SecurityError (private mode)
   */
  const saveQueueToStorage = useCallback(() => {
    try {
      // Save queue tracks (can be large)
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      
      // Save queue state separately (small, critical data)
      localStorage.setItem(QUEUE_STATE_STORAGE_KEY, JSON.stringify({
        currentIndex,
        shuffle,
        repeat,
      }));
    } catch (error) {
      // Log but don't throw - storage issues shouldn't break playback
      log.error('Failed to save queue to storage', { error });
      
      // If quota exceeded, try clearing old data
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        log.warn('Storage quota exceeded - queue persistence disabled');
      }
    }
  }, [queue, currentIndex, shuffle, repeat]);

  /**
   * Restore queue from localStorage
   * 
   * Attempts to restore previously saved queue on app initialization.
   * Validates data integrity before restoring state.
   * 
   * Safety features:
   * - Type validation for parsed data
   * - Bounds checking for currentIndex
   * - Graceful degradation on parse errors
   */
  const restoreQueueFromStorage = useCallback(() => {
    try {
      const savedQueue = localStorage.getItem(QUEUE_STORAGE_KEY);
      const savedState = localStorage.getItem(QUEUE_STATE_STORAGE_KEY);

      if (savedQueue && savedState) {
        const queue = JSON.parse(savedQueue);
        const state = JSON.parse(savedState);

        // Strict validation of restored data
        if (
          Array.isArray(queue) && 
          queue.length > 0 &&
          queue.every(track => track && typeof track === 'object' && track.id) &&
          state &&
          typeof state === 'object' &&
          typeof state.currentIndex === 'number' &&
          typeof state.shuffle === 'boolean' &&
          ['off', 'all', 'one'].includes(state.repeat)
        ) {
          // Ensure currentIndex is within valid range
          const safeIndex = Math.max(0, Math.min(state.currentIndex, queue.length - 1));
          
          // Restore player state
          usePlayerStore.setState({
            queue,
            currentIndex: safeIndex,
            shuffle: state.shuffle,
            repeat: state.repeat,
            activeTrack: queue[safeIndex],
          });
          
          log.info('Restored queue', { trackCount: queue.length });
        } else {
          log.warn('Invalid queue data in storage, ignoring');
        }
      }
    } catch (error) {
      // Parse or validation error - start with clean state
      log.error('Failed to restore queue from storage', { error });
      log.info('Starting with empty queue');
    }
  }, []);

  /**
   * Auto-save effect - persists queue on changes
   * 
   * Debounced through React's render cycle - only saves after state settles.
   * Only saves if queue has content to avoid storing empty state.
   * 
   * Note: saveQueueToStorage is stable (wrapped in useCallback with stable deps),
   * but we inline the logic here to avoid any potential re-run issues.
   */
  useEffect(() => {
    if (queue.length > 0) {
      try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
        localStorage.setItem(QUEUE_STATE_STORAGE_KEY, JSON.stringify({
          currentIndex,
          shuffle,
          repeat,
        }));
      } catch (error) {
        log.error('Failed to save queue to storage', { error });
      }
    }
  }, [queue, currentIndex, shuffle, repeat]);

  return {
    // Queue data
    queue,
    currentIndex,
    shuffle,
    repeat,
    queueLength: queue.length,
    
    // Queue operations
    addTrack,
    addTracks,
    setQueue,
    removeTrack,
    clear,
    reorder,
    jumpToTrack,
    
    // Playback modes
    toggleShuffle: toggleShuffleMode,
    toggleRepeat: toggleRepeatMode,
    
    // Persistence
    saveQueue: saveQueueToStorage,
    restoreQueue: restoreQueueFromStorage,
  };
}
