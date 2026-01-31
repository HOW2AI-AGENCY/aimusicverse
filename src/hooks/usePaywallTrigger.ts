/**
 * usePaywallTrigger Hook
 * Smart paywall trigger system for subscription conversion
 * 
 * Triggers:
 * 1. After 3rd generation (soft upsell)
 * 2. On PRO feature access attempt
 * 3. On daily/balance limit reached
 * 4. After 7th generation (hard upsell)
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { logger } from '@/lib/logger';

// Trigger thresholds
const SOFT_TRIGGER_GENERATIONS = 3;
const HARD_TRIGGER_GENERATIONS = 7;
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export type PaywallTriggerReason = 
  | 'soft_upsell'      // After 3rd generation
  | 'hard_upsell'      // After 7th generation  
  | 'feature_locked'   // PRO feature attempt
  | 'balance_limit'    // Max balance reached
  | 'daily_limit'      // Daily earn cap reached
  | 'credits_low';     // Low on credits

interface PaywallState {
  shouldShow: boolean;
  reason: PaywallTriggerReason | null;
  generationCount: number;
  lastShownAt: number | null;
}

interface UsePaywallTriggerOptions {
  enabled?: boolean;
}

const STORAGE_KEY = 'paywall_last_shown';

function getLastShownAt(userId: string): number | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
}

function setLastShownAt(userId: string): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, Date.now().toString());
  } catch {
    // Ignore storage errors
  }
}

export function usePaywallTrigger(options: UsePaywallTriggerOptions = {}) {
  const { enabled = true } = options;
  const { user } = useAuth();
  const { hasSubscription, isLoading: subscriptionLoading } = useSubscriptionStatus({
    userId: user?.id || '',
    enabled: !!user?.id,
  });

  // Fetch user's generation count
  const { data: generationData, isLoading: generationLoading } = useQuery({
    queryKey: ['user-generation-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return { count: 0 };

      const { count, error } = await supabase
        .from('generation_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (error) {
        logger.error('Failed to fetch generation count', error);
        return { count: 0 };
      }

      return { count: count || 0 };
    },
    enabled: !!user?.id && enabled,
    staleTime: 60 * 1000, // 1 minute
  });

  const generationCount = generationData?.count || 0;
  const lastShownAt = user?.id ? getLastShownAt(user.id) : null;
  const isInCooldown = lastShownAt ? Date.now() - lastShownAt < COOLDOWN_MS : false;

  // Determine if paywall should be triggered automatically
  const autoTriggerState = useMemo((): PaywallState => {
    // Don't trigger if user has subscription or still loading
    if (hasSubscription || subscriptionLoading || generationLoading) {
      return { shouldShow: false, reason: null, generationCount, lastShownAt };
    }

    // Don't trigger if in cooldown
    if (isInCooldown) {
      return { shouldShow: false, reason: null, generationCount, lastShownAt };
    }

    // Hard trigger at 7 generations
    if (generationCount >= HARD_TRIGGER_GENERATIONS) {
      return { 
        shouldShow: true, 
        reason: 'hard_upsell', 
        generationCount, 
        lastShownAt 
      };
    }

    // Soft trigger at 3 generations
    if (generationCount >= SOFT_TRIGGER_GENERATIONS) {
      return { 
        shouldShow: true, 
        reason: 'soft_upsell', 
        generationCount, 
        lastShownAt 
      };
    }

    return { shouldShow: false, reason: null, generationCount, lastShownAt };
  }, [hasSubscription, subscriptionLoading, generationLoading, generationCount, lastShownAt, isInCooldown]);

  // Manual trigger function for specific reasons
  const triggerPaywall = useCallback((reason: PaywallTriggerReason): boolean => {
    if (hasSubscription) {
      return false; // User already subscribed
    }

    // Log the trigger
    logger.info('Paywall triggered', { 
      reason, 
      generationCount, 
      userId: user?.id 
    });

    return true;
  }, [hasSubscription, generationCount, user?.id]);

  // Mark paywall as shown (reset cooldown)
  const markPaywallShown = useCallback(() => {
    if (user?.id) {
      setLastShownAt(user.id);
      logger.info('Paywall shown', { userId: user.id });
    }
  }, [user?.id]);

  // Check if should trigger for a specific feature
  const shouldTriggerForFeature = useCallback((featureKey: string): boolean => {
    if (hasSubscription) return false;
    
    // Always trigger for PRO features on free tier
    return true;
  }, [hasSubscription]);

  return {
    // Auto trigger state
    ...autoTriggerState,
    
    // Loading states
    isLoading: subscriptionLoading || generationLoading,
    
    // User state
    hasSubscription,
    isFreeUser: !hasSubscription,
    
    // Actions
    triggerPaywall,
    markPaywallShown,
    shouldTriggerForFeature,
    
    // Cooldown info
    isInCooldown,
    cooldownEndsAt: lastShownAt ? lastShownAt + COOLDOWN_MS : null,
  };
}

/**
 * Hook to check if paywall should show after a specific action
 */
export function usePaywallAfterAction(actionType: 'generation' | 'feature_use') {
  const { 
    generationCount, 
    isFreeUser, 
    markPaywallShown,
    isInCooldown 
  } = usePaywallTrigger();

  const shouldShowAfterAction = useMemo(() => {
    if (!isFreeUser || isInCooldown) return false;

    if (actionType === 'generation') {
      // Show after specific generation counts
      return generationCount === SOFT_TRIGGER_GENERATIONS || 
             generationCount === HARD_TRIGGER_GENERATIONS;
    }

    return false;
  }, [isFreeUser, isInCooldown, actionType, generationCount]);

  return {
    shouldShowAfterAction,
    markPaywallShown,
    generationCount,
  };
}
