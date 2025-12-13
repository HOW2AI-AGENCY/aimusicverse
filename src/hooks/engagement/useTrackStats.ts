// useTrackStats hook - Sprint 011 Phase 6
// Fetch track like counts and user like status

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TrackStats {
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

interface UseTrackStatsParams {
  trackId: string;
  enabled?: boolean;
}

export function useTrackStats({ trackId, enabled = true }: UseTrackStatsParams) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['track-stats', trackId],
    queryFn: async (): Promise<TrackStats> => {
      // Get likes count
      const { count: likesCount, error: likesError } = await supabase
        .from('track_likes')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', trackId);

      if (likesError) throw likesError;

      // Get comments count (only top-level, non-moderated)
      const { count: commentsCount, error: commentsError } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', trackId)
        .eq('is_moderated', false);

      if (commentsError) throw commentsError;

      // Check if current user liked this track
      let isLiked = false;
      if (user?.id) {
        const { data: userLike, error: userLikeError } = await supabase
          .from('track_likes')
          .select('id')
          .eq('track_id', trackId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (userLikeError) {
          console.error('Error checking user like:', userLikeError);
        } else {
          isLiked = !!userLike;
        }
      }

      return {
        likesCount: likesCount || 0,
        commentsCount: commentsCount || 0,
        isLiked,
      };
    },
    enabled: !!trackId && enabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
