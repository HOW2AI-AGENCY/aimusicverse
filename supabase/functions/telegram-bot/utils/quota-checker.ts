/**
 * User Quota Checker
 * Validates if user has sufficient credits or active subscription
 */

import { getSupabaseClient } from '../core/supabase-client.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('quota-checker');
const supabase = getSupabaseClient();

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  creditsBalance?: number;
  subscriptionTier?: string;
  subscriptionExpires?: string;
}

/**
 * Operation costs in credits
 */
export const OPERATION_COSTS = {
  generate_music: 5,
  upload_cover: 5,
  upload_extend: 5,
  analyze_audio: 2,
  transcribe_midi: 3,
  separate_stems: 4,
  generate_cover: 3,
} as const;

export type OperationType = keyof typeof OPERATION_COSTS;

/**
 * Check if user has sufficient quota for operation
 */
export async function checkUserQuota(
  userId: string,
  operationType: OperationType
): Promise<QuotaCheckResult> {
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits_balance, subscription_tier, subscription_expires_at')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      logger.error('Failed to fetch user profile', profileError);
      return {
        allowed: false,
        reason: 'Профиль не найден',
      };
    }

    const creditsBalance = profile.credits_balance || 0;
    const subscriptionTier = profile.subscription_tier;
    const subscriptionExpires = profile.subscription_expires_at;

    // Check if user has active subscription
    const hasActiveSubscription = subscriptionTier &&
      subscriptionTier !== 'free' &&
      subscriptionExpires &&
      new Date(subscriptionExpires) > new Date();

    // Users with active premium/enterprise subscriptions have unlimited operations
    if (hasActiveSubscription) {
      logger.info('Quota check passed: active subscription', {
        userId,
        tier: subscriptionTier,
        operation: operationType,
      });

      return {
        allowed: true,
        creditsBalance,
        subscriptionTier,
        subscriptionExpires,
      };
    }

    // Check credit balance for free tier users
    const operationCost = OPERATION_COSTS[operationType];

    if (creditsBalance < operationCost) {
      logger.warn('Quota check failed: insufficient credits', {
        userId,
        balance: creditsBalance,
        required: operationCost,
        operation: operationType,
      });

      return {
        allowed: false,
        reason: `Недостаточно кредитов. Нужно: ${operationCost}, доступно: ${creditsBalance}`,
        creditsBalance,
      };
    }

    // User has sufficient credits
    logger.info('Quota check passed: sufficient credits', {
      userId,
      balance: creditsBalance,
      cost: operationCost,
      operation: operationType,
    });

    return {
      allowed: true,
      creditsBalance,
      subscriptionTier,
    };

  } catch (error) {
    logger.error('Error checking user quota', error);
    return {
      allowed: false,
      reason: 'Ошибка проверки квоты',
    };
  }
}

/**
 * Deduct credits from user balance
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    // Record transaction
    const { error } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: -amount, // Negative for deduction
        action_type: 'usage',
        description,
        metadata,
      });

    if (error) {
      logger.error('Failed to deduct credits', error);
      return false;
    }

    logger.info('Credits deducted', {
      userId,
      amount,
      description,
    });

    return true;
  } catch (error) {
    logger.error('Error deducting credits', error);
    return false;
  }
}

/**
 * Check quota and deduct credits in one transaction
 */
export async function checkAndDeductQuota(
  userId: string,
  operationType: OperationType,
  metadata?: Record<string, unknown>
): Promise<QuotaCheckResult> {
  const quotaCheck = await checkUserQuota(userId, operationType);

  if (!quotaCheck.allowed) {
    return quotaCheck;
  }

  // Skip deduction for users with active subscription
  if (quotaCheck.subscriptionTier && quotaCheck.subscriptionTier !== 'free') {
    return quotaCheck;
  }

  // Deduct credits for free tier users
  const cost = OPERATION_COSTS[operationType];
  const success = await deductCredits(
    userId,
    cost,
    `Bot operation: ${operationType}`,
    metadata
  );

  if (!success) {
    return {
      allowed: false,
      reason: 'Ошибка списания кредитов',
    };
  }

  return {
    ...quotaCheck,
    creditsBalance: (quotaCheck.creditsBalance || 0) - cost,
  };
}
