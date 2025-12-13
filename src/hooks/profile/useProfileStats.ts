// useProfileStats Hook - Sprint 011 Task T029
// Fetch profile statistics (followers, following, tracks, likes)

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const profileLogger = logger.child({ module: 'useProfileStats' });

export interface ProfileStats {
  followers: number;
  following: number;
  tracks: number;
  likesReceived: number;
}

export function useProfileStats(userId: string) {
  return useQuery({
    queryKey: ['profile-stats', userId],
    queryFn: async (): Promise<ProfileStats> => {
      profileLogger.debug('Fetching profile stats', { userId });

      const { data, error } = await supabase
        .from('profiles')
        .select('stats_followers, stats_following, stats_tracks, stats_likes_received')
        .eq('user_id', userId)
        .single();

      if (error) {
        profileLogger.error('Error fetching profile stats', { userId, error });
        throw error;
      }

      if (!data) {
        throw new Error('Profile not found');
      }

      return {
        followers: data.stats_followers,
        following: data.stats_following,
        tracks: data.stats_tracks,
        likesReceived: data.stats_likes_received,
      };
    },
    staleTime: 30 * 1000, // 30 seconds (stats update frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId,
  });
}
