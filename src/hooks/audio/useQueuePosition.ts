/**
 * Queue Position Hook
 * 
 * Returns the position of a track in the current playback queue.
 * Optimized to minimize re-renders by using selectors.
 */

import { useMemo } from 'react';
import { usePlayerStore } from './usePlayerState';

interface QueuePositionResult {
  /** Whether the track is in the queue */
  isInQueue: boolean;
  /** Position in queue (1-indexed for display) */
  position: number | null;
  /** Whether this track is currently playing */
  isCurrentTrack: boolean;
  /** Whether this track is next to play */
  isNextTrack: boolean;
}

/**
 * Get the position of a track in the playback queue
 * 
 * @param trackId - The ID of the track to check
 * @returns Queue position information
 */
export function useQueuePosition(trackId: string): QueuePositionResult {
  const queue = usePlayerStore(s => s.queue);
  const currentIndex = usePlayerStore(s => s.currentIndex);

  return useMemo(() => {
    const index = queue.findIndex(t => t.id === trackId);
    
    if (index === -1) {
      return {
        isInQueue: false,
        position: null,
        isCurrentTrack: false,
        isNextTrack: false,
      };
    }

    return {
      isInQueue: true,
      position: index + 1, // 1-indexed for display
      isCurrentTrack: index === currentIndex,
      isNextTrack: index === currentIndex + 1,
    };
  }, [queue, currentIndex, trackId]);
}

/**
 * Get multiple tracks' queue positions efficiently
 * 
 * @param trackIds - Array of track IDs to check
 * @returns Map of trackId to position (1-indexed, null if not in queue)
 */
export function useQueuePositions(trackIds: string[]): Map<string, number | null> {
  const queue = usePlayerStore(s => s.queue);

  return useMemo(() => {
    const positions = new Map<string, number | null>();
    
    // Create lookup map for O(1) access
    const queueMap = new Map(queue.map((t, i) => [t.id, i + 1]));
    
    trackIds.forEach(id => {
      positions.set(id, queueMap.get(id) ?? null);
    });
    
    return positions;
  }, [queue, trackIds]);
}
