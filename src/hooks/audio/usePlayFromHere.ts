/**
 * Play All from Here Hook
 * 
 * Provides "Play All from Here" functionality for track lists.
 * When user clicks on a track in a playlist/library, this starts
 * playing from that track and queues the rest.
 */

import { useCallback } from 'react';
import { usePlaybackQueue } from './usePlaybackQueue';
import type { Track } from '@/types/track';
import { hapticImpact } from '@/lib/haptic';
import { toast } from 'sonner';

interface UsePlayFromHereOptions {
  /** Show toast on action */
  showToast?: boolean;
  /** Haptic feedback intensity */
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
}

/**
 * Hook for "Play All from Here" functionality
 * 
 * @param tracks - Full array of tracks in the list
 * @param options - Configuration options
 * @returns Object with playFromHere function
 * 
 * @example
 * ```tsx
 * const { playFromHere } = usePlayFromHere(tracks);
 * 
 * // In track item click handler:
 * <TrackItem onClick={() => playFromHere(index)} />
 * ```
 */
export function usePlayFromHere(
  tracks: Track[],
  options: UsePlayFromHereOptions = {}
) {
  const { playFromIndex } = usePlaybackQueue();
  const { showToast = true, haptic = 'medium' } = options;

  /**
   * Start playing from a specific track index
   * Queues all tracks and starts from the selected one
   */
  const playFromHere = useCallback((startIndex: number) => {
    if (tracks.length === 0 || startIndex < 0 || startIndex >= tracks.length) {
      return;
    }

    if (haptic !== 'none') {
      hapticImpact(haptic);
    }

    playFromIndex(tracks, startIndex);

    if (showToast) {
      const remainingCount = tracks.length - startIndex;
      toast.success('Воспроизведение', {
        description: `${tracks[startIndex].title}${remainingCount > 1 ? ` и ещё ${remainingCount - 1}` : ''}`,
      });
    }
  }, [tracks, playFromIndex, showToast, haptic]);

  /**
   * Play all tracks from the beginning
   */
  const playAll = useCallback(() => {
    playFromHere(0);
  }, [playFromHere]);

  /**
   * Shuffle all tracks and play
   */
  const shufflePlay = useCallback(() => {
    if (tracks.length === 0) return;

    // Create shuffled copy
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    
    if (haptic !== 'none') {
      hapticImpact(haptic);
    }

    playFromIndex(shuffled, 0);

    if (showToast) {
      toast.success('Перемешанное воспроизведение', {
        description: `${tracks.length} треков`,
      });
    }
  }, [tracks, playFromIndex, showToast, haptic]);

  return {
    playFromHere,
    playAll,
    shufflePlay,
    totalTracks: tracks.length,
  };
}
