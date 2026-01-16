/**
 * Server-side Feature Access Validation
 * 
 * Validates user access to features in Edge Functions
 * Checks subscription status and tier requirements
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from './logger.ts';

const logger = createLogger('check-feature-access');

// Tier hierarchy for comparison
const TIER_HIERARCHY: Record<string, number> = {
  'free': 0,
  'basic': 1,
  'pro': 2,
  'premium': 3,
  'enterprise': 4,
};

interface FeatureAccessResult {
  hasAccess: boolean;
  effectiveTier: string;
  requiredTier: string | null;
  subscriptionExpired: boolean;
  isAdmin: boolean;
  creditsPerUse: number;
  error?: string;
}

interface SubscriptionStatus {
  tier: string;
  isActive: boolean;
  expiresAt: string | null;
}

/**
 * Get user's subscription status from database
 */
export async function getSubscriptionStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionStatus> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_expires_at')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      logger.warn('Failed to get subscription status', { userId, error });
      return { tier: 'free', isActive: false, expiresAt: null };
    }

    const expiresAt = data.subscription_expires_at;
    const isActive = expiresAt ? new Date(expiresAt) > new Date() : false;
    const tier = data.subscription_tier || 'free';

    return { tier, isActive, expiresAt };
  } catch (err) {
    logger.error('Subscription status error', { userId, error: err });
    return { tier: 'free', isActive: false, expiresAt: null };
  }
}

/**
 * Check if user is admin via user_roles table
 */
export async function checkIsAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    return !!data && !error;
  } catch {
    return false;
  }
}

/**
 * Get feature permission from database
 */
async function getFeaturePermission(
  supabase: SupabaseClient,
  featureKey: string
): Promise<{ min_tier: string; is_admin_only: boolean; credits_per_use: number } | null> {
  try {
    const { data, error } = await supabase
      .from('feature_permissions')
      .select('min_tier, is_admin_only, credits_per_use')
      .eq('feature_key', featureKey)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Validate user access to a specific feature (server-side)
 * 
 * CRITICAL: This function checks if subscription is ACTIVE before granting access.
 * Expired subscriptions are treated as 'free' tier.
 */
export async function validateFeatureAccess(
  supabase: SupabaseClient,
  userId: string,
  featureKey: string
): Promise<FeatureAccessResult> {
  try {
    // Check admin status first
    const isAdmin = await checkIsAdmin(supabase, userId);
    if (isAdmin) {
      return {
        hasAccess: true,
        effectiveTier: 'admin',
        requiredTier: null,
        subscriptionExpired: false,
        isAdmin: true,
        creditsPerUse: 0,
      };
    }

    // Get subscription status
    const { tier, isActive, expiresAt } = await getSubscriptionStatus(supabase, userId);

    // CRITICAL: If subscription is not active, treat as 'free' tier
    const subscriptionExpired = !isActive && tier !== 'free';
    const effectiveTier = subscriptionExpired ? 'free' : tier;

    // Get feature permission
    const permission = await getFeaturePermission(supabase, featureKey);

    // No permission found means feature is open
    if (!permission) {
      return {
        hasAccess: true,
        effectiveTier,
        requiredTier: null,
        subscriptionExpired,
        isAdmin: false,
        creditsPerUse: 0,
      };
    }

    // Admin-only feature
    if (permission.is_admin_only) {
      return {
        hasAccess: false,
        effectiveTier,
        requiredTier: 'admin',
        subscriptionExpired,
        isAdmin: false,
        creditsPerUse: permission.credits_per_use,
      };
    }

    // Check tier hierarchy
    const userTierLevel = TIER_HIERARCHY[effectiveTier] ?? 0;
    const requiredTierLevel = TIER_HIERARCHY[permission.min_tier] ?? 0;
    const hasAccess = userTierLevel >= requiredTierLevel;

    logger.info('Feature access check', {
      userId,
      featureKey,
      tier,
      effectiveTier,
      requiredTier: permission.min_tier,
      hasAccess,
      subscriptionExpired,
      expiresAt,
    });

    return {
      hasAccess,
      effectiveTier,
      requiredTier: hasAccess ? null : permission.min_tier,
      subscriptionExpired,
      isAdmin: false,
      creditsPerUse: permission.credits_per_use,
    };
  } catch (error: any) {
    logger.error('Feature access validation error', { userId, featureKey, error: error.message });
    return {
      hasAccess: false,
      effectiveTier: 'free',
      requiredTier: null,
      subscriptionExpired: false,
      isAdmin: false,
      creditsPerUse: 0,
      error: error.message,
    };
  }
}

/**
 * Middleware-style access check for Edge Functions
 * Returns Response if access denied, null if access granted
 */
export async function requireFeatureAccess(
  supabase: SupabaseClient,
  userId: string,
  featureKey: string,
  corsHeaders: Record<string, string> = {}
): Promise<Response | null> {
  const result = await validateFeatureAccess(supabase, userId, featureKey);

  if (!result.hasAccess) {
    const message = result.subscriptionExpired
      ? 'Subscription expired. Please renew to access this feature.'
      : result.requiredTier === 'admin'
        ? 'This feature is admin-only.'
        : `This feature requires ${result.requiredTier} subscription.`;

    return new Response(
      JSON.stringify({
        error: 'Access denied',
        message,
        requiredTier: result.requiredTier,
        subscriptionExpired: result.subscriptionExpired,
      }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return null;
}
