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
        supabase
          .from('tracks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_public', true),
        supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('entity_id', userId)
          .eq('entity_type', 'track'),
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
