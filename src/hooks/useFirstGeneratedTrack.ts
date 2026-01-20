/**
 * Hook to track first generated track for new user onboarding
 * Used for personalized recommendations and continue creating CTAs
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTracks } from '@/hooks/useTracks';
import type { Track } from '@/integrations/supabase/types/track';
import { logger } from '@/lib/logger';

const FIRST_TRACK_KEY = 'musicverse_first_track_id';
const FIRST_SESSION_KEY = 'musicverse_first_session';

interface FirstGeneratedTrackState {
  firstTrack: Track | null;
  isFirstSession: boolean;
  hasGeneratedBefore: boolean;
  isLoading: boolean;
}

/**
 * Get user's first generated track
 * Tracks whether this is their first session for onboarding
 */
export function useFirstGeneratedTrack(): FirstGeneratedTrackState {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<FirstGeneratedTrackState, 'isLoading'>>({
    firstTrack: null,
    isFirstSession: false,
    hasGeneratedBefore: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Get user's tracks
  const { data: tracks, isLoading: tracksLoading } = useTracks({
    userId: user?.id,
    limit: 1, // Only need first track
    sortBy: 'created_at',
    sortOrder: 'asc',
  });

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Check if this is first session
    const firstSession = localStorage.getItem(FIRST_SESSION_KEY);
    const isFirstSession = firstSession === null;

    if (isFirstSession) {
      localStorage.setItem(FIRST_SESSION_KEY, Date.now().toString());
    }

    // Get first track from localStorage or API
    const firstTrackId = localStorage.getItem(FIRST_TRACK_KEY);

    if (firstTrackId && tracks && tracks.length > 0) {
      // Verify the track still exists
      const firstTrack = tracks.find(t => t.id === firstTrackId);

      if (firstTrack) {
        setState({
          firstTrack,
          isFirstSession,
          hasGeneratedBefore: true,
        });
      } else {
        // Track not found, clear localStorage
        localStorage.removeItem(FIRST_TRACK_KEY);

        // Use first track from API
        if (tracks.length > 0) {
          localStorage.setItem(FIRST_TRACK_KEY, tracks[0].id);
          setState({
            firstTrack: tracks[0],
            isFirstSession,
            hasGeneratedBefore: true,
          });
        } else {
          setState({
            firstTrack: null,
            isFirstSession,
            hasGeneratedBefore: false,
          });
        }
      }
    } else if (tracks && tracks.length > 0) {
      // No first track in localStorage but user has tracks
      const firstTrack = tracks[0];
      localStorage.setItem(FIRST_TRACK_KEY, firstTrack.id);

      setState({
        firstTrack,
        isFirstSession,
        hasGeneratedBefore: true,
      });

      logger.info('First track detected', {
        trackId: firstTrack.id,
        isFirstSession,
      });
    } else {
      // No tracks yet
      setState({
        firstTrack: null,
        isFirstSession,
        hasGeneratedBefore: false,
      });
    }

    setIsLoading(false);
  }, [user, tracks]);

  return {
    ...state,
    isLoading: isLoading || tracksLoading,
  };
}

/**
 * Save first generated track
 * Call this after successful generation
 */
export function saveFirstGeneratedTrack(trackId: string): void {
  const existingFirstTrack = localStorage.getItem(FIRST_TRACK_KEY);

  if (!existingFirstTrack) {
    localStorage.setItem(FIRST_TRACK_KEY, trackId);
    logger.info('First track saved', { trackId });
  }
}

/**
 * Clear first track data (for testing or account reset)
 */
export function clearFirstGeneratedTrack(): void {
  localStorage.removeItem(FIRST_TRACK_KEY);
  localStorage.removeItem(FIRST_SESSION_KEY);
  logger.info('First track data cleared');
}
