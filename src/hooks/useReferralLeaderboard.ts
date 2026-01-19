/**
 * useReferralLeaderboard Hook
 * Fetches top referrers for the leaderboard
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  referralCount: number;
  referralEarnings: number;
  isCurrentUser: boolean;
}

/**
 * Fetch referral leaderboard (top referrers)
 */
export function useReferralLeaderboard(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['referral-leaderboard', limit],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      // Get top referrers from user_credits
      const { data: topReferrers, error } = await supabase
        .from('user_credits')
        .select('user_id, referral_count, referral_earnings')
        .gt('referral_count', 0)
        .order('referral_count', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      if (!topReferrers || topReferrers.length === 0) {
        return [];
      }

      // Get profiles for these users
      const userIds = topReferrers.map(r => r.user_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, first_name, last_name, photo_url')
        .in('user_id', userIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p])
      );

      // Combine data
      return topReferrers.map(referrer => {
        const profile = profileMap.get(referrer.user_id);
        const displayName = profile?.display_name 
          || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
          || 'Пользователь';

        return {
          userId: referrer.user_id,
          displayName,
          avatarUrl: profile?.photo_url || null,
          referralCount: referrer.referral_count || 0,
          referralEarnings: referrer.referral_earnings || 0,
          isCurrentUser: referrer.user_id === user?.id,
        };
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  });
}

/**
 * Get current user's rank in the leaderboard
 */
export function useReferralRank() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['referral-rank', user?.id],
    queryFn: async (): Promise<number | null> => {
      if (!user?.id) return null;

      // Get user's referral count
      const { data: userData } = await supabase
        .from('user_credits')
        .select('referral_count')
        .eq('user_id', user.id)
        .single();

      if (!userData?.referral_count) return null;

      // Count users with more referrals
      const { count } = await supabase
        .from('user_credits')
        .select('*', { count: 'exact', head: true })
        .gt('referral_count', userData.referral_count);

      return (count || 0) + 1;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}
