/**
 * useReferrals Hook
 * Manages referral system functionality
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { ECONOMY } from '@/lib/economy';
import { toast } from 'sonner';

export interface ReferralStats {
  referralCode: string;
  referralCount: number;
  referralEarnings: number;
  referredBy: string | null;
}

export interface ReferralReward {
  id: string;
  referrer_id: string;
  referred_id: string;
  stars_amount: number;
  credits_reward: number;
  reward_percent: number;
  status: 'pending' | 'credited' | 'failed';
  created_at: string;
}

// Query keys
export const referralKeys = {
  all: ['referrals'] as const,
  stats: (userId: string) => [...referralKeys.all, 'stats', userId] as const,
  rewards: (userId: string) => [...referralKeys.all, 'rewards', userId] as const,
};

/**
 * Get current user's referral stats
 */
export function useReferralStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: referralKeys.stats(user?.id ?? ''),
    queryFn: async (): Promise<ReferralStats | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_credits')
        .select('referral_code, referral_count, referral_earnings, referred_by')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(error.message);
      }

      return {
        referralCode: data.referral_code || '',
        referralCount: data.referral_count || 0,
        referralEarnings: data.referral_earnings || 0,
        referredBy: data.referred_by,
      };
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });
}

/**
 * Get referral rewards history
 */
export function useReferralRewards(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...referralKeys.rewards(user?.id ?? ''), limit],
    queryFn: async (): Promise<ReferralReward[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map(item => ({
        id: item.id,
        referrer_id: item.referrer_id,
        referred_id: item.referred_id,
        stars_amount: item.stars_amount,
        credits_reward: item.credits_reward,
        reward_percent: item.reward_percent ?? ECONOMY.REFERRAL_PERCENT,
        status: (item.status ?? 'pending') as 'pending' | 'credited' | 'failed',
        created_at: item.created_at ?? new Date().toISOString(),
      }));
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });
}

/**
 * Apply referral code (for new users)
 */
export function useApplyReferralCode() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (referralCode: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Check if user already has a referrer
      const { data: existing } = await supabase
        .from('user_credits')
        .select('referred_by')
        .eq('user_id', user.id)
        .single();

      if (existing?.referred_by) {
        throw new Error('Вы уже использовали реферальный код');
      }

      // Find referrer by code
      const { data: referrer, error: referrerError } = await supabase
        .from('user_credits')
        .select('user_id, referral_count, balance, total_earned')
        .eq('referral_code', referralCode.toUpperCase())
        .single();

      if (referrerError || !referrer) {
        throw new Error('Реферальный код не найден');
      }

      if (referrer.user_id === user.id) {
        throw new Error('Нельзя использовать свой собственный код');
      }

      // Apply referral
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({ referred_by: referrer.user_id })
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update referrer's count
      await supabase
        .from('user_credits')
        .update({ referral_count: (referrer.referral_count || 0) + 1 })
        .eq('user_id', referrer.user_id);

      // Give bonus credits to new user
      const { data: userCredits } = await supabase
        .from('user_credits')
        .select('balance, total_earned')
        .eq('user_id', user.id)
        .single();

      await supabase
        .from('user_credits')
        .update({
          balance: (userCredits?.balance || 0) + ECONOMY.REFERRAL_NEW_USER_BONUS,
          total_earned: (userCredits?.total_earned || 0) + ECONOMY.REFERRAL_NEW_USER_BONUS,
        })
        .eq('user_id', user.id);

      // Log transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: ECONOMY.REFERRAL_NEW_USER_BONUS,
          transaction_type: 'earn',
          action_type: 'referral_bonus',
          description: 'Бонус за использование реферального кода',
        });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.all });
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      toast.success('Реферальный код применён!', {
        description: `+${ECONOMY.REFERRAL_NEW_USER_BONUS} кредитов`,
      });
    },
    onError: (error: Error) => {
      toast.error('Ошибка', { description: error.message });
    },
  });
}

/**
 * Generate referral link
 */
export function useReferralLink() {
  const { data: stats } = useReferralStats();
  
  if (!stats?.referralCode) return null;
  
  const botUsername = 'MusicVerseBot';
  return `https://t.me/${botUsername}?start=ref_${stats.referralCode}`;
}

/**
 * Share referral link
 */
export function useShareReferral() {
  const referralLink = useReferralLink();
  
  return {
    link: referralLink,
    share: async () => {
      if (!referralLink) return;
      
      const text = `🎵 Присоединяйся к MusicVerse и получи ${ECONOMY.REFERRAL_NEW_USER_BONUS} бонусных кредитов!\n\n${referralLink}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'MusicVerse - AI Music Creation',
            text,
            url: referralLink,
          });
        } catch {
          await navigator.clipboard.writeText(referralLink);
          toast.success('Ссылка скопирована!');
        }
      } else {
        await navigator.clipboard.writeText(referralLink);
        toast.success('Ссылка скопирована!');
      }
    },
  };
}
