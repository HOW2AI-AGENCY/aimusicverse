import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from './useAdminAuth';
import { logger } from '@/lib/logger';

interface SunoCreditsResponse {
  success: boolean;
  credits: number;
}

interface AdminBalanceData {
  apiBalance: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for fetching Suno API balance for administrators
 * Uses the shared application API balance instead of personal user balance
 */
export function useAdminBalance(): AdminBalanceData {
  const { data: adminAuth, isLoading: authLoading } = useAdminAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-api-balance'],
    queryFn: async (): Promise<number> => {
      try {
        const { data, error } = await supabase.functions.invoke<SunoCreditsResponse>('suno-credits');
        
        if (error) {
          logger.error('Failed to fetch Suno API balance', { error });
          throw error;
        }
        
        if (data?.credits !== undefined) {
          return data.credits;
        }
        
        return 0;
      } catch (err) {
        logger.error('Error in useAdminBalance', { error: err });
        throw err;
      }
    },
    enabled: !!adminAuth?.isAdmin && !authLoading,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    apiBalance: data ?? 0,
    isLoading: authLoading || isLoading,
    error: error as Error | null,
    refetch,
  };
}
