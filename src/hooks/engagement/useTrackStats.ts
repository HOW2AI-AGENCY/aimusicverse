// useTrackStats Hook - Sprint 011 Task T064
// Fetch track statistics including likes count

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrackStats {
  likesCount: number;
  commentsCount: number;
  playsCount: number;
}

/**
 * Hook to fetch track statistics
 */
export function useTrackStats(trackId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['track-stats', trackId],
    queryFn: async (): Promise<TrackStats> => {
      // Fetch likes count
      const { count: likesCount, error: likesError } = await supabase
        .from('track_likes')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', trackId);

      if (likesError) {
        console.error('Error fetching likes count:', likesError);
      }

      // Fetch comments count
      const { count: commentsCount, error: commentsError } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', trackId)
        .eq('is_moderated', false);

      if (commentsError) {
        console.error('Error fetching comments count:', commentsError);
      }

      // Fetch plays count (from tracks table)
      const { data: track, error: trackError } = await supabase
        .from('tracks')
        .select('play_count')
        .eq('id', trackId)
        .single();

      if (trackError) {
        console.error('Error fetching track plays:', trackError);
      }

      return {
        likesCount: likesCount || 0,
        commentsCount: commentsCount || 0,
        playsCount: track?.play_count || 0,
      };
    },
    enabled: enabled && !!trackId,
    staleTime: 60 * 1000, // 1 minute
  });
}
