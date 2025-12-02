/**
 * Playback Queue Hook
 * 
 * Manages the playback queue with features:
 * - Add/remove/reorder tracks
 * - Shuffle and repeat modes
 * - Queue persistence (localStorage)
 * - Auto-play next track
 */

import { useCallback, useEffect } from 'react';
import { usePlayerStore } from './usePlayerState';
import { shuffleQueue } from '@/lib/player-utils';
import type { Track } from '@/hooks/useTracksOptimized';

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
   */
  const saveQueueToStorage = useCallback(() => {
    try {
      const queueData = {
        queue,
        currentIndex,
        shuffle,
        repeat,
      };
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      localStorage.setItem(QUEUE_STATE_STORAGE_KEY, JSON.stringify({
        currentIndex,
        shuffle,
        repeat,
      }));
    } catch (error) {
      console.error('Failed to save queue to storage:', error);
    }
  }, [queue, currentIndex, shuffle, repeat]);

  /**
   * Restore queue from localStorage
   */
  const restoreQueueFromStorage = useCallback(() => {
    try {
      const savedQueue = localStorage.getItem(QUEUE_STORAGE_KEY);
      const savedState = localStorage.getItem(QUEUE_STATE_STORAGE_KEY);

      if (savedQueue && savedState) {
        const queue = JSON.parse(savedQueue) as Track[];
        const state = JSON.parse(savedState) as {
          currentIndex: number;
          shuffle: boolean;
          repeat: 'off' | 'all' | 'one';
        };

        if (queue.length > 0) {
          usePlayerStore.setState({
            queue,
            currentIndex: state.currentIndex,
            shuffle: state.shuffle,
            repeat: state.repeat,
            activeTrack: queue[state.currentIndex],
          });
        }
      }
    } catch (error) {
      console.error('Failed to restore queue from storage:', error);
    }
  }, []);

  /**
   * Auto-save queue when it changes
   */
  useEffect(() => {
    if (queue.length > 0) {
      saveQueueToStorage();
    }
  }, [queue, currentIndex, shuffle, repeat, saveQueueToStorage]);

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
