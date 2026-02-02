/**
 * Player Analytics Hook
 * 
 * Tracks player interactions for analytics without modifying core player state.
 * Uses effect-based tracking to avoid circular dependencies.
 * 
 * P2 Enhancement: Added milestone tracking (25/50/75/100%) and skip events
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useAudioTime } from '@/hooks/audio/useAudioTime';
import { trackTrackPlayed, trackFeatureUsed, trackEvent } from '@/services/analytics';
import { trackConversionStage, hasReachedStage } from '@/lib/analytics/deeplink-tracker';
import { useAuth } from '@/hooks/useAuth';

const PLAY_DURATION_THRESHOLD = 10; // seconds before counting as "played"
const SKIP_THRESHOLD = 10; // seconds - if user leaves before this, it's a skip

// Milestones to track (percentage of track listened)
const PLAY_MILESTONES = [25, 50, 75, 100] as const;
type PlayMilestone = typeof PLAY_MILESTONES[number];

export function usePlayerAnalytics() {
  const activeTrack = usePlayerStore((s) => s.activeTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  
  // Get currentTime and duration from useAudioTime hook
  const { currentTime, duration } = useAudioTime();
  const { user } = useAuth();
  
  const lastTrackedId = useRef<string | null>(null);
  const playStartTime = useRef<number | null>(null);
  const hasTrackedPlay = useRef(false);
  const trackedMilestones = useRef<Set<PlayMilestone>>(new Set());
  const playStartPosition = useRef<number>(0);
  const totalListenTime = useRef<number>(0);
  const lastTimeUpdate = useRef<number>(0);

  // Reset tracking for new track
  const resetTrackingState = useCallback(() => {
    hasTrackedPlay.current = false;
    trackedMilestones.current.clear();
    playStartPosition.current = 0;
    totalListenTime.current = 0;
    lastTimeUpdate.current = 0;
  }, []);

  // Track skip event when user leaves track early
  const trackSkipEvent = useCallback((trackId: string, trackTitle: string, listenedSeconds: number) => {
    if (listenedSeconds < SKIP_THRESHOLD && listenedSeconds > 0) {
      trackFeatureUsed('track_skip', {
        track_id: trackId,
        track_title: trackTitle,
        listened_seconds: Math.round(listenedSeconds),
        has_user: !!user?.id,
      }).catch(() => {});
    }
  }, [user?.id]);

  // Track when a new track starts playing
  useEffect(() => {
    if (!activeTrack || !isPlaying) {
      // Track skip if user stopped playing early
      if (!isPlaying && lastTrackedId.current && totalListenTime.current > 0) {
        const prevTrackId = lastTrackedId.current;
        trackSkipEvent(prevTrackId, activeTrack?.title || 'Unknown', totalListenTime.current);
      }
      
      // Reset tracking when not playing
      if (!isPlaying && playStartTime.current) {
        playStartTime.current = null;
      }
      return;
    }

    // New track started
    if (activeTrack.id !== lastTrackedId.current) {
      // Track skip for previous track if applicable
      if (lastTrackedId.current && totalListenTime.current > 0 && totalListenTime.current < SKIP_THRESHOLD) {
        trackSkipEvent(lastTrackedId.current, 'Previous Track', totalListenTime.current);
      }
      
      lastTrackedId.current = activeTrack.id;
      playStartTime.current = Date.now();
      playStartPosition.current = currentTime || 0;
      resetTrackingState();
      
      // Track immediate play event
      trackFeatureUsed('track_play_start', {
        track_id: activeTrack.id,
        track_title: activeTrack.title,
        start_position: Math.round(playStartPosition.current),
        has_user: !!user?.id,
      }).catch(() => {});
    }
  }, [activeTrack?.id, isPlaying, user?.id, currentTime, trackSkipEvent, resetTrackingState]);

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

  // P2 Enhancement: Track listening progress milestones (25%, 50%, 75%, 100%)
  useEffect(() => {
    if (!activeTrack || !isPlaying || !duration || duration <= 0) return;

    // Update total listen time
    if (lastTimeUpdate.current > 0 && currentTime > lastTimeUpdate.current) {
      totalListenTime.current += currentTime - lastTimeUpdate.current;
    }
    lastTimeUpdate.current = currentTime;

    // Calculate current percentage
    const currentPercent = (currentTime / duration) * 100;

    // Check each milestone
    for (const milestone of PLAY_MILESTONES) {
      if (currentPercent >= milestone && !trackedMilestones.current.has(milestone)) {
        trackedMilestones.current.add(milestone);
        
        // Track milestone event
        trackEvent({
          eventType: 'feature_used',
          eventName: `track_listen_${milestone}`,
          metadata: {
            track_id: activeTrack.id,
            track_title: activeTrack.title,
            milestone_percent: milestone,
            actual_percent: Math.round(currentPercent),
            listen_time_seconds: Math.round(totalListenTime.current),
            duration_seconds: Math.round(duration),
          },
        }, user?.id).catch(() => {});

        // Special handling for 100% completion
        if (milestone === 100) {
          trackFeatureUsed('track_completed', {
            track_id: activeTrack.id,
            track_title: activeTrack.title,
            total_listen_time: Math.round(totalListenTime.current),
            track_duration: Math.round(duration),
          }).catch(() => {});
        }
      }
    }
  }, [activeTrack?.id, currentTime, duration, isPlaying, user?.id]);

  // Track repeat play (when user plays same track again)
  useEffect(() => {
    if (!activeTrack || !isPlaying) return;
    
    // If we're back to the start of a track we already completed
    if (
      trackedMilestones.current.has(100) && 
      currentTime < 5 && 
      playStartPosition.current > 5
    ) {
      trackFeatureUsed('track_repeat', {
        track_id: activeTrack.id,
        track_title: activeTrack.title,
      }).catch(() => {});
      
      // Reset milestones for new playthrough
      trackedMilestones.current.clear();
      totalListenTime.current = 0;
    }
  }, [activeTrack?.id, currentTime, isPlaying]);

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
