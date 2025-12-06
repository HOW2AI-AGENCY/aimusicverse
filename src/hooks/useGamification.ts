import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useTelegram } from '@/contexts/TelegramContext';

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
}

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

// Action rewards configuration
export const ACTION_REWARDS = {
  checkin: { credits: 5, experience: 10, description: 'Ежедневный чекин' },
  streak_bonus: { credits: 2, experience: 5, description: 'Бонус за серию' }, // per day
  share: { credits: 3, experience: 15, description: 'Расшаривание трека' },
  like_received: { credits: 1, experience: 5, description: 'Получен лайк' },
  generation_complete: { credits: 0, experience: 20, description: 'Генерация трека' },
  public_track: { credits: 2, experience: 10, description: 'Публичный трек' },
  artist_created: { credits: 5, experience: 25, description: 'Создание артиста' },
  project_created: { credits: 3, experience: 15, description: 'Создание проекта' },
} as const;

// Level thresholds
export function getExperienceForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100;
}

export function getLevelFromExperience(experience: number): number {
  return Math.max(1, Math.floor(Math.sqrt(experience / 100)) + 1);
}

export function getLevelProgress(experience: number): { current: number; next: number; progress: number } {
  const level = getLevelFromExperience(experience);
  const currentLevelExp = getExperienceForLevel(level);
  const nextLevelExp = getExperienceForLevel(level + 1);
  const progress = ((experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;
  return { current: currentLevelExp, next: nextLevelExp, progress: Math.min(100, Math.max(0, progress)) };
}

export function useUserCredits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-credits', user?.id],
    queryFn: async (): Promise<UserCredits | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // If no record exists, create one
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('user_credits')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newData as UserCredits;
      }

      return data as UserCredits;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async (): Promise<Achievement[]> => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true })
        .order('requirement_value', { ascending: true });

      if (error) throw error;
      return data as Achievement[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserAchievements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async (): Promise<UserAchievement[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      return data as unknown as UserAchievement[];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

export function useLeaderboard(limit = 50) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data, error } = await supabase
        .rpc('get_leaderboard', { _limit: limit });

      if (error) throw error;
      return data as LeaderboardEntry[];
    },
    staleTime: 60000,
  });
}

export function useCreditTransactions(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credit-transactions', user?.id, limit],
    queryFn: async (): Promise<CreditTransaction[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as CreditTransaction[];
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });
}

export function useCheckin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { hapticFeedback } = useTelegram();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const today = new Date().toISOString().split('T')[0];

      // Check if already checked in today
      const { data: existing } = await supabase
        .from('user_checkins')
        .select('id')
        .eq('user_id', user.id)
        .eq('checkin_date', today)
        .maybeSingle();

      if (existing) {
        throw new Error('Вы уже отметились сегодня');
      }

      // Get current credits
      const { data: credits } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const lastCheckinDate = credits?.last_checkin_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Calculate streak
      let newStreak = 1;
      if (lastCheckinDate === yesterdayStr) {
        newStreak = (credits?.current_streak || 0) + 1;
      }

      // Calculate rewards
      const baseReward = ACTION_REWARDS.checkin;
      const streakBonus = newStreak > 1 ? (newStreak - 1) * ACTION_REWARDS.streak_bonus.credits : 0;
      const streakExpBonus = newStreak > 1 ? (newStreak - 1) * ACTION_REWARDS.streak_bonus.experience : 0;
      const totalCredits = baseReward.credits + streakBonus;
      const totalExperience = baseReward.experience + streakExpBonus;

      // Insert checkin record
      await supabase
        .from('user_checkins')
        .insert({
          user_id: user.id,
          checkin_date: today,
          credits_earned: totalCredits,
          streak_day: newStreak,
        });

      // Update or insert user credits
      const newExperience = (credits?.experience || 0) + totalExperience;
      const newLevel = getLevelFromExperience(newExperience);

      if (credits) {
        await supabase
          .from('user_credits')
          .update({
            balance: credits.balance + totalCredits,
            total_earned: credits.total_earned + totalCredits,
            current_streak: newStreak,
            longest_streak: Math.max(credits.longest_streak, newStreak),
            last_checkin_date: today,
            experience: newExperience,
            level: newLevel,
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            balance: totalCredits,
            total_earned: totalCredits,
            current_streak: newStreak,
            longest_streak: newStreak,
            last_checkin_date: today,
            experience: totalExperience,
            level: newLevel,
          });
      }

      // Log transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: totalCredits,
          transaction_type: 'earn',
          action_type: 'checkin',
          description: `Ежедневный чекин (день ${newStreak})`,
          metadata: { streak: newStreak, experience_earned: totalExperience },
        });

      return { credits: totalCredits, streak: newStreak, experience: totalExperience };
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
    onError: (error) => {
      if (error.message === 'Вы уже отметились сегодня') {
        toast.info(error.message);
      } else {
        toast.error('Ошибка чекина');
      }
    },
  });
}

export function useRewardAction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      actionType, 
      customCredits, 
      customExperience,
      description,
      metadata 
    }: { 
      actionType: keyof typeof ACTION_REWARDS;
      customCredits?: number;
      customExperience?: number;
      description?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const reward = ACTION_REWARDS[actionType];
      const credits = customCredits ?? reward.credits;
      const experience = customExperience ?? reward.experience;

      // Get current user credits
      const { data: currentCredits } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const newExperience = (currentCredits?.experience || 0) + experience;
      const newLevel = getLevelFromExperience(newExperience);

      // Update credits
      if (currentCredits) {
        await supabase
          .from('user_credits')
          .update({
            balance: currentCredits.balance + credits,
            total_earned: currentCredits.total_earned + credits,
            experience: newExperience,
            level: newLevel,
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            balance: credits,
            total_earned: credits,
            experience: experience,
            level: newLevel,
          });
      }

      // Log transaction
      if (credits > 0) {
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: user.id,
            amount: credits,
            transaction_type: 'earn',
            action_type: actionType,
            description: description || reward.description,
            metadata: { ...metadata, experience_earned: experience },
          });
      }

      return { credits, experience };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      queryClient.invalidateQueries({ queryKey: ['credit-transactions'] });
    },
  });
}

export function useCanCheckinToday() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['can-checkin-today', user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id) return false;

      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('user_checkins')
        .select('id')
        .eq('user_id', user.id)
        .eq('checkin_date', today)
        .maybeSingle();

      return !data;
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

export function useRewardShare() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ trackId }: { trackId: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('reward-action', {
        body: {
          userId: user.id,
          actionType: 'share',
          metadata: { trackId },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      queryClient.invalidateQueries({ queryKey: ['credit-transactions'] });
    },
  });
}
