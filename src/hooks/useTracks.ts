/**
 * useTracks - Main hook for track operations
 * Uses service layer architecture
 */

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as tracksService from '@/services/tracks.service';
import * as tracksApi from '@/api/tracks.api';

// Re-export Track type for convenience
export type { Track, TrackWithCreator, TrackSummary } from '@/types/track';
export type { EnrichedTrack } from '@/services/tracks.service';

const PAGE_SIZE = 30; // Increased for fewer requests

export interface UseTracksParams {
  projectId?: string;
  searchQuery?: string;
  sortBy?: 'recent' | 'popular' | 'liked';
  paginate?: boolean;
  pageSize?: number;
  statusFilter?: string[];
}

/**
 * Main tracks hook with optional pagination
 */
export function useTracks(params: UseTracksParams = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { paginate = false, projectId, searchQuery, sortBy, pageSize = PAGE_SIZE, statusFilter } = params;

  const queryKey = ['tracks', user?.id, projectId, searchQuery, sortBy, paginate, pageSize, statusFilter];

  // Infinite query for paginated mode
  const infiniteQuery = useInfiniteQuery({
    queryKey: [...queryKey, 'infinite'],
    queryFn: async ({ pageParam }) => {
      if (!user?.id) return { tracks: [], totalCount: 0, hasMore: false };
      return tracksService.fetchTracksWithLikes(
        user.id,
        { projectId, searchQuery, sortBy, statusFilter },
        { page: pageParam, pageSize }
      );
    },
    getNextPageParam: (lastPage, allPages) => {
      // Safely handle undefined or malformed data
      if (!lastPage || !allPages) {
        return undefined;
      }
      if (typeof lastPage.hasMore === 'undefined') {
        return undefined;
      }
      // Return next page number if there are more pages
      return lastPage.hasMore ? allPages.length : undefined;
    },
    enabled: !!user?.id && paginate === true,
    staleTime: 60 * 1000, // 1 minute - optimized caching
    gcTime: 15 * 60 * 1000, // 15 minutes - keep data longer
    initialPageParam: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always', // Always fetch on mount to ensure data loads
  });

  // Simple query for non-paginated mode
  const simpleQuery = useQuery({
    queryKey: [...queryKey, 'simple'],
    queryFn: async () => {
      if (!user?.id) return [];
      const result = await tracksService.fetchTracksWithLikes(
        user.id,
        { projectId, searchQuery, sortBy, statusFilter }
      );
      return result.tracks;
    },
    enabled: !!user?.id && paginate === false,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: 'always', // Always fetch on mount to ensure data loads
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`tracks_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tracks',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tracks', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: tracksService.deleteTrackWithCleanup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks', user?.id] });
      toast.success('Трек удален');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка удаления');
    },
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async ({ trackId, isLiked }: { trackId: string; isLiked: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');
      return tracksService.toggleLike(trackId, user.id, isLiked);
    },
    onSuccess: (_, { isLiked }) => {
      queryClient.invalidateQueries({ queryKey: ['tracks', user?.id] });
      toast.success(isLiked ? 'Удалено из избранного' : 'Добавлено в избранное');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка');
    },
  });

  // Play logging mutation
  const logPlayMutation = useMutation({
    mutationFn: tracksService.logTrackPlay,
  });

  // Flatten paginated results
  const tracks = paginate
    ? infiniteQuery.data?.pages.flatMap(page => page.tracks) || []
    : (simpleQuery.data as tracksService.EnrichedTrack[]) || [];

  const totalCount = paginate
    ? infiniteQuery.data?.pages[0]?.totalCount || 0
    : tracks.length;

  // Download function - opens audio in new tab
  const downloadTrack = useCallback((params: { trackId: string; audioUrl: string; coverUrl?: string }) => {
    if (params.audioUrl) {
      window.open(params.audioUrl, '_blank');
    }
  }, []);

  return {
    tracks,
    totalCount,
    isLoading: paginate ? infiniteQuery.isLoading : simpleQuery.isLoading,
    error: paginate ? infiniteQuery.error : simpleQuery.error,
    fetchNextPage: paginate ? infiniteQuery.fetchNextPage : () => Promise.resolve(),
    hasNextPage: paginate ? infiniteQuery.hasNextPage : false,
    isFetchingNextPage: paginate ? infiniteQuery.isFetchingNextPage : false,
    refetch: paginate ? infiniteQuery.refetch : simpleQuery.refetch,
    deleteTrack: useCallback((trackId: string) => deleteMutation.mutate(trackId), [deleteMutation]),
    toggleLike: useCallback((params: { trackId: string; isLiked: boolean }) => likeMutation.mutate(params), [likeMutation]),
    logPlay: useCallback((trackId: string) => logPlayMutation.mutate(trackId), [logPlayMutation]),
    downloadTrack,
    isDeleting: deleteMutation.isPending,
    isTogglingLike: likeMutation.isPending,
  };
}

/**
 * Hook for fetching a single track
 */
export function useTrack(trackId: string | undefined) {
  return useQuery({
    queryKey: ['track', trackId],
    queryFn: () => tracksApi.fetchTrackById(trackId!),
    enabled: !!trackId,
    staleTime: 30000,
  });
}

/**
 * Hook for public tracks (homepage/discovery)
 */
export function usePublicTracks(pageSize = 20) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['public-tracks', user?.id],
    queryFn: async ({ pageParam }) => {
      return tracksService.fetchPublicTracksWithCreators(
        user?.id ?? null,
        { page: pageParam, pageSize }
      );
    },
    getNextPageParam: (lastPage, allPages) => {
      // Safely handle undefined or malformed data
      if (!lastPage || !allPages) {
        return undefined;
      }
      if (typeof lastPage.hasMore === 'undefined') {
        return undefined;
      }
      return lastPage.hasMore ? allPages.length : undefined;
    },
    staleTime: 30000,
    initialPageParam: 0,
  });
}
