/**
 * useTrackData Hook
 *
 * Per contracts/useTrackData.contract.ts:
 * - Data fetching with TanStack Query
 * - Caching and invalidation
 * - Pagination support
 * - Error handling
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { UseTrackDataParams, UseTrackDataReturn } from '@/hooks/types/track';
import type { Track, PublicTrackWithCreator } from '@/types/track';

/**
 * Fetch tracks from database
 */
async function fetchTracks(params: UseTrackDataParams): Promise<(Track | PublicTrackWithCreator)[]> {
  try {
    let query = supabase
      .from('tracks')
      .select(
        `
        *,
        track_versions(*),
        profiles:tracks_profile_id_fkey(*)
      `
      );

    // Filter by user
    if (params.userId) {
      query = query.eq('user_id', params.userId);
    }

    // Filter public tracks
    if (params.isPublic) {
      query = query.eq('is_public', true);
    }

    // Search query
    if (params.searchQuery) {
      query = query.ilike('title', `%${params.searchQuery}%`);
    }

    // Genre filter
    if (params.genres && params.genres.length > 0) {
      query = query.in('genre', params.genres);
    }

    // Mood filter
    if (params.moods && params.moods.length > 0) {
      query = query.in('mood', params.moods);
    }

    // Ordering
    query = query.order('created_at', { ascending: false });

    // Pagination
    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch tracks', { error: error.message, params });
      throw error;
    }

    return data as (Track | PublicTrackWithCreator)[];
  } catch (error) {
    logger.error('Error in fetchTracks', { error, params });
    throw error;
  }
}

/**
 * Hook for fetching track data with TanStack Query
 *
 * @example
 * ```tsx
 * const { tracks, isLoading, error, fetchNextPage } = useTrackData({
 *   userId: user?.id,
 *   limit: 20,
 * });
 * ```
 */
export function useTrackData(params: UseTrackDataParams = {}): UseTrackDataReturn {
  // Build query key
  const queryKey = ['tracks', params] as const;

  // Check if we should use infinite query (for pagination)
  const useInfinite = params.offset === undefined && params.limit !== undefined;

  // Infinite query for scroll-based pagination
  if (useInfinite) {
    const infiniteQuery = useInfiniteQuery({
      queryKey,
      queryFn: ({ pageParam = 0 }) =>
        fetchTracks({ ...params, offset: pageParam }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.length < (params.limit || 20)) {
          return undefined; // No more pages
        }
        return allPages.length * (params.limit || 20);
      },
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 10 * 60 * 1000, // 10 minutes
    });

    const tracks = infiniteQuery.data?.pages.flat() || [];

    return {
      tracks,
      isLoading: infiniteQuery.isLoading,
      isFetching: infiniteQuery.isFetching,
      error: infiniteQuery.error as Error | null,
      refetch: infiniteQuery.refetch,
      hasNextPage: infiniteQuery.hasNextPage || false,
      fetchNextPage: infiniteQuery.fetchNextPage,
      isFetchingNextPage: infiniteQuery.isFetchingNextPage,
      totalCount: undefined, // Can be added with count query
    };
  }

  // Regular query for simple fetches
  const query = useQuery({
    queryKey,
    queryFn: () => fetchTracks(params),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    tracks: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    refetch: query.refetch,
    hasNextPage: false,
    fetchNextPage: async () => {}, // No-op for non-infinite queries
    isFetchingNextPage: false,
    totalCount: undefined,
  };
}
