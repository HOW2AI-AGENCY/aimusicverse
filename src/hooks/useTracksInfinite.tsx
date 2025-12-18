/**
 * @deprecated Use useTracks from '@/hooks/useTracks' with { paginate: true } instead.
 * This file is kept for backwards compatibility during migration.
 * Will be removed in next major release.
 * 
 * Migration example:
 * ```tsx
 * // Before
 * const { tracks, fetchNextPage, hasNextPage } = useTracksInfinite({ sortBy: 'recent' });
 * 
 * // After
 * const { tracks, fetchNextPage, hasNextPage } = useTracks({ paginate: true, sortBy: 'recent' });
 * ```
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Track } from '@/types/track';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'TracksInfinite' });
const PAGE_SIZE = 20;

interface UseTracksInfiniteParams {
  projectId?: string;
  searchQuery?: string;
  sortBy?: 'recent' | 'popular' | 'liked';
  pageSize?: number;
}

/**
 * @deprecated Use useTracks from '@/hooks/useTracks' with { paginate: true } instead
 */
export const useTracksInfinite = ({ 
  projectId, 
  searchQuery, 
  sortBy = 'recent',
  pageSize = PAGE_SIZE 
}: UseTracksInfiniteParams = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  log.warn('useTracksInfinite is deprecated. Use useTracks with { paginate: true } instead.');

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['tracks-infinite', user?.id, projectId, searchQuery, sortBy, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) return { tracks: [], nextPage: null, totalCount: 0 };

      const from = pageParam * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('tracks')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .in('status', ['completed', 'streaming_ready'])
        .range(from, to);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,prompt.ilike.%${searchQuery}%,style.ilike.%${searchQuery}%`);
      }

      switch (sortBy) {
        case 'popular':
          query = query.order('play_count', { ascending: false, nullsFirst: false });
          break;
        case 'liked':
          query = query.order('likes_count', { ascending: false, nullsFirst: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      if (projectId) query = query.eq('project_id', projectId);

      const { data, error, count } = await query;
      if (error) throw error;

      const trackIds = data?.map(t => t.id) || [];
      if (trackIds.length === 0) {
        return { tracks: [], nextPage: null, totalCount: count || 0 };
      }

      const [likesData, userLikesData] = await Promise.all([
        supabase.from('track_likes').select('track_id').in('track_id', trackIds),
        supabase.from('track_likes').select('track_id').eq('user_id', user.id).in('track_id', trackIds),
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
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user?.id,
    staleTime: 30000,
    gcTime: 10 * 60 * 1000,
    initialPageParam: 0,
    refetchOnWindowFocus: false,
  });

  const tracks = data?.pages.flatMap((page) => page.tracks) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

  const deleteTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      const { error } = await supabase.from('tracks').delete().eq('id', trackId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Трек удален');
      queryClient.invalidateQueries({ queryKey: ['tracks-infinite', user?.id] });
    },
    onError: (error: Error) => toast.error(error.message || 'Ошибка удаления'),
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ trackId, isLiked }: { trackId: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await supabase.from('track_likes').delete().eq('track_id', trackId).eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('track_likes').insert({ track_id: trackId, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracks-infinite', user?.id] }),
    onError: (error: Error) => toast.error(error.message || 'Ошибка'),
  });

  const logPlayMutation = useMutation({
    mutationFn: async (trackId: string) => {
      await supabase.rpc('increment_track_play_count', { track_id_param: trackId });
    },
  });

  return {
    tracks,
    totalCount,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    deleteTrack: (trackId: string) => deleteTrackMutation.mutate(trackId),
    toggleLike: (params: { trackId: string; isLiked: boolean }) => toggleLikeMutation.mutate(params),
    logPlay: (trackId: string) => logPlayMutation.mutate(trackId),
    downloadTrack: (_params: { trackId: string; audioUrl: string; coverUrl?: string }) => {},
  };
};
