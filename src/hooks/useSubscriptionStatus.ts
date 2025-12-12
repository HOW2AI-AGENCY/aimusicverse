/**
 * useSubscriptionStatus Hook
 * Fetches and caches user subscription status with auto-refresh
 */

import { useQuery } from '@tanstack/react-query';
import { getSubscriptionStatus } from '@/services/starsPaymentService';
import type { SubscriptionStatusResponse } from '@/types/starsPayment';

// Query key factory
export const subscriptionKeys = {
  all: ['subscription'] as const,
  status: (userId: string) => [...subscriptionKeys.all, 'status', userId] as const,
};

interface UseSubscriptionStatusOptions {
  userId: string;
  enabled?: boolean;
}

/**
 * Fetch user's subscription status
 * Auto-refreshes every 60s if near expiry (< 7 days remaining)
 */
export function useSubscriptionStatus({ userId, enabled = true }: UseSubscriptionStatusOptions) {
  const query = useQuery({
    queryKey: subscriptionKeys.status(userId),
    queryFn: () => getSubscriptionStatus(userId),
    enabled: enabled && !!userId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    // Auto-refresh every 60s if subscription is expiring soon
    refetchInterval: (query) => {
      const data = query.state.data as SubscriptionStatusResponse | undefined;
      if (!data?.subscription) return false;

      const { days_remaining, is_active } = data.subscription;
      if (is_active && days_remaining !== null && days_remaining < 7) {
        return 60 * 1000; // 60 seconds
      }
      return false;
    },
  });

  return {
    ...query,
    subscription: query.data?.subscription,
    hasSubscription: query.data?.subscription.has_subscription ?? false,
    isActive: query.data?.subscription.is_active ?? false,
    tier: query.data?.subscription.tier ?? 'free',
    expiresAt: query.data?.subscription.expires_at,
    daysRemaining: query.data?.subscription.days_remaining,
    autoRenew: query.data?.subscription.auto_renew,
  };
}

/**
 * Check if user has an active subscription
 */
export function useHasActiveSubscription(userId: string) {
  const { hasSubscription, isActive, isLoading } = useSubscriptionStatus({ userId });
  return {
    hasActive: hasSubscription && isActive,
    isLoading,
  };
}

/**
 * Check if subscription is expiring soon (< 7 days)
 */
export function useIsSubscriptionExpiring(userId: string) {
  const { isActive, daysRemaining, isLoading } = useSubscriptionStatus({ userId });
  return {
    isExpiring: isActive && daysRemaining !== null && daysRemaining < 7,
    daysRemaining,
    isLoading,
  };
}
