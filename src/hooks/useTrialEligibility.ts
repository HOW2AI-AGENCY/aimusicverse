/**
 * useTrialEligibility Hook
 * Check if user is eligible for free trial
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

const TRIAL_DURATION_DAYS = 3;

interface TrialEligibility {
  isEligible: boolean;
  reason: 'eligible' | 'already_used' | 'has_subscription' | 'too_new';
  trialDays: number;
}

export function useTrialEligibility() {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trial-eligibility', user?.id],
    queryFn: async (): Promise<TrialEligibility> => {
      if (!user?.id) {
        return { isEligible: false, reason: 'too_new', trialDays: TRIAL_DURATION_DAYS };
      }

      // Check if user already has/had a subscription
      const { data: subscriptions, error: subError } = await supabase
        .from('stars_transactions')
        .select('id, product_code, status')
        .eq('user_id', user.id)
        .ilike('product_code', '%sub_%')
        .limit(1);

      if (subError) {
        logger.warn('Error checking subscription history', { error: subError });
        return { isEligible: false, reason: 'has_subscription', trialDays: TRIAL_DURATION_DAYS };
      }

      // If has any subscription history, not eligible for trial
      if (subscriptions && subscriptions.length > 0) {
        return { isEligible: false, reason: 'already_used', trialDays: TRIAL_DURATION_DAYS };
      }

      // Check if user has at least 1 completed generation (shows engagement)
      const { count: genCount } = await supabase
        .from('generation_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');

      // User needs at least 1 generation to be eligible
      if (!genCount || genCount < 1) {
        return { isEligible: false, reason: 'too_new', trialDays: TRIAL_DURATION_DAYS };
      }

      // Trial tracking stored in localStorage for simplicity
      // (user_credits.metadata doesn't exist in current schema)
      const trialUsedKey = `trial_used_${user.id}`;
      const trialUsed = localStorage.getItem(trialUsedKey);
      
      if (trialUsed) {
        return { isEligible: false, reason: 'already_used', trialDays: TRIAL_DURATION_DAYS };
      }

      return { isEligible: true, reason: 'eligible', trialDays: TRIAL_DURATION_DAYS };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    isEligible: data?.isEligible ?? false,
    reason: data?.reason ?? 'too_new',
    trialDays: data?.trialDays ?? TRIAL_DURATION_DAYS,
    isLoading,
    refetch,
  };
}

/**
 * Activate trial subscription
 */
export async function activateTrial(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Call edge function to activate trial
    const { data, error } = await supabase.functions.invoke('stars-subscription-check', {
      body: {
        userId,
        action: 'activate_trial',
        trialDays: TRIAL_DURATION_DAYS,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Failed to activate trial' };
    }

    // Mark trial as used in localStorage
    const trialUsedKey = `trial_used_${userId}`;
    localStorage.setItem(trialUsedKey, Date.now().toString());

    return { success: true };
  } catch (error) {
    logger.error('Trial activation error', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Unexpected error' };
  }
}
