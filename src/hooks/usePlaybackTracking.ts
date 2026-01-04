/**
 * Hook for tracking playback analytics
 * Increments play count when a new track starts playing
 */

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { incrementPlayCount } from '@/api/tracks.api';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'PlaybackTracking' });

export function usePlaybackTracking() {
  const { activeTrack, isPlaying } = usePlayerStore();
  const lastTrackedId = useRef<string | null>(null);
  const playStartTime = useRef<number | null>(null);

  useEffect(() => {
    // Only track when actually playing
    if (!isPlaying || !activeTrack?.id) {
      playStartTime.current = null;
      return;
    }

    // Skip if already tracked this track
    if (lastTrackedId.current === activeTrack.id) {
      return;
    }

    // Record play start time
    playStartTime.current = Date.now();

    // Increment play count
    const doIncrementPlayCount = async () => {
      try {
        await incrementPlayCount(activeTrack.id);
        log.info('Play count incremented', { trackId: activeTrack.id });
        lastTrackedId.current = activeTrack.id;
      } catch (err) {
        log.error('Error incrementing play count', { error: err });
      }
    };

    // Small delay to avoid counting accidental clicks
    const timeout = setTimeout(doIncrementPlayCount, 1000);

    return () => clearTimeout(timeout);
  }, [activeTrack?.id, isPlaying]);

  // Reset tracking when track changes
  useEffect(() => {
    if (activeTrack?.id !== lastTrackedId.current) {
      // Allow re-tracking when track changes
      if (!activeTrack?.id) {
        lastTrackedId.current = null;
      }
    }
  }, [activeTrack?.id]);

  return {
    currentTrackId: activeTrack?.id,
    isTracking: isPlaying && !!activeTrack?.id,
  };
}
