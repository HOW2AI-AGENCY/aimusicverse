import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hapticImpact } from '@/lib/haptic';

interface VideoGenerationStatus {
  isGenerating: boolean;
  hasVideo: boolean;
  videoUrl: string | null;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  error: string | null;
}

export function useVideoGenerationStatus(trackId: string | undefined): VideoGenerationStatus {
  const queryClient = useQueryClient();
  const prevStatusRef = useRef<string>('idle');

  const { data } = useQuery({
    queryKey: ['video-generation-status', trackId],
    queryFn: async () => {
      if (!trackId) return null;

      // Check if track already has video
      const { data: track } = await supabase
        .from('tracks')
        .select('video_url, local_video_url')
        .eq('id', trackId)
        .single();

      if (track?.video_url || track?.local_video_url) {
        return {
          isGenerating: false,
          hasVideo: true,
          videoUrl: track.local_video_url || track.video_url,
          status: 'completed' as const,
          error: null,
        };
      }

      // Check for active video generation task
      const { data: task } = await supabase
        .from('video_generation_tasks')
        .select('status, error_message, video_url, local_video_url')
        .eq('track_id', trackId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!task) {
        return {
          isGenerating: false,
          hasVideo: false,
          videoUrl: null,
          status: 'idle' as const,
          error: null,
        };
      }

      if (task.status === 'processing' || task.status === 'pending') {
        return {
          isGenerating: true,
          hasVideo: false,
          videoUrl: null,
          status: 'processing' as const,
          error: null,
        };
      }

      if (task.status === 'completed') {
        return {
          isGenerating: false,
          hasVideo: true,
          videoUrl: task.local_video_url || task.video_url,
          status: 'completed' as const,
          error: null,
        };
      }

      if (task.status === 'failed') {
        return {
          isGenerating: false,
          hasVideo: false,
          videoUrl: null,
          status: 'failed' as const,
          error: task.error_message,
        };
      }

      return {
        isGenerating: false,
        hasVideo: false,
        videoUrl: null,
        status: 'idle' as const,
        error: null,
      };
    },
    enabled: !!trackId,
    staleTime: 5000,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.isGenerating) return 5000;
      // Check periodically even when not generating to catch updates
      return 60000;
    },
  });

  // Realtime subscription for video updates
  useEffect(() => {
    if (!trackId) return;

    const channel = supabase
      .channel(`video-track-${trackId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tracks',
        filter: `id=eq.${trackId}`,
      }, (payload: any) => {
        if (payload.new?.video_url || payload.new?.local_video_url) {
          queryClient.invalidateQueries({ queryKey: ['video-generation-status', trackId] });
          queryClient.invalidateQueries({ queryKey: ['tracks'] });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackId, queryClient]);

  // Toast notification when video completes
  useEffect(() => {
    const currentStatus = data?.status || 'idle';
    if (prevStatusRef.current === 'processing' && currentStatus === 'completed') {
      toast.success('Видеоклип готов! 🎬');
      hapticImpact('medium');
    }
    prevStatusRef.current = currentStatus;
  }, [data?.status]);

  return data || {
    isGenerating: false,
    hasVideo: false,
    videoUrl: null,
    status: 'idle',
    error: null,
  };
}
