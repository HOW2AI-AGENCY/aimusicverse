import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
        console.error('Error fetching user credits:', error);
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

  const canGenerate = (credits?.balance ?? 0) >= GENERATION_COST;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['user-credits'] });
  };

  return {
    credits,
    balance: credits?.balance ?? 0,
    isLoading,
    error,
    refetch,
    invalidate,
    canGenerate,
    generationCost: GENERATION_COST,
  };
}
