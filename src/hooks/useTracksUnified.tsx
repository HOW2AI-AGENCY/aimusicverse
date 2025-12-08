/**
 * Unified Tracks Hook
 * 
 * Consolidates useTracks and useTracksInfinite into a single hook
 * with optional pagination support.
 * 
 * Usage:
 * ```tsx
 * // Simple usage (no pagination)
 * const { tracks, isLoading } = useTracksUnified();
 * 
 * // With pagination
 * const { tracks, fetchNextPage, hasNextPage } = useTracksUnified({ paginate: true });
 * 
 * // With filters
 * const { tracks } = useTracksUnified({ 
 *   searchQuery: 'rock', 
 *   sortBy: 'popular',
 *   projectId: '...'
 * });
 * ```
 */

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useCallback, useEffect } from 'react';
import { logger } from '@/lib/logger';
import type { Track } from './useTracksOptimized';

export type { Track } from './useTracksOptimized';

const PAGE_SIZE = 20;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

const retryWithBackoff = async <T,>(
  fn: () => Promise<T>,
  attempts = RETRY_ATTEMPTS
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (attempts <= 1) throw error;
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (RETRY_ATTEMPTS - attempts + 1)));
    return retryWithBackoff(fn, attempts - 1);
  }
};

export interface UseTracksUnifiedParams {
  projectId?: string;
  searchQuery?: string;
  sortBy?: 'recent' | 'popular' | 'liked';
  paginate?: boolean;
  pageSize?: number;
  statusFilter?: string[];
}

interface TracksPage {
  tracks: Track[];
  nextPage: number | null;
  totalCount: number;
}

async function fetchTracksPage(
  userId: string,
  params: UseTracksUnifiedParams,
  pageParam: number = 0
): Promise<TracksPage> {
  const { projectId, searchQuery, sortBy = 'recent', pageSize = PAGE_SIZE, statusFilter } = params;
  
  const from = pageParam * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('tracks')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  // Status filter - default to completed/streaming_ready
  const statuses = statusFilter || ['completed', 'streaming_ready'];
  query = query.in('status', statuses);

  // Optional range for pagination
  if (params.paginate) {
    query = query.range(from, to);
  }

  // Search filter
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,prompt.ilike.%${searchQuery}%,style.ilike.%${searchQuery}%`);
  }

  // Sorting
  switch (sortBy) {
    case 'popular':
      query = query.order('play_count', { ascending: false, nullsFirst: false });
      break;
    case 'liked':
      query = query.order('likes_count', { ascending: false, nullsFirst: false });
      break;
    case 'recent':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  // Project filter
  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error, count } = await query;

  if (error) {
    logger.error('Error fetching tracks', error);
    throw error;
  }

  const trackIds = data?.map(t => t.id) || [];

  if (trackIds.length === 0) {
    return { tracks: [], nextPage: null, totalCount: count || 0 };
  }

  // Fetch likes in parallel
  const [likesData, userLikesData] = await Promise.all([
    supabase
      .from('track_likes')
      .select('track_id')
      .in('track_id', trackIds),
    supabase
      .from('track_likes')
      .select('track_id')
      .eq('user_id', userId)
      .in('track_id', trackIds),
  ]);

  const likesCounts = likesData.data?.reduce((acc, like) => {
    acc[like.track_id] = (acc[like.track_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const userLikes = new Set(userLikesData.data?.map(l => l.track_id) || []);

  const enrichedTracks = data?.map(track => ({
    ...track,
    likes_count: likesCounts[track.id] ?? track.likes_count ?? 0,
    is_liked: userLikes.has(track.id),
  })) || [];

  const hasMore = count ? (pageParam + 1) * pageSize < count : false;

  return {
    tracks: enrichedTracks,
    nextPage: hasMore ? pageParam + 1 : null,
    totalCount: count || 0,
  };
}

export function useTracksUnified(params: UseTracksUnifiedParams = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { paginate = false, projectId, searchQuery, sortBy, pageSize } = params;

  const queryKey = ['tracks-unified', user?.id, projectId, searchQuery, sortBy, paginate, pageSize];

  // Infinite query for paginated mode
  const infiniteQuery = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) return { tracks: [], nextPage: null, totalCount: 0 };
      return retryWithBackoff(() => fetchTracksPage(user.id, params, pageParam));
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user?.id && paginate,
    staleTime: 30000,
    gcTime: 10 * 60 * 1000,
    initialPageParam: 0,
    refetchOnWindowFocus: false,
  });

  // Simple query for non-paginated mode
  const simpleQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return [];
      const result = await retryWithBackoff(() => fetchTracksPage(user.id, params));
      return result.tracks;
    },
    enabled: !!user?.id && !paginate,
    staleTime: 30000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`tracks_unified_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tracks',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tracks-unified', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Mutations
  const deleteTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      const { error } = await supabase.from('tracks').delete().eq('id', trackId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks-unified', user?.id] });
      toast.success('Трек удален');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка удаления');
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ trackId, isLiked }: { trackId: string; isLiked: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      if (isLiked) {
        const { error } = await supabase
          .from('track_likes')
          .delete()
          .eq('track_id', trackId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('track_likes')
          .insert({ track_id: trackId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: (_, { isLiked }) => {
      queryClient.invalidateQueries({ queryKey: ['tracks-unified', user?.id] });
      toast.success(isLiked ? 'Удалено из избранного' : 'Добавлено в избранное');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка');
    },
  });

  const logPlayMutation = useMutation({
    mutationFn: async (trackId: string) => {
      await supabase.rpc('increment_track_play_count', { track_id_param: trackId });
    },
  });

  // Flatten paginated results or use simple results
  const tracks = paginate
    ? infiniteQuery.data?.pages.flatMap((page) => page.tracks) || []
    : (simpleQuery.data as Track[]) || [];

  const totalCount = paginate
    ? infiniteQuery.data?.pages[0]?.totalCount || 0
    : tracks.length;

  return {
    // Data
    tracks,
    totalCount,
    
    // Loading states
    isLoading: paginate ? infiniteQuery.isLoading : simpleQuery.isLoading,
    error: paginate ? infiniteQuery.error : simpleQuery.error,
    
    // Pagination (only for paginate mode)
    fetchNextPage: infiniteQuery.fetchNextPage,
    hasNextPage: infiniteQuery.hasNextPage,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    
    // Refetch
    refetch: paginate ? infiniteQuery.refetch : simpleQuery.refetch,
    
    // Actions
    deleteTrack: useCallback((trackId: string) => deleteTrackMutation.mutate(trackId), [deleteTrackMutation]),
    toggleLike: useCallback((params: { trackId: string; isLiked: boolean }) => toggleLikeMutation.mutate(params), [toggleLikeMutation]),
    logPlay: useCallback((trackId: string) => logPlayMutation.mutate(trackId), [logPlayMutation]),
    
    // Mutation states
    isDeleting: deleteTrackMutation.isPending,
    isTogglingLike: toggleLikeMutation.isPending,
  };
}