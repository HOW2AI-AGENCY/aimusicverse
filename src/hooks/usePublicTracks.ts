/**
 * Hook for fetching public tracks for Homepage Discovery
 * Sprint 010 - Phase 2: Foundational hooks
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Track } from '@/hooks/useTracksOptimized';

export type PublicTrackFilter = 'featured' | 'new' | 'popular' | 'trending';
export type SortOption = 'created_at' | 'likes_count' | 'plays_count';

interface UsePublicTracksOptions {
  filter?: PublicTrackFilter;
  style?: string;
  search?: string;
  sortBy?: SortOption;
  limit?: number;
}

interface PublicTrack extends Track {
  likes_count: number;
  plays_count: number;
  is_featured: boolean;
  user_liked?: boolean; // Whether current user has liked this track
}

/**
 * Fetches public tracks with filtering, sorting, and pagination
 */
export function usePublicTracks(options: UsePublicTracksOptions = {}) {
  const {
    filter = 'new',
    style,
    search,
    sortBy = 'created_at',
    limit = 20,
  } = options;

  return useInfiniteQuery({
    queryKey: ['public-tracks', filter, style, search, sortBy],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('tracks')
        .select('*, track_likes!left(user_id)')
        .eq('is_public', true)
        .range(pageParam, pageParam + limit - 1);

      // Apply filter
      if (filter === 'featured') {
        query = query.eq('is_featured', true);
      } else if (filter === 'trending') {
        // Trending: high engagement in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = query
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('likes_count', { ascending: false });
      }

      // Apply style filter
      if (style) {
        query = query.ilike('style', `%${style}%`);
      }

      // Apply search
      if (search) {
        query = query.or(
          `title.ilike.%${search}%,style.ilike.%${search}%,tags.cs.{${search}}`
        );
      }

      // Apply sorting
      switch (sortBy) {
        case 'likes_count':
          query = query.order('likes_count', { ascending: false });
          break;
        case 'plays_count':
          query = query.order('plays_count', { ascending: false });
          break;
        case 'created_at':
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Check which tracks current user has liked
      const { data: { user } } = await supabase.auth.getUser();
      const tracksWithLikes: PublicTrack[] = (data || []).map((track) => ({
        ...track,
        user_liked: track.track_likes?.some(
          (like: { user_id: string }) => like.user_id === user?.id
        ),
      }));

      return {
        tracks: tracksWithLikes,
        nextPage: pageParam + limit,
        hasMore: (data?.length || 0) === limit,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    initialPageParam: 0,
  });
}

/**
 * Hook to toggle like on a public track
 */
export function useToggleTrackLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ trackId, isLiked }: { trackId: string; isLiked: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (isLiked) {
        // Unlike: delete the like
        const { error } = await supabase
          .from('track_likes')
          .delete()
          .eq('track_id', trackId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        // Like: insert a new like
        const { error } = await supabase
          .from('track_likes')
          .insert({ track_id: trackId, user_id: user.id });
        if (error) throw error;
      }

      return { trackId, isLiked: !isLiked };
    },
    onSuccess: (data) => {
      // Invalidate public tracks queries to refresh likes count
      queryClient.invalidateQueries({ queryKey: ['public-tracks'] });
    },
  });
}

/**
 * Hook to increment play count for a track
 */
export function useIncrementPlayCount() {
  return useMutation({
    mutationFn: async (trackId: string) => {
      const { error } = await supabase.rpc('increment_play_count', {
        track_id: trackId,
      });
      if (error) throw error;
      return trackId;
    },
  });
}

/**
 * Hook to get featured tracks (shorthand)
 */
export function useFeaturedTracks(limit = 10) {
  return usePublicTracks({ filter: 'featured', limit });
}

/**
 * Hook to get new/recent tracks (shorthand)
 */
export function useNewTracks(limit = 20) {
  return usePublicTracks({ filter: 'new', limit });
}

/**
 * Hook to get popular tracks (shorthand)
 */
export function usePopularTracks(limit = 20) {
  return usePublicTracks({ filter: 'popular', sortBy: 'likes_count', limit });
}

/**
 * Hook to get trending tracks (shorthand)
 */
export function useTrendingTracks(limit = 20) {
  return usePublicTracks({ filter: 'trending', limit });
}
