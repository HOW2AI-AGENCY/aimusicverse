/**
 * useInfinitePublicTracks - Infinite scroll hook for public tracks
 * 
 * Provides cursor-based pagination for loading more tracks on scroll.
 * Used in homepage and community pages for seamless browsing.
 * 
 * TODO: Add prefetching for next page
 * TODO: Consider virtual scrolling for large lists
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PublicTrackWithCreator } from "./usePublicContent";

interface UseInfinitePublicTracksParams {
  /** Sort order: recent, popular, or by genre */
  sortBy?: 'recent' | 'popular';
  /** Filter by computed_genre values */
  genre?: string[];
  /** Number of tracks per page */
  pageSize?: number;
  /** Enable/disable the query */
  enabled?: boolean;
}

interface TracksPage {
  tracks: PublicTrackWithCreator[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Infinite scroll hook for public tracks with cursor-based pagination
 */
export function useInfinitePublicTracks({
  sortBy = 'recent',
  genre,
  pageSize = 20,
  enabled = true,
}: UseInfinitePublicTracksParams = {}) {
  return useInfiniteQuery<TracksPage>({
    queryKey: ['infinite-public-tracks', sortBy, genre, pageSize],
    queryFn: async ({ pageParam }): Promise<TracksPage> => {
      const cursor = pageParam as string | null;
      
      // Build base query
      let query = supabase
        .from("tracks")
        .select("id,title,cover_url,audio_url,play_count,user_id,created_at,style,tags,computed_genre,prompt")
        .eq("is_public", true)
        .eq("status", "completed")
        .not("audio_url", "is", null);
      
      // Apply genre filter if provided
      if (genre && genre.length > 0) {
        query = query.in("computed_genre", genre);
      }
      
      // Apply cursor for pagination
      if (cursor) {
        if (sortBy === 'recent') {
          query = query.lt("created_at", cursor);
        } else {
          // For popular, we use a composite cursor: play_count|created_at|id
          const [playCount, createdAt] = cursor.split('|');
          query = query.or(`play_count.lt.${playCount},and(play_count.eq.${playCount},created_at.lt.${createdAt})`);
        }
      }
      
      // Apply sorting
      if (sortBy === 'recent') {
        query = query.order("created_at", { ascending: false });
      } else {
        query = query
          .order("play_count", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });
      }
      
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
        if (sortBy === 'recent') {
          nextCursor = lastTrack.created_at;
        } else {
          nextCursor = `${lastTrack.play_count || 0}|${lastTrack.created_at}`;
        }
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
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
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
 * Get flattened list of all loaded tracks
 */
export function flattenInfiniteTracksPages(
  pages: TracksPage[] | undefined
): PublicTrackWithCreator[] {
  if (!pages) return [];
  return pages.flatMap(page => page.tracks);
}
