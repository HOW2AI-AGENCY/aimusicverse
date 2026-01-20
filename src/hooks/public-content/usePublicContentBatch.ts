/**
 * Public Content Batch Hook
 *
 * Single optimized hook that fetches all public content in parallel queries.
 * Used by homepage sections to avoid multiple database calls.
 *
 * @module hooks/public-content/usePublicContentBatch
 */

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../useAuth";
import type { PublicContentData, PublicTrackWithCreator } from './types';
import { GENRE_QUERIES, PUBLIC_CONTENT_STALE_TIME, PUBLIC_CONTENT_GC_TIME, BATCH_FETCH_LIMIT, GENRE_FETCH_LIMIT } from './constants';

/**
 * Fetches all public content in optimized parallel queries
 *
 * Features:
 * - Server-side genre filtering for performance
 * - Parallel fetching of main + genre-specific tracks
 * - Profile enrichment for creator info
 * - Optimized for homepage rendering
 *
 * @returns Query result with aggregated public content data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = usePublicContentBatch();
 *
 * if (isLoading) return <Skeleton />;
 *
 * return (
 *   <>
 *     <FeaturedSection tracks={data.featuredTracks} />
 *     <RecentSection tracks={data.recentTracks} />
 *     <GenreSection tracks={data.tracksByGenre} />
 *   </>
 * );
 * ```
 */
export function usePublicContentBatch() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['public-content-optimized', user?.id],
    queryFn: async (): Promise<PublicContentData> => {
      // PARALLEL FETCH: Main tracks + Genre-specific tracks
      const [mainResult, ...genreResults] = await Promise.all([
        // 1. Main tracks for featured/recent/popular
        supabase
          .from("tracks")
          .select("id,title,cover_url,audio_url,play_count,user_id,created_at,style,tags,computed_genre,prompt")
          .eq("is_public", true)
          .eq("status", "completed")
          .not("audio_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(BATCH_FETCH_LIMIT),

        // 2. Genre-specific queries (sorted by popularity)
        ...GENRE_QUERIES.map(genre =>
          supabase
            .from("tracks")
            .select("id,title,cover_url,audio_url,play_count,user_id,created_at,style,tags,computed_genre,prompt")
            .eq("is_public", true)
            .eq("status", "completed")
            .not("audio_url", "is", null)
            .in("computed_genre", genre.dbValues)
            .order("play_count", { ascending: false, nullsFirst: false })
            .limit(GENRE_FETCH_LIMIT)
        ),
      ]);

      if (mainResult.error) throw mainResult.error;

      const tracks = mainResult.data || [];

      // Build genre tracks map from server-filtered results
      const tracksByGenre: Record<string, PublicTrackWithCreator[]> = {};
      GENRE_QUERIES.forEach((genre, idx) => {
        const genreData = genreResults[idx]?.data || [];
        tracksByGenre[genre.id] = genreData as PublicTrackWithCreator[];
      });

      // Early return if no tracks found
      if (tracks.length === 0 && Object.values(tracksByGenre).every(arr => arr.length === 0)) {
        return {
          featuredTracks: [],
          recentTracks: [],
          popularTracks: [],
          allTracks: [],
          tracksByGenre: {},
        };
      }

      // Collect all unique user IDs from all tracks
      const allTrackArrays = [tracks, ...Object.values(tracksByGenre)];
      const userIds = [...new Set(allTrackArrays.flat().map(t => t.user_id))];

      // Fetch profiles for all creators
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, photo_url, first_name")
        .in("user_id", userIds);

      // Create lookup map
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Helper to enrich tracks with creator info
      const enrichTrack = (track: typeof tracks[0]): PublicTrackWithCreator => {
        const profile = profileMap.get(track.user_id);
        return {
          ...track,
          creator_name: profile?.first_name || profile?.username || undefined,
          creator_username: profile?.username || undefined,
          creator_photo_url: profile?.photo_url || undefined,
          like_count: 0,
          user_liked: false,
        } as PublicTrackWithCreator;
      };

      // Enrich main tracks
      const enrichedTracks = tracks.map(enrichTrack);

      // Enrich genre tracks
      const enrichedByGenre: Record<string, PublicTrackWithCreator[]> = {};
      for (const [genreId, genreTracks] of Object.entries(tracksByGenre)) {
        enrichedByGenre[genreId] = genreTracks.map(enrichTrack);
      }

      // Sort main tracks for different views
      const sortedByPopular = [...enrichedTracks].sort((a, b) =>
        (b.play_count || 0) - (a.play_count || 0)
      );

      return {
        featuredTracks: sortedByPopular.slice(0, 6),
        recentTracks: enrichedTracks.slice(0, 12),
        popularTracks: sortedByPopular.slice(0, 12),
        allTracks: enrichedTracks,
        tracksByGenre: enrichedByGenre,
      };
    },
    staleTime: PUBLIC_CONTENT_STALE_TIME,
    gcTime: PUBLIC_CONTENT_GC_TIME,
    placeholderData: keepPreviousData,
    refetchOnMount: false,
  });
}
