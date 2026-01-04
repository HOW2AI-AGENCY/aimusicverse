/**
 * Gamification Hooks
 * React hooks wrapping credits service for gamification features
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useTelegram } from '@/contexts/TelegramContext';

// Re-export from service for backward compatibility
import * as creditsApi from '@/api/credits.api';
import * as creditsService from '@/services/credits.service';

export {
  ACTION_REWARDS,
  getExperienceForLevel,
  getLevelFromExperience,
  getLevelProgress,
} from '@/services/credits.service';

// Types (re-exported for backward compatibility)
export interface UserCredits {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  current_streak: number;
  longest_streak: number;
  last_checkin_date: string | null;
  level: number;
  experience: number;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  credits_reward: number;
  experience_reward: number;
  requirement_type: string;
  requirement_value: number;
  is_hidden: boolean;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string | null;
  photo_url: string | null;
  level: number;
  experience: number;
  total_earned: number;
  current_streak: number;
  achievements_count: number;
  total_tracks: number;
  total_shares: number;
  total_likes_received: number;
  total_plays: number;
}

export type LeaderboardCategory = 'overall' | 'generators' | 'sharers' | 'popular' | 'listeners';

export const LEADERBOARD_CATEGORIES = {
  overall: { label: 'Общий', icon: '👑', stat: 'experience' },
  generators: { label: 'Генераторы', icon: '🎵', stat: 'total_tracks' },
  sharers: { label: 'Промоутеры', icon: '🔗', stat: 'total_shares' },
  popular: { label: 'Популярные', icon: '❤️', stat: 'total_likes_received' },
  listeners: { label: 'Прослушивания', icon: '👂', stat: 'total_plays' },
} as const;

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  action_type: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Hook to fetch user credits
 */
export function useUserCredits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-credits', user?.id],
    queryFn: async (): Promise<UserCredits | null> => {
      if (!user?.id) return null;
      const data = await creditsApi.fetchUserCredits(user.id);
      
      // If no record exists, create one
      if (!data) {
        return await creditsApi.upsertUserCredits(user.id, {}) as UserCredits;
      }
      return data as UserCredits;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });
}

/**
 * Hook to fetch all achievements
 */
export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: creditsApi.fetchAchievements,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch user's unlocked achievements
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
 * Hook to fetch leaderboard
 */
export function useLeaderboard(limit = 50, category: LeaderboardCategory = 'overall') {
  return useQuery({
    queryKey: ['leaderboard', limit, category],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const data = await creditsApi.fetchLeaderboard(limit, category);
      return data as LeaderboardEntry[];
    },
    staleTime: 60000,
  });
}

/**
 * Hook to fetch credit transactions
 */
export function useCreditTransactions(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credit-transactions', user?.id, limit],
    queryFn: async (): Promise<CreditTransaction[]> => {
      if (!user?.id) return [];
      const data = await creditsApi.fetchCreditTransactions(user.id, limit);
      return data as CreditTransaction[];
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });
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
      toast.success(`+${result.credits} кредитов! День ${result.streak} 🔥`, {
        description: `+${result.experience} опыта`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      queryClient.invalidateQueries({ queryKey: ['user-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['credit-transactions'] });
    },
    onError: (error: Error) => {
      if (error.message === 'Вы уже отметились сегодня') {
        toast.info(error.message);
      } else {
        toast.error('Ошибка чекина');
      }
    },
  });
}

/**
 * Hook to reward user for actions
 */
export function useRewardAction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      actionType,
      customCredits,
      customExperience,
      description,
      metadata,
    }: {
      actionType: creditsService.ActionType;
      customCredits?: number;
      customExperience?: number;
      description?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      return creditsService.rewardForAction(user.id, actionType, metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      queryClient.invalidateQueries({ queryKey: ['credit-transactions'] });
    },
  });
}

/**
 * Hook to check if user can check in today
 */
export function useCanCheckinToday() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['can-checkin-today', user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id) return false;
      const hasCheckedIn = await creditsApi.hasCheckedInToday(user.id);
      return !hasCheckedIn;
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

/**
 * Hook to reward sharing
 */
export function useRewardShare() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ trackId }: { trackId: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      return creditsService.rewardForAction(user.id, 'share', { trackId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      queryClient.invalidateQueries({ queryKey: ['credit-transactions'] });
    },
  });
}
