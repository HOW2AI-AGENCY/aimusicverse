/**
 * @deprecated Use useTracks from '@/hooks/useTracks' instead.
 * This file is kept for backwards compatibility during migration.
 * Will be removed in next major release.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

// Re-export Track type from centralized location for backwards compatibility
export type { Track } from '@/types/track';
import type { Track } from '@/types/track';

const log = logger.child({ module: 'TracksOptimized' });

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

interface UseTracksParams {
  projectId?: string;
  searchQuery?: string;
  sortBy?: 'recent' | 'popular' | 'liked';
}

/**
 * @deprecated Use useTracks from '@/hooks/useTracks' instead
 */
export const useTracks = ({ projectId, searchQuery, sortBy = 'recent' }: UseTracksParams = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  log.warn('useTracksOptimized is deprecated. Use useTracks from @/hooks/useTracks instead.');

  const { data: tracks, isLoading, error, refetch } = useQuery({
    queryKey: ['tracks', user?.id, projectId, searchQuery, sortBy],
    queryFn: async () => {
      if (!user?.id) return [];

      return retryWithBackoff(async () => {
        let query = supabase
          .from('tracks')
          .select('*')
          .eq('user_id', user.id);

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
          case 'recent':
          default:
            query = query.order('created_at', { ascending: false });
            break;
        }

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;
        if (error) throw error;

        const trackIds = data?.map(t => t.id) || [];
        if (trackIds.length === 0) {
          return data?.map(track => ({ ...track, likes_count: 0, is_liked: false })) || [];
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

        return data?.map(track => ({
          ...track,
          likes_count: likesCounts[track.id] || 0,
          is_liked: userLikes.has(track.id),
        })) || [];
      });
    },
    enabled: !!user?.id,
    staleTime: 10000,
    gcTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`tracks_${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tracks',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['tracks', user.id] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const deleteTrack = useMutation({
    mutationFn: async (trackId: string) => {
      const { error } = await supabase.from('tracks').delete().eq('id', trackId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks', user?.id] });
      toast.success('Трек удален');
    },
    onError: (error: Error) => toast.error(error.message || 'Ошибка удаления'),
  });

  const toggleLike = useMutation({
    mutationFn: async ({ trackId, isLiked }: { trackId: string; isLiked: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (isLiked) {
        const { error } = await supabase.from('track_likes').delete().eq('track_id', trackId).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('track_likes').insert({ track_id: trackId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: (_, { isLiked }) => {
      queryClient.invalidateQueries({ queryKey: ['tracks', user?.id] });
      toast.success(isLiked ? 'Удалено из избранного' : 'Добавлено в избранное');
    },
    onError: (error: Error) => toast.error(error.message || 'Ошибка'),
  });

  const logPlay = useMutation({
    mutationFn: async (trackId: string) => {
      await supabase.rpc('increment_track_play_count', { track_id_param: trackId });
    },
  });

  return {
    tracks,
    isLoading,
    error,
    refetch,
    deleteTrack: useCallback((trackId: string) => deleteTrack.mutate(trackId), [deleteTrack]),
    isDeleting: deleteTrack.isPending,
    toggleLike: useCallback((params: { trackId: string; isLiked: boolean }) => toggleLike.mutate(params), [toggleLike]),
    isTogglingLike: toggleLike.isPending,
    logPlay: useCallback((trackId: string) => logPlay.mutate(trackId), [logPlay]),
    downloadTrack: useCallback((_params: { trackId: string; audioUrl: string; coverUrl?: string }) => {
      // Download handled by browser - just open in new tab
      if (_params.audioUrl) {
        window.open(_params.audioUrl, '_blank');
      }
    }, []),
    isDownloading: false,
    syncTags: useCallback((_trackId: string) => {}, []),
    isSyncing: false,
  };
};
