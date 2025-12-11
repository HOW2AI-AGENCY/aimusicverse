import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface UserCredits {
  balance: number;
  total_earned: number;
  total_spent: number;
  experience: number;
  level: number;
  current_streak: number;
}

const GENERATION_COST = 10;

export function useUserCredits() {
  const queryClient = useQueryClient();

  // Check admin status
  const { data: adminData } = useQuery({
    queryKey: ['user-admin-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { isAdmin: false };

      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });

      return { isAdmin: !!data };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isAdmin = adminData?.isAdmin ?? false;

  // Fetch API balance for admins
  const { data: apiBalance } = useQuery({
    queryKey: ['admin-suno-api-balance'],
    queryFn: async (): Promise<number> => {
      try {
        const { data, error } = await supabase.functions.invoke('suno-credits');
        if (error) {
          logger.error('Failed to fetch Suno API balance for admin', { error });
          return 0;
        }
        return data?.credits ?? 0;
      } catch (err) {
        logger.error('Error fetching admin API balance', { error: err });
        return 0;
      }
    },
    enabled: isAdmin,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Fetch personal credits for regular users
  const { data: credits, isLoading, error, refetch } = useQuery({
    queryKey: ['user-credits'],
    queryFn: async (): Promise<UserCredits | null> => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) return null;

      const { data, error } = await supabase
        .from('user_credits')
        .select('balance, total_earned, total_spent, experience, level, current_streak')
        .eq('user_id', session.session.user.id)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching user credits', { error });
        return null;
      }

      return data || {
        balance: 0,
        total_earned: 0,
        total_spent: 0,
        experience: 0,
        level: 1,
        current_streak: 0,
      };
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  // For admins, use API balance; for regular users, use personal balance
  const effectiveBalance = isAdmin ? (apiBalance ?? 0) : (credits?.balance ?? 0);
  
  // Admins always can generate (they use shared API balance)
  const canGenerate = isAdmin ? true : effectiveBalance >= GENERATION_COST;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    if (isAdmin) {
      queryClient.invalidateQueries({ queryKey: ['admin-suno-api-balance'] });
    }
  };

  return {
    credits,
    balance: effectiveBalance,
    isLoading,
    error,
    refetch,
    invalidate,
    canGenerate,
    generationCost: GENERATION_COST,
    isAdmin,
    apiBalance: apiBalance ?? null,
  };
}
