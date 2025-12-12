import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserBalanceSummary {
  total_users: number;
  total_balance: number;
  total_earned: number;
  total_spent: number;
  avg_balance: number;
  users_with_zero_balance: number;
  users_low_balance: number;
}

export function useUserBalanceSummary() {
  return useQuery({
    queryKey: ['user-balance-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_balance_summary');
      if (error) throw error;
      return data?.[0] as UserBalanceSummary | undefined;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

// Hook to get users with their balances for admin
export function useUsersWithBalances(options: { limit?: number; orderBy?: 'balance' | 'created_at' } = {}) {
  const { limit = 100, orderBy = 'created_at' } = options;

  return useQuery({
    queryKey: ['users-with-balances', limit, orderBy],
    queryFn: async () => {
      // First get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, first_name, last_name, photo_url, subscription_tier, subscription_expires_at, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (profilesError) throw profilesError;

      // Then get credits for these users
      const userIds = profiles?.map(p => p.user_id) || [];
      const { data: credits, error: creditsError } = await supabase
        .from('user_credits')
        .select('user_id, balance, total_earned, total_spent, level, experience, current_streak')
        .in('user_id', userIds);

      if (creditsError) throw creditsError;

      // Merge the data
      const mergedData = profiles?.map(profile => {
        const userCredits = credits?.find(c => c.user_id === profile.user_id);
        return {
          ...profile,
          balance: userCredits?.balance || 0,
          total_earned: userCredits?.total_earned || 0,
          total_spent: userCredits?.total_spent || 0,
          level: userCredits?.level || 1,
          experience: userCredits?.experience || 0,
          current_streak: userCredits?.current_streak || 0,
        };
      }) || [];

      // Sort by balance if needed
      if (orderBy === 'balance') {
        mergedData.sort((a, b) => b.balance - a.balance);
      }

      return mergedData;
    },
  });
}
