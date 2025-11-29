import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Track {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string | null;
  prompt: string;
  lyrics: string | null;
  style: string | null;
  tags: string | null;
  audio_url: string | null;
  cover_url: string | null;
  streaming_url: string | null;
  local_audio_url: string | null;
  local_cover_url: string | null;
  status: string | null;
  provider: string | null;
  model_name: string | null;
  suno_model: string | null;
  generation_mode: string | null;
  vocal_gender: string | null;
  style_weight: number | null;
  negative_tags: string | null;
  has_vocals: boolean | null;
  is_public: boolean | null;
  play_count: number | null;
  duration_seconds: number | null;
  suno_id: string | null;
  suno_task_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  likes_count?: number;
  is_liked?: boolean;
}

export const useTracks = (projectId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tracks, isLoading, error } = useQuery({
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

      // Get likes count for each track
      const trackIds = data?.map(t => t.id) || [];
      const { data: likesData } = await supabase
        .from('track_likes' as any)
        .select('track_id')
        .in('track_id', trackIds);

      // Get user's likes
      const { data: userLikes } = await supabase
        .from('track_likes' as any)
        .select('track_id')
        .eq('user_id', user.id)
        .in('track_id', trackIds);

      const likesCounts = (likesData || []).reduce((acc: Record<string, number>, like: any) => {
        acc[like.track_id] = (acc[like.track_id] || 0) + 1;
        return acc;
      }, {});

      const likedTrackIds = new Set(userLikes?.map((l: any) => l.track_id) || []);

      return (data || []).map((track: any) => ({
        ...track,
        likes_count: likesCounts[track.id] || 0,
        is_liked: likedTrackIds.has(track.id),
      })) as Track[];
    },
    enabled: !!user?.id,
  });

  const deleteTrack = useMutation({
    mutationFn: async (trackId: string) => {
      const { error } = await supabase
        .from('tracks')
        .delete()
        .eq('id', trackId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      toast.success('Трек удален');
    },
    onError: (error: any) => {
      console.error('Error deleting track:', error);
      toast.error('Ошибка удаления трека');
    },
  });

  const toggleLike = useMutation({
    mutationFn: async ({ trackId, isLiked }: { trackId: string; isLiked: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('track_likes' as any)
          .delete()
          .eq('track_id', trackId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase
          .from('track_likes' as any)
          .insert({
            track_id: trackId,
            user_id: user.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
    onError: (error: any) => {
      console.error('Error toggling like:', error);
      toast.error('Ошибка');
    },
  });

  const logPlay = useMutation({
    mutationFn: async (trackId: string) => {
      const { error } = await supabase
        .from('track_analytics' as any)
        .insert({
          track_id: trackId,
          user_id: user?.id,
          event_type: 'play',
          metadata: {
            timestamp: new Date().toISOString(),
          },
        });

      if (error) throw error;
    },
  });

  const downloadTrack = useMutation({
    mutationFn: async ({ trackId, audioUrl, coverUrl }: { 
      trackId: string; 
      audioUrl: string; 
      coverUrl?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('download-track', {
        body: {
          trackId,
          audioUrl,
          coverUrl,
          metadata: {
            downloaded_at: new Date().toISOString(),
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      toast.success('Трек загружен в хранилище');
    },
    onError: (error: any) => {
      console.error('Error downloading track:', error);
      toast.error('Ошибка загрузки трека');
    },
  });

  const syncTags = useMutation({
    mutationFn: async ({ trackId, trackData, tags }: {
      trackId: string;
      trackData: any;
      tags?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke('sync-suno-tags', {
        body: {
          trackData: {
            id: trackId,
            ...trackData,
          },
          tags,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('Tags synced:', data);
      toast.success(`Синхронизировано ${data.syncedTags} тегов`);
    },
    onError: (error: any) => {
      console.error('Error syncing tags:', error);
      toast.error('Ошибка синхронизации тегов');
    },
  });

  return {
    tracks,
    isLoading,
    error,
    deleteTrack: deleteTrack.mutate,
    toggleLike: toggleLike.mutate,
    logPlay: logPlay.mutate,
    downloadTrack: downloadTrack.mutate,
    syncTags: syncTags.mutate,
    isDeleting: deleteTrack.isPending,
    isTogglingLike: toggleLike.isPending,
    isDownloading: downloadTrack.isPending,
    isSyncingTags: syncTags.isPending,
  };
};
