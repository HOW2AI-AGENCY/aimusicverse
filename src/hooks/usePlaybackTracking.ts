/**
 * Hook for tracking playback analytics
 * Increments play count when a new track starts playing
 */

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { supabase } from '@/integrations/supabase/client';
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
    const incrementPlayCount = async () => {
      try {
        const { error } = await supabase.rpc('increment_track_play_count', {
          track_id_param: activeTrack.id,
        });

        if (error) {
          log.error('Failed to increment play count', { error, trackId: activeTrack.id });
        } else {
          log.info('Play count incremented', { trackId: activeTrack.id });
          lastTrackedId.current = activeTrack.id;
        }
      } catch (err) {
        log.error('Error incrementing play count', { error: err });
      }
    };

    // Small delay to avoid counting accidental clicks
    const timeout = setTimeout(incrementPlayCount, 1000);

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
