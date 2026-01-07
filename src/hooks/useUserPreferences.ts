/**
 * User Preferences Hook
 * Tracks and persists user preferences including genre preferences
 * Based on listening history and explicit choices
 */

import { useMemo, useCallback } from 'react';
import { useTelegramStorage } from './useTelegramStorage';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface UserPreferences {
  preferredGenres: string[];
  preferredMoods: string[];
  lastPlayedGenre?: string;
  favoriteArtistIds: string[];
}

const DEFAULT_PREFERENCES: UserPreferences = {
  preferredGenres: [],
  preferredMoods: [],
  favoriteArtistIds: [],
};

// Genre keywords for detection
const GENRE_KEYWORDS: Record<string, string[]> = {
  hiphop: ['hip-hop', 'hiphop', 'hip hop', 'rap', 'trap', 'drill'],
  pop: ['pop', 'dance pop', 'synth pop', 'electro pop'],
  rock: ['rock', 'alternative', 'indie', 'metal', 'punk', 'grunge'],
  electronic: ['electronic', 'edm', 'house', 'techno', 'dubstep', 'trance', 'dnb'],
};

/**
 * Detect genre from track style/prompt
 */
function detectGenre(style: string, prompt: string): string | null {
  const combined = `${style} ${prompt}`.toLowerCase();
  
  for (const [genre, keywords] of Object.entries(GENRE_KEYWORDS)) {
    if (keywords.some(kw => combined.includes(kw))) {
      return genre;
    }
  }
  return null;
}

export function useUserPreferences() {
  const { user } = useAuth();
  
  // Persistent storage for preferences
  const { 
    value: storedPrefs, 
    setValue: setStoredPrefs,
    isLoading: storageLoading,
  } = useTelegramStorage<UserPreferences>('user_preferences', DEFAULT_PREFERENCES);

  // Fetch listening history to infer preferences
  const { data: listeningData } = useQuery({
    queryKey: ['user-listening-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get recent plays to infer genre preferences
      const { data: recentPlays } = await supabase
        .from('tracks')
        .select('style, prompt')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Get liked tracks
      const { data: likedTracks } = await supabase
        .from('track_likes')
        .select('track:tracks(style, prompt)')
        .eq('user_id', user.id)
        .limit(30);

      return { recentPlays, likedTracks };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate inferred preferences from listening history
  const inferredPreferences = useMemo(() => {
    if (!listeningData) return { genres: [] as string[], moods: [] as string[] };

    const genreCounts: Record<string, number> = {};

    // Count genres from user's own tracks
    listeningData.recentPlays?.forEach(track => {
      const genre = detectGenre(track.style || '', track.prompt || '');
      if (genre) {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      }
    });

    // Count genres from liked tracks (weighted higher)
    listeningData.likedTracks?.forEach(item => {
      const track = item.track as { style?: string; prompt?: string } | null;
      if (track) {
        const genre = detectGenre(track.style || '', track.prompt || '');
        if (genre) {
          genreCounts[genre] = (genreCounts[genre] || 0) + 2;
        }
      }
    });

    // Sort by count
    const sortedGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre);

    return { genres: sortedGenres, moods: [] };
  }, [listeningData]);

  // Merge stored and inferred preferences
  const preferredGenres = useMemo(() => {
    // Explicit choices take priority
    if (storedPrefs.preferredGenres.length > 0) {
      return storedPrefs.preferredGenres;
    }
    // Fall back to inferred
    return inferredPreferences.genres;
  }, [storedPrefs.preferredGenres, inferredPreferences.genres]);

  // Update preferences
  const setPreferredGenres = useCallback((genres: string[]) => {
    setStoredPrefs({ ...storedPrefs, preferredGenres: genres });
  }, [storedPrefs, setStoredPrefs]);

  const addPreferredGenre = useCallback((genre: string) => {
    if (!storedPrefs.preferredGenres.includes(genre)) {
      setStoredPrefs({
        ...storedPrefs,
        preferredGenres: [genre, ...storedPrefs.preferredGenres],
      });
    }
  }, [storedPrefs, setStoredPrefs]);

  const trackGenreInteraction = useCallback((genre: string) => {
    // Move genre to top if interacted with
    const current = storedPrefs.preferredGenres.filter(g => g !== genre);
    setStoredPrefs({
      ...storedPrefs,
      preferredGenres: [genre, ...current],
      lastPlayedGenre: genre,
    });
  }, [storedPrefs, setStoredPrefs]);

  return {
    preferredGenres,
    preferredMoods: storedPrefs.preferredMoods,
    lastPlayedGenre: storedPrefs.lastPlayedGenre,
    favoriteArtistIds: storedPrefs.favoriteArtistIds,
    isLoading: storageLoading,
    // Actions
    setPreferredGenres,
    addPreferredGenre,
    trackGenreInteraction,
    // Raw data
    inferredPreferences,
  };
}
