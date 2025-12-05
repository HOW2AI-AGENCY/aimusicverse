import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Track } from './useTracksOptimized';

export type { Track } from './useTracksOptimized';

export const useTracks = (projectId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tracks, isLoading } = useQuery({
    queryKey: ['tracks', user?.id, projectId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('tracks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Enrich with likes data
      if (!data || data.length === 0) return [];

      const trackIds = data.map(t => t.id);
      
      const [likesData, userLikesData] = await Promise.all([
        supabase
          .from('track_likes')
          .select('track_id')
          .in('track_id', trackIds),
        supabase
          .from('track_likes')
          .select('track_id')
          .eq('user_id', user.id)
          .in('track_id', trackIds)
      ]);

      const likesCounts = likesData.data?.reduce((acc, like) => {
        acc[like.track_id] = (acc[like.track_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const userLikes = new Set(userLikesData.data?.map(l => l.track_id) || []);

      return data.map(track => ({
        ...track,
        likes_count: likesCounts[track.id] || 0,
        is_liked: userLikes.has(track.id)
      }));
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const deleteTrack = useMutation({
    mutationFn: async (trackId: string) => {
      const { error } = await supabase
        .from('tracks')
        .delete()
        .eq('id', trackId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks', user?.id] });
      toast.success('Трек удален');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка удаления');
    },
  });

  const toggleLike = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['tracks', user?.id] });
      toast.success(isLiked ? 'Удалено из избранного' : 'Добавлено в избранное');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка');
    },
  });

  const logPlay = useMutation({
    mutationFn: async (trackId: string) => {
      const { error: analyticsError } = await supabase
        .from('track_analytics')
        .insert({
          track_id: trackId,
          user_id: user?.id || null,
          event_type: 'play',
        });

      if (analyticsError) console.error('Analytics error:', analyticsError);

      await supabase.rpc('increment_track_play_count', {
        track_id_param: trackId,
      });
    },
    onError: (error: Error) => {
      console.error('Play log error:', error);
    },
  });

  const downloadTrack = useMutation({
    mutationFn: async ({
      trackId,
      audioUrl,
      coverUrl,
    }: {
      trackId: string;
      audioUrl: string;
      coverUrl?: string;
    }) => {
      const { error } = await supabase.functions.invoke('download-track', {
        body: { trackId, audioUrl, coverUrl },
      });

      if (error) throw error;

      await supabase
        .from('track_analytics')
        .insert({
          track_id: trackId,
          user_id: user?.id || null,
          event_type: 'download',
        });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка скачивания');
    },
    onSuccess: () => {
      toast.success('Скачивание началось');
    },
  });

  return {
    tracks,
    isLoading,
    deleteTrack: (trackId: string) => deleteTrack.mutate(trackId),
    toggleLike: (params: { trackId: string; isLiked: boolean }) => toggleLike.mutate(params),
    logPlay: (trackId: string) => logPlay.mutate(trackId),
    downloadTrack: (params: { trackId: string; audioUrl: string; coverUrl?: string }) =>
      downloadTrack.mutate(params),
  };
};
