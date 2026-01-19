/**
 * useCreditsLimits Hook
 * Manages free tier credit limits and upgrade prompts
 */

import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { ECONOMY } from '@/lib/economy';

type SubscriptionTierType = 'free' | 'pro' | 'premium' | 'enterprise';

interface CreditsLimitsData {
  balance: number;
  dailyEarnedToday: number;
  dailyEarnedResetAt: string | null;
  subscriptionTier: SubscriptionTierType;
}

export function useCreditsLimits() {
  const { user } = useAuth();
  const { tier } = useSubscriptionStatus({ 
    userId: user?.id || '', 
    enabled: !!user 
  });

  const subscriptionTier: SubscriptionTierType = tier || 'free';
  const isFreeUser = subscriptionTier === 'free';

  // Fetch current credits and limits
  const { data, isLoading } = useQuery({
    queryKey: ['credits-limits', user?.id],
    queryFn: async (): Promise<CreditsLimitsData> => {
      if (!user?.id) throw new Error('No user');

      const { data: credits, error } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      // Daily earned will be tracked via the new columns after migration
      // For now, we'll use balance only and add daily tracking later
      return {
        balance: credits?.balance ?? 0,
        dailyEarnedToday: 0, // Will be populated after migration runs
        dailyEarnedResetAt: null,
        subscriptionTier,
      };
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  // Check if daily limit is reached (for free users)
  const isDailyLimitReached = useMemo(() => {
    if (!isFreeUser || !data) return false;
    return data.dailyEarnedToday >= ECONOMY.FREE_DAILY_EARN_CAP;
  }, [isFreeUser, data]);

  // Check if balance limit is reached (for free users)
  const isBalanceLimitReached = useMemo(() => {
    if (!isFreeUser || !data) return false;
    return data.balance >= ECONOMY.FREE_MAX_BALANCE;
  }, [isFreeUser, data]);

  // Calculate remaining daily credits
  const remainingDailyCredits = useMemo(() => {
    if (!isFreeUser || !data) return Infinity;
    return Math.max(0, ECONOMY.FREE_DAILY_EARN_CAP - data.dailyEarnedToday);
  }, [isFreeUser, data]);

  // Calculate credits until balance limit
  const creditsUntilBalanceLimit = useMemo(() => {
    if (!isFreeUser || !data) return Infinity;
    return Math.max(0, ECONOMY.FREE_MAX_BALANCE - data.balance);
  }, [isFreeUser, data]);

  // Check if a reward would be capped
  const wouldBeCapped = useCallback((rewardAmount: number): boolean => {
    if (!isFreeUser || !data) return false;
    
    // Check daily limit
    if (data.dailyEarnedToday + rewardAmount > ECONOMY.FREE_DAILY_EARN_CAP) {
      return true;
    }
    
    // Check balance limit
    if (data.balance + rewardAmount > ECONOMY.FREE_MAX_BALANCE) {
      return true;
    }
    
    return false;
  }, [isFreeUser, data]);

  // Calculate actual reward after caps
  const calculateActualReward = useCallback((requestedAmount: number): number => {
    if (!isFreeUser || !data) return requestedAmount;
    
    // Apply daily cap
    let amount = Math.min(
      requestedAmount,
      ECONOMY.FREE_DAILY_EARN_CAP - data.dailyEarnedToday
    );
    
    // Apply balance cap
    amount = Math.min(
      amount,
      ECONOMY.FREE_MAX_BALANCE - data.balance
    );
    
    return Math.max(0, amount);
  }, [isFreeUser, data]);

  return {
    balance: data?.balance ?? 0,
    dailyEarnedToday: data?.dailyEarnedToday ?? 0,
    subscriptionTier,
    isFreeUser,
    isDailyLimitReached,
    isBalanceLimitReached,
    remainingDailyCredits,
    creditsUntilBalanceLimit,
    wouldBeCapped,
    calculateActualReward,
    isLoading,
    
    // Limits for display
    limits: {
      dailyCap: isFreeUser ? ECONOMY.FREE_DAILY_EARN_CAP : null,
      balanceCap: isFreeUser ? ECONOMY.FREE_MAX_BALANCE : null,
    },
  };
}

/**
 * Hook to check if welcome bonus should be shown
 */
export function useWelcomeBonusCheck() {
  const { user } = useAuth();

  const { data: shouldShow, isLoading } = useQuery({
    queryKey: ['welcome-bonus-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      // Check if user has seen the welcome popup
      const welcomeShown = localStorage.getItem(`welcome_bonus_shown_${user.id}`);
      if (welcomeShown) return false;

      // Check if user just registered (within last 5 minutes)
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('action_type', 'registration_bonus')
        .limit(1);

      const credits = transactions?.[0];
      if (!credits?.created_at) return false;

      const registrationTime = new Date(credits.created_at).getTime();
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

      return registrationTime > fiveMinutesAgo;
    },
    enabled: !!user?.id,
    staleTime: Infinity, // Only check once per session
  });

  const markWelcomeBonusShown = useCallback(() => {
    if (user?.id) {
      localStorage.setItem(`welcome_bonus_shown_${user.id}`, 'true');
    }
  }, [user?.id]);

  return {
    shouldShowWelcomeBonus: shouldShow ?? false,
    isLoading,
    markWelcomeBonusShown,
  };
}
