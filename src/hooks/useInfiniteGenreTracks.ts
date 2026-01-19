/**
 * useInfiniteGenreTracks - Infinite scroll hook for genre-specific tracks
 * 
 * Provides cursor-based pagination for loading more tracks by genre.
 * Used in GenreTabsSection for seamless browsing within genre tabs.
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PublicTrackWithCreator } from "./usePublicContent";

// Genre to computed_genre DB values mapping
const GENRE_DB_VALUES: Record<string, string[]> = {
  hiphop: ['hiphop', 'hip-hop', 'rap', 'trap', 'drill'],
  pop: ['pop', 'dance', 'electropop', 'synth-pop'],
  rock: ['rock', 'alternative', 'metal', 'indie', 'punk', 'grunge'],
  electronic: ['electronic', 'house', 'techno', 'edm', 'ambient', 'dnb', 'dubstep'],
  folk: ['folk', 'acoustic', 'country', 'americana', 'bluegrass'],
};

interface UseInfiniteGenreTracksParams {
  /** Genre ID (hiphop, pop, rock, electronic, folk) */
  genre: string;
  /** Number of tracks per page */
  pageSize?: number;
  /** Enable/disable the query */
  enabled?: boolean;
  /** Initial tracks from batch query to avoid refetch */
  initialData?: PublicTrackWithCreator[];
}

interface GenreTracksPage {
  tracks: PublicTrackWithCreator[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Infinite scroll hook for genre-specific tracks with cursor-based pagination
 */
export function useInfiniteGenreTracks({
  genre,
  pageSize = 20,
  enabled = true,
  initialData,
}: UseInfiniteGenreTracksParams) {
  const dbValues = GENRE_DB_VALUES[genre] || [genre];
  
  return useInfiniteQuery<GenreTracksPage>({
    queryKey: ['infinite-genre-tracks', genre, pageSize],
    queryFn: async ({ pageParam }): Promise<GenreTracksPage> => {
      const cursor = pageParam as string | null;
      
      // Build base query - sorted by popularity within genre
      let query = supabase
        .from("tracks")
        .select("id,title,cover_url,audio_url,play_count,user_id,created_at,style,tags,computed_genre,prompt")
        .eq("is_public", true)
        .eq("status", "completed")
        .not("audio_url", "is", null)
        .in("computed_genre", dbValues);
      
      // Apply cursor for pagination (composite: play_count|created_at)
      if (cursor) {
        const [playCount, createdAt] = cursor.split('|');
        query = query.or(`play_count.lt.${playCount},and(play_count.eq.${playCount},created_at.lt.${createdAt})`);
      }
      
      // Sort by popularity, then by date
      query = query
        .order("play_count", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      
      // Fetch one extra to check if there are more
      query = query.limit(pageSize + 1);
      
      const { data: tracks, error } = await query;
      
      if (error) throw error;
      
      const hasMore = (tracks?.length || 0) > pageSize;
      const resultTracks = hasMore ? tracks!.slice(0, pageSize) : (tracks || []);
      
      // Calculate next cursor from last item
      let nextCursor: string | null = null;
      if (hasMore && resultTracks.length > 0) {
        const lastTrack = resultTracks[resultTracks.length - 1];
        nextCursor = `${lastTrack.play_count || 0}|${lastTrack.created_at}`;
      }
      
      // Enrich tracks with creator info
      const enrichedTracks = await enrichTracksWithCreators(resultTracks);
      
      return {
        tracks: enrichedTracks,
        nextCursor,
        hasMore,
      };
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: enabled && !!genre,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    // Use initial data from batch query as first page
    ...(initialData && initialData.length > 0 ? {
      initialData: {
        pages: [{
          tracks: initialData,
          nextCursor: initialData.length >= pageSize 
            ? `${initialData[initialData.length - 1]?.play_count || 0}|${initialData[initialData.length - 1]?.created_at}`
            : null,
          hasMore: initialData.length >= pageSize,
        }],
        pageParams: [null],
      },
    } : {}),
  });
}

/**
 * Helper to enrich tracks with creator profile info
 */
async function enrichTracksWithCreators(
  tracks: any[]
): Promise<PublicTrackWithCreator[]> {
  if (!tracks.length) return [];
  
  const userIds = [...new Set(tracks.map(t => t.user_id))];
  
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, photo_url, first_name")
    .in("user_id", userIds);
  
  const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
  
  return tracks.map(track => {
    const profile = profileMap.get(track.user_id);
    return {
      ...track,
      creator_name: profile?.first_name || profile?.username || undefined,
      creator_username: profile?.username || undefined,
      creator_photo_url: profile?.photo_url || undefined,
      like_count: 0,
      user_liked: false,
    } as PublicTrackWithCreator;
  });
}

/**
 * Get flattened list of all loaded genre tracks
 */
export function flattenGenreTracksPages(
  pages: GenreTracksPage[] | undefined
): PublicTrackWithCreator[] {
  if (!pages) return [];
  return pages.flatMap(page => page.tracks);
}
