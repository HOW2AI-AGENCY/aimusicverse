import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VideoGenerationStatus {
  isGenerating: boolean;
  hasVideo: boolean;
  videoUrl: string | null;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  error: string | null;
}

export function useVideoGenerationStatus(trackId: string | undefined): VideoGenerationStatus {
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
      // Refetch more frequently if generating
      const data = query.state.data;
      if (data?.isGenerating) return 5000;
      return false;
    },
  });

  return data || {
    isGenerating: false,
    hasVideo: false,
    videoUrl: null,
    status: 'idle',
    error: null,
  };
}
