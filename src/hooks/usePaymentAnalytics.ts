/**
 * usePaymentAnalytics Hook
 * Fetches payment and revenue analytics for admin dashboard
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentAnalytics {
  total_revenue_usd: number;
  total_stars_collected: number;
  total_transactions: number;
  completed_transactions: number;
  conversion_rate: number;
  avg_transaction_stars: number;
  unique_buyers: number;
  repeat_buyer_rate: number;
  revenue_by_day: Array<{
    day: string;
    stars: number;
    usd: number;
    transactions: number;
  }>;
  top_products: Array<{
    product_code: string;
    sales: number;
    total_stars: number;
    total_credits: number;
  }>;
  subscription_breakdown: Array<{
    product_code: string;
    active_count: number;
    revenue_stars: number;
  }>;
}

export interface GamificationAnalytics {
  total_users: number;
  active_users: number;
  avg_level: number;
  max_level: number;
  total_experience: number;
  total_credits_earned: number;
  total_credits_spent: number;
  level_distribution: Record<string, number>;
  top_achievers: Array<{
    user_id: string;
    username: string;
    level: number;
    experience: number;
    total_earned: number;
    achievements: number;
  }>;
  checkin_stats: {
    total_checkins: number;
    unique_users: number;
    avg_streak: number;
    max_streak: number;
    by_day_of_week: Record<string, number>;
  };
  achievement_popularity: Array<{
    code: string;
    name: string;
    unlocked_count: number;
    credits_reward: number;
    experience_reward: number;
  }>;
}

// Query keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  payment: (period: string) => [...analyticsKeys.all, 'payment', period] as const,
  gamification: (period: string) => [...analyticsKeys.all, 'gamification', period] as const,
};

/**
 * Fetch payment analytics
 */
export function usePaymentAnalytics(period: '7 days' | '30 days' | '90 days' = '30 days') {
  return useQuery({
    queryKey: analyticsKeys.payment(period),
    queryFn: async (): Promise<PaymentAnalytics> => {
      const { data, error } = await supabase.rpc('get_payment_analytics', {
        _time_period: period,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Data comes as a single row
      const row = Array.isArray(data) ? data[0] : data;
      
      return {
        total_revenue_usd: Number(row?.total_revenue_usd) || 0,
        total_stars_collected: Number(row?.total_stars_collected) || 0,
        total_transactions: Number(row?.total_transactions) || 0,
        completed_transactions: Number(row?.completed_transactions) || 0,
        conversion_rate: Number(row?.conversion_rate) || 0,
        avg_transaction_stars: Number(row?.avg_transaction_stars) || 0,
        unique_buyers: Number(row?.unique_buyers) || 0,
        repeat_buyer_rate: Number(row?.repeat_buyer_rate) || 0,
        revenue_by_day: (row?.revenue_by_day as PaymentAnalytics['revenue_by_day']) || [],
        top_products: (row?.top_products as PaymentAnalytics['top_products']) || [],
        subscription_breakdown: (row?.subscription_breakdown as PaymentAnalytics['subscription_breakdown']) || [],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Fetch gamification analytics
 */
export function useGamificationAnalytics(period: '7 days' | '30 days' | '90 days' = '30 days') {
  return useQuery({
    queryKey: analyticsKeys.gamification(period),
    queryFn: async (): Promise<GamificationAnalytics> => {
      const { data, error } = await supabase.rpc('get_gamification_analytics', {
        _time_period: period,
      });

      if (error) {
        throw new Error(error.message);
      }

      const row = Array.isArray(data) ? data[0] : data;
      
      return {
        total_users: Number(row?.total_users) || 0,
        active_users: Number(row?.active_users) || 0,
        avg_level: Number(row?.avg_level) || 1,
        max_level: Number(row?.max_level) || 1,
        total_experience: Number(row?.total_experience) || 0,
        total_credits_earned: Number(row?.total_credits_earned) || 0,
        total_credits_spent: Number(row?.total_credits_spent) || 0,
        level_distribution: (row?.level_distribution as Record<string, number>) || {},
        top_achievers: (row?.top_achievers as GamificationAnalytics['top_achievers']) || [],
        checkin_stats: (row?.checkin_stats as GamificationAnalytics['checkin_stats']) || {
          total_checkins: 0,
          unique_users: 0,
          avg_streak: 0,
          max_streak: 0,
          by_day_of_week: {},
        },
        achievement_popularity: (row?.achievement_popularity as GamificationAnalytics['achievement_popularity']) || [],
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Get quick stats summary
 */
export function useQuickPaymentStats() {
  return useQuery({
    queryKey: ['quick-payment-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_stars_payment_stats');

      if (error) {
        throw new Error(error.message);
      }

      const row = Array.isArray(data) ? data[0] : data;
      
      return {
        total_transactions: row?.total_transactions || 0,
        completed_transactions: row?.completed_transactions || 0,
        total_stars: row?.total_stars_collected || 0,
        total_credits: row?.total_credits_granted || 0,
        active_subscriptions: row?.active_subscriptions || 0,
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
