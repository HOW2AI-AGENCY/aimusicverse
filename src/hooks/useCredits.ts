/**
 * useCredits - Simplified hook using service layer
 * Replaces complex useUserCredits from useGamification.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { notify } from '@/lib/notifications';
import { useTelegram } from '@/contexts/TelegramContext';
import * as creditsService from '@/services/credits.service';
import * as creditsApi from '@/api/credits.api';

/**
 * Hook for user credits and balance
 */
export function useCredits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-gamification-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return creditsService.getUserGamificationStats(user.id);
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['user-gamification-stats', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['user-credits', user?.id] });
  };

  return {
    credits: data?.credits ?? null,
    balance: data?.effectiveBalance ?? 0,
    isAdmin: data?.isAdmin ?? false,
    apiBalance: data?.apiBalance ?? null,
    canGenerate: data?.canGenerate ?? false,
    levelProgress: data?.levelProgress ?? { current: 0, next: 100, progress: 0, level: 1 },
    generationCost: creditsService.GENERATION_COST,
    isLoading,
    error,
    refetch,
    invalidate,
  };
}

/**
 * Hook for daily check-in
 */
export function useCheckin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { hapticFeedback } = useTelegram();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      return creditsService.processDailyCheckin(user.id);
    },
    onSuccess: (result) => {
      hapticFeedback?.('success');
      notify.success(`+${result.credits} кредитов! День ${result.streak} 🔥`, {
        description: `+${result.experience} опыта`,
      });
      
      if (result.levelUp) {
        notify.success(`🎉 Новый уровень: ${result.newLevel}!`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['user-gamification-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      queryClient.invalidateQueries({ queryKey: ['can-checkin-today'] });
    },
    onError: (error: Error) => {
      if (error.message === 'Вы уже отметились сегодня') {
        notify.info(error.message, { dedupe: true, dedupeKey: 'already-checkin' });
      } else {
        notify.error('Ошибка чекина');
      }
    },
  });
}

/**
 * Hook to check if can check-in today
 */
export function useCanCheckinToday() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['can-checkin-today', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const hasCheckedIn = await creditsApi.hasCheckedInToday(user.id);
      return !hasCheckedIn;
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

/**
 * Hook for rewarding user actions
 */
export function useRewardAction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      actionType,
      metadata,
    }: {
      actionType: creditsService.ActionType;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      return creditsService.rewardForAction(user.id, actionType, metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-gamification-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    },
  });
}

/**
 * Hook for credit transactions history
 */
export function useTransactionHistory(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credit-transactions', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      return creditsApi.fetchCreditTransactions(user.id, limit);
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });
}

/**
 * Hook for achievements
 */
export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: creditsApi.fetchAchievements,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for user's unlocked achievements
 */
export function useUserAchievements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return creditsApi.fetchUserAchievements(user.id);
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

/**
 * Hook for leaderboard
 */
export function useLeaderboard(
  limit = 50,
  category: 'overall' | 'generators' | 'sharers' | 'popular' | 'listeners' = 'overall'
) {
  return useQuery({
    queryKey: ['leaderboard', limit, category],
    queryFn: () => creditsApi.fetchLeaderboard(limit, category),
    staleTime: 60000,
  });
}

// Re-export utility functions from service
export {
  getLevelFromExperience,
  getExperienceForLevel,
  getLevelProgress,
  ACTION_REWARDS,
  GENERATION_COST,
} from '@/services/credits.service';
