/**
 * Player Analytics Hook
 * 
 * Tracks player interactions for analytics without modifying core player state.
 * Uses effect-based tracking to avoid circular dependencies.
 */

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { trackTrackPlayed, trackFeatureUsed } from '@/services/analytics';
import { trackConversionStage, hasReachedStage } from '@/lib/analytics/deeplink-tracker';
import { useAuth } from '@/hooks/useAuth';

const PLAY_DURATION_THRESHOLD = 10; // seconds before counting as "played"

export function usePlayerAnalytics() {
  const activeTrack = usePlayerStore((s) => s.activeTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const { user } = useAuth();
  
  const lastTrackedId = useRef<string | null>(null);
  const playStartTime = useRef<number | null>(null);
  const hasTrackedPlay = useRef(false);

  // Track when a new track starts playing
  useEffect(() => {
    if (!activeTrack || !isPlaying) {
      // Reset tracking when not playing
      if (!isPlaying && playStartTime.current) {
        playStartTime.current = null;
      }
      return;
    }

    // New track started
    if (activeTrack.id !== lastTrackedId.current) {
      lastTrackedId.current = activeTrack.id;
      playStartTime.current = Date.now();
      hasTrackedPlay.current = false;
      
      // Track immediate play event
      trackFeatureUsed('track_play_start', {
        track_id: activeTrack.id,
        track_title: activeTrack.title,
        has_user: !!user?.id,
      }).catch(() => {});
    }
  }, [activeTrack?.id, isPlaying, user?.id]);

  // Track meaningful play after threshold
  useEffect(() => {
    if (!activeTrack || !isPlaying || hasTrackedPlay.current) return;

    const timer = setTimeout(() => {
      if (isPlaying && activeTrack && !hasTrackedPlay.current) {
        hasTrackedPlay.current = true;
        
        // Track as actual play
        trackTrackPlayed(activeTrack.id, {
          track_title: activeTrack.title,
          duration_threshold: PLAY_DURATION_THRESHOLD,
        }, user?.id).catch(() => {});

        // Track first action conversion if user's first meaningful play
        if (!hasReachedStage('first_action')) {
          trackConversionStage('first_action', {
            action_type: 'play',
            track_id: activeTrack.id,
          }).catch(() => {});
        }

        // Track engagement if not yet engaged
        if (!hasReachedStage('engaged')) {
          trackConversionStage('engaged', {
            trigger: 'track_play',
            track_id: activeTrack.id,
          }).catch(() => {});
        }
      }
    }, PLAY_DURATION_THRESHOLD * 1000);

    return () => clearTimeout(timer);
  }, [activeTrack?.id, isPlaying, user?.id]);

  return null; // This hook is for side effects only
}

/**
 * Hook to track share events
 */
export function useShareAnalytics() {
  const trackShare = async (
    trackId: string, 
    method: 'telegram' | 'story' | 'copy' | 'native',
    metadata?: Record<string, unknown>
  ) => {
    await trackFeatureUsed('track_share', {
      track_id: trackId,
      share_method: method,
      ...metadata,
    });

    // Track engagement if not yet engaged
    if (!hasReachedStage('engaged')) {
      await trackConversionStage('engaged', {
        trigger: 'share',
        track_id: trackId,
      });
    }
  };

  return { trackShare };
}
