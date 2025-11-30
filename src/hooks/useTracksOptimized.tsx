import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useEffect, useCallback } from 'react';

export interface Track {
  id: string;
  user_id: string;
  title: string | null;
  prompt: string;
  audio_url: string | null;
  streaming_url: string | null;
  local_audio_url: string | null;
  cover_url: string | null;
  local_cover_url: string | null;
  lyrics: string | null;
  tags: string | null;
  style: string | null;
  duration_seconds: number | null;
  status: string | null;
  error_message: string | null;
  suno_task_id: string | null;
  suno_id: string | null;
  model_name: string | null;
  suno_model: string | null;
  generation_mode: string | null;
  has_vocals: boolean | null;
  is_public: boolean | null;
  play_count: number | null;
  project_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  provider: string | null;
  vocal_gender: string | null;
  style_weight: number | null;
  negative_tags: string | null;
  likes_count?: number;
  is_liked?: boolean;
}

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

export const useTracks = (projectId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch tracks with optimized query
  const { data: tracks, isLoading, error, refetch } = useQuery({
    queryKey: ['tracks', user?.id, projectId],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('🔄 Fetching tracks for user:', user.id);

      return retryWithBackoff(async () => {
        let query = supabase
          .from('tracks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ Error fetching tracks:', error);
          throw error;
        }

        console.log(`✅ Fetched ${data?.length || 0} tracks`);

        const trackIds = data?.map(t => t.id) || [];

        if (trackIds.length === 0) {
          return data?.map(track => ({ ...track, likes_count: 0, is_liked: false })) || [];
        }

        // Fetch likes count and user likes in parallel
        const [likesData, userLikesData] = await Promise.all([
          supabase
            .from('track_likes')
            .select('track_id')
            .in('track_id', trackIds),
          supabase
            .from('track_likes')
            .select('track_id')
            .eq('user_id', user.id)
            .in('track_id', trackIds),
        ]);

        const likesCounts = likesData.data?.reduce((acc, like) => {
          acc[like.track_id] = (acc[like.track_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        const userLikes = new Set(userLikesData.data?.map(l => l.track_id) || []);

        const enrichedTracks = data?.map(track => ({
          ...track,
          likes_count: likesCounts[track.id] || 0,
          is_liked: userLikes.has(track.id),
        })) || [];

        console.log('✅ Tracks enriched with likes');
        return enrichedTracks;
      });
    },
    enabled: !!user?.id,
    staleTime: 10000, // 10 seconds - уменьшено для более частых обновлений
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Realtime subscription for tracks updates with error handling
  useEffect(() => {
    if (!user?.id) return;

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    let channel: any = null;

    const setupChannel = () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.warn('Max reconnect attempts reached for tracks channel');
        return;
      }

      try {
        channel = supabase
          .channel(`tracks_${user.id}`, {
            config: {
              broadcast: { self: false },
            },
          })
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'tracks',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              reconnectAttempts = 0;
              queryClient.invalidateQueries({ queryKey: ['tracks', user.id] });
            }
          )
          .subscribe((status) => {
            if (status === 'CHANNEL_ERROR') {
              reconnectAttempts++;
              console.error('Tracks channel error, attempt:', reconnectAttempts);
              
              const backoffMs = Math.min(1000 * Math.pow(2, reconnectAttempts), 15000);
              setTimeout(() => {
                if (channel) {
                  supabase.removeChannel(channel);
                }
                setupChannel();
              }, backoffMs);
            }
          });
      } catch (error) {
        console.error('Error setting up tracks channel:', error);
        reconnectAttempts++;
      }
    };

    setupChannel();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, queryClient]);

  // Delete track mutation with optimistic update
  const deleteTrack = useMutation({
    mutationFn: async (trackId: string) => {
      return retryWithBackoff(async () => {
        const { error } = await supabase
          .from('tracks')
          .delete()
          .eq('id', trackId);

        if (error) throw error;
      });
    },
    onMutate: async (trackId) => {
      await queryClient.cancelQueries({ queryKey: ['tracks', user?.id] });
      
      const previousTracks = queryClient.getQueryData<Track[]>(['tracks', user?.id]);
      
      queryClient.setQueryData<Track[]>(['tracks', user?.id], (old) =>
        old?.filter((t) => t.id !== trackId)
      );

      return { previousTracks };
    },
    onError: (error: any, _, context) => {
      queryClient.setQueryData(['tracks', user?.id], context?.previousTracks);
      toast.error(error.message || 'Ошибка удаления трека');
    },
    onSuccess: () => {
      toast.success('Трек удален');
    },
  });

  // Toggle like mutation with optimistic update
  const toggleLike = useMutation({
    mutationFn: async ({ trackId, isLiked }: { trackId: string; isLiked: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      return retryWithBackoff(async () => {
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
      });
    },
    onMutate: async ({ trackId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['tracks', user?.id] });
      
      const previousTracks = queryClient.getQueryData<Track[]>(['tracks', user?.id]);
      
      queryClient.setQueryData<Track[]>(['tracks', user?.id], (old) =>
        old?.map((t) =>
          t.id === trackId
            ? {
                ...t,
                is_liked: !isLiked,
                likes_count: (t.likes_count || 0) + (isLiked ? -1 : 1),
              }
            : t
        )
      );

      return { previousTracks };
    },
    onError: (error: any, _, context) => {
      queryClient.setQueryData(['tracks', user?.id], context?.previousTracks);
      toast.error(error.message || 'Ошибка');
    },
    onSuccess: (_, { isLiked }) => {
      toast.success(isLiked ? 'Удалено из избранного' : 'Добавлено в избранное');
    },
  });

  // Log play mutation
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

      // Use atomic increment function
      await supabase.rpc('increment_track_play_count', {
        track_id_param: trackId,
      });
    },
    onError: (error: any) => {
      console.error('Play log error:', error);
    },
  });

  // Download track mutation
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
      return retryWithBackoff(async () => {
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
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка скачивания');
    },
    onSuccess: () => {
      toast.success('Скачивание началось');
    },
  });

  // Sync tags mutation
  const syncTags = useMutation({
    mutationFn: async (trackId: string) => {
      return retryWithBackoff(async () => {
        const { error } = await supabase.functions.invoke('sync-suno-tags', {
          body: { trackId },
        });

        if (error) throw error;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks', user?.id] });
      toast.success('Теги синхронизированы');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка синхронизации');
    },
  });

  return {
    tracks,
    isLoading,
    error,
    refetch,
    deleteTrack: useCallback((trackId: string) => deleteTrack.mutate(trackId), [deleteTrack]),
    isDeleting: deleteTrack.isPending,
    toggleLike: useCallback((params: { trackId: string; isLiked: boolean }) => 
      toggleLike.mutate(params), [toggleLike]
    ),
    isTogglingLike: toggleLike.isPending,
    logPlay: useCallback((trackId: string) => logPlay.mutate(trackId), [logPlay]),
    downloadTrack: useCallback((params: { trackId: string; audioUrl: string; coverUrl?: string }) =>
      downloadTrack.mutate(params), [downloadTrack]
    ),
    isDownloading: downloadTrack.isPending,
    syncTags: useCallback((trackId: string) => syncTags.mutate(trackId), [syncTags]),
    isSyncing: syncTags.isPending,
  };
};
