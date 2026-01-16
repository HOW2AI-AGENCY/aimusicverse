/**
 * useFeatureAccess - Hook for checking user access to premium features
 * 
 * Checks against:
 * 1. Admin status (admins bypass all restrictions)
 * 2. Subscription tier (tier-based access)
 * 3. feature_permissions table (feature-specific rules)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';
import { useSubscriptionStatus } from './useSubscriptionStatus';

export type FeatureKey = 
  | 'model_v4'
  | 'model_v4_5all'
  | 'model_v4_5plus'
  | 'model_v5'
  | 'stem_separation_basic'
  | 'stem_separation_detailed'
  | 'section_replace'
  | 'midi_transcription'
  | 'guitar_studio'
  | 'prompt_dj'
  | 'lyrics_ai_agent'
  | 'vocal_recording'
  | 'mastering'
  | 'api_access';

interface FeaturePermission {
  id: string;
  feature_key: string;
  name: Record<string, string>;
  description: string | null;
  min_tier: string;
  is_admin_only: boolean;
  credits_per_use: number;
  daily_limit: number | null;
}

// Tier hierarchy for comparison
const TIER_HIERARCHY: Record<string, number> = {
  'free': 0,
  'basic': 1,
  'pro': 2,
  'premium': 3,
  'enterprise': 4,
};

/**
 * Fetch all feature permissions from DB
 */
export function useFeaturePermissions() {
  return useQuery({
    queryKey: ['feature-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_permissions')
        .select('*');
      
      if (error) throw error;
      return data as FeaturePermission[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Check if user has access to a specific feature
 */
export function useFeatureAccess(featureKey: FeatureKey) {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { tier, isActive } = useSubscriptionStatus({ 
    userId: user?.id || '', 
    enabled: !!user?.id 
  });
  const { data: permissions, isLoading: permissionsLoading } = useFeaturePermissions();

  const isLoading = permissionsLoading;

  // Find the permission for this feature
  const permission = permissions?.find(p => p.feature_key === featureKey);
  
  // Admin always has access
  if (isAdmin) {
    return {
      hasAccess: true,
      isLoading: false,
      requiredTier: null,
      isAdminOnly: false,
      creditsPerUse: permission?.credits_per_use || 0,
      isAdmin: true,
    };
  }

  // No permission found means feature is open
  if (!permission) {
    return {
      hasAccess: true,
      isLoading,
      requiredTier: null,
      isAdminOnly: false,
      creditsPerUse: 0,
      isAdmin: false,
    };
  }

  // Admin-only feature
  if (permission.is_admin_only) {
    return {
      hasAccess: false,
      isLoading,
      requiredTier: 'admin',
      isAdminOnly: true,
      creditsPerUse: permission.credits_per_use,
      isAdmin: false,
    };
  }

  // CRITICAL: If subscription is not active, treat user as 'free' tier
  // This prevents expired subscriptions from accessing premium features
  const effectiveTier = (!isActive && tier !== 'free') ? 'free' : (tier || 'free');
  
  // Check tier hierarchy
  const userTierLevel = TIER_HIERARCHY[effectiveTier] ?? 0;
  const requiredTierLevel = TIER_HIERARCHY[permission.min_tier] ?? 0;
  const hasAccess = userTierLevel >= requiredTierLevel;

  return {
    hasAccess,
    isLoading,
    requiredTier: hasAccess ? null : permission.min_tier,
    isAdminOnly: false,
    creditsPerUse: permission.credits_per_use,
    isAdmin: false,
    // Expose subscription status for UI warnings
    subscriptionExpired: !isActive && tier !== 'free',
  };
}

/**
 * Get all features the user has access to
 */
export function useUserFeatures() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { tier } = useSubscriptionStatus({ 
    userId: user?.id || '', 
    enabled: !!user?.id 
  });
  const { data: permissions, isLoading } = useFeaturePermissions();

  if (isLoading || !permissions) {
    return { features: [], isLoading: true };
  }

  // Admin gets all features
  if (isAdmin) {
    return { 
      features: permissions.map(p => p.feature_key), 
      isLoading: false 
    };
  }

  // CRITICAL: If subscription is not active, treat user as 'free' tier
  const { isActive } = useSubscriptionStatus({ 
    userId: user?.id || '', 
    enabled: !!user?.id 
  });
  const effectiveTier = (!isActive && tier !== 'free') ? 'free' : (tier || 'free');
  const userTierLevel = TIER_HIERARCHY[effectiveTier] ?? 0;
  
  const accessibleFeatures = permissions
    .filter(p => {
      if (p.is_admin_only) return false;
      const requiredLevel = TIER_HIERARCHY[p.min_tier] ?? 0;
      return userTierLevel >= requiredLevel;
    })
    .map(p => p.feature_key);

  return { features: accessibleFeatures, isLoading: false };
}

/**
 * Quick access check without hook (for edge cases)
 * @param isSubscriptionActive - Whether subscription is currently active (not expired)
 */
export function checkFeatureAccess(
  userTier: string,
  isAdmin: boolean,
  featureMinTier: string,
  isFeatureAdminOnly: boolean,
  isSubscriptionActive: boolean = true
): boolean {
  if (isAdmin) return true;
  if (isFeatureAdminOnly) return false;
  
  // CRITICAL: If subscription is not active, treat user as 'free' tier
  const effectiveTier = (!isSubscriptionActive && userTier !== 'free') ? 'free' : (userTier || 'free');
  const userTierLevel = TIER_HIERARCHY[effectiveTier] ?? 0;
  const requiredLevel = TIER_HIERARCHY[featureMinTier] ?? 0;
  
  return userTierLevel >= requiredLevel;
}
