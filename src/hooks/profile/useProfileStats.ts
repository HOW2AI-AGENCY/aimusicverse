// useProfileStats hook - Sprint 011 Phase 3
// Fetch profile statistics (followers, following, tracks)

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProfileStats } from '@/types/profile';

export function useProfileStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile-stats', userId],
    queryFn: async (): Promise<ProfileStats> => {
      if (!userId) {
        return {
          followers: 0,
          following: 0,
          tracks: 0,
          likesReceived: 0,
        };
      }

      // First get user's track IDs for likes count
      const { data: userTracks } = await supabase
        .from('tracks')
        .select('id')
        .eq('user_id', userId)
        .eq('is_public', true);

      const trackIds = userTracks?.map(t => t.id) || [];

      const [followersResult, followingResult, tracksResult, likesResult] = await Promise.all([
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', userId)
          .eq('status', 'active'),
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', userId)
          .eq('status', 'active'),
        Promise.resolve({ count: userTracks?.length || 0 }),
        trackIds.length > 0
          ? supabase
              .from('track_likes')
              .select('id', { count: 'exact', head: true })
              .in('track_id', trackIds)
          : Promise.resolve({ count: 0 }),
      ]);

      return {
        followers: followersResult.count || 0,
        following: followingResult.count || 0,
        tracks: tracksResult.count || 0,
        likesReceived: likesResult.count || 0,
      };
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
