/**
 * User Credits Hook
 * Simplified hook for balance checking and generation authorization
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import * as creditsApi from '@/api/credits.api';
import { GENERATION_COST, getModelCost } from '@/services/credits.service';
import { logger } from '@/lib/logger';

interface UserCredits {
  balance: number;
  total_earned: number;
  total_spent: number;
  experience: number;
  level: number;
  current_streak: number;
}

export function useUserCredits(modelKey?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check admin status
  const { data: adminData } = useQuery({
    queryKey: ['user-admin-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return { isAdmin: false };
      const isAdmin = await creditsApi.checkAdminStatus(user.id);
      return { isAdmin };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const isAdmin = adminData?.isAdmin ?? false;

  // Fetch API balance for admins
  const { data: apiBalance } = useQuery({
    queryKey: ['admin-suno-api-balance'],
    queryFn: async (): Promise<number> => {
      try {
        return await creditsApi.fetchSunoApiBalance();
      } catch (err) {
        logger.error('Error fetching admin API balance', { error: err });
        return 0;
      }
    },
    enabled: isAdmin,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Fetch personal credits
  const { data: credits, isLoading, error, refetch } = useQuery({
    queryKey: ['user-credits', user?.id],
    queryFn: async (): Promise<UserCredits | null> => {
      if (!user?.id) return null;

      const data = await creditsApi.fetchUserCredits(user.id);
      if (!data) {
        return {
          balance: 0,
          total_earned: 0,
          total_spent: 0,
          experience: 0,
          level: 1,
          current_streak: 0,
        };
      }

      return {
        balance: data.balance,
        total_earned: data.total_earned,
        total_spent: data.total_spent,
        experience: data.experience,
        level: data.level,
        current_streak: data.current_streak,
      };
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Dynamic generation cost based on model
  const generationCost = modelKey ? getModelCost(modelKey) : GENERATION_COST;

  // For admins, use API balance; for regular users, use personal balance
  const effectiveBalance = isAdmin ? (apiBalance ?? 0) : (credits?.balance ?? 0);
  const canGenerate = isAdmin ? true : effectiveBalance >= generationCost;

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
    generationCost,
    isAdmin,
    apiBalance: apiBalance ?? null,
  };
}
