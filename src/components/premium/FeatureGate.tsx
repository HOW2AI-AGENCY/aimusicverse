/**
 * FeatureGate - Conditionally render features based on user access
 * 
 * Usage:
 * <FeatureGate feature="model_v5" fallback={<UpgradePrompt tier="pro" />}>
 *   <PremiumFeature />
 * </FeatureGate>
 */

import { ReactNode } from 'react';
import { useFeatureAccess, FeatureKey } from '@/hooks/useFeatureAccess';
import { UpgradePrompt } from './UpgradePrompt';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
  /** Show loading skeleton while checking access */
  showLoading?: boolean;
  /** Hide completely instead of showing fallback */
  hideIfNoAccess?: boolean;
  /** Additional class for wrapper */
  className?: string;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  showLoading = false,
  hideIfNoAccess = false,
  className,
}: FeatureGateProps) {
  const { hasAccess, isLoading, requiredTier } = useFeatureAccess(feature);

  // Show loading state
  if (isLoading && showLoading) {
    return <Skeleton className={cn("h-10 w-full", className)} />;
  }

  // User has access - render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // No access - hide completely
  if (hideIfNoAccess) {
    return null;
  }

  // No access - show fallback or default upgrade prompt
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className={className}>
      <UpgradePrompt 
        feature={feature} 
        requiredTier={requiredTier || 'pro'} 
        compact 
      />
    </div>
  );
}

/**
 * Premium badge to show feature requires upgrade
 */
interface PremiumBadgeProps {
  tier?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function PremiumBadge({ tier = 'PRO', className, size = 'sm' }: PremiumBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center font-semibold uppercase tracking-wide",
      "bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full",
      size === 'sm' ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
      className
    )}>
      {tier}
    </span>
  );
}

/**
 * Wrapper that adds PRO badge to disabled features
 */
interface FeatureWithBadgeProps {
  feature: FeatureKey;
  children: ReactNode;
  badgePosition?: 'top-right' | 'inline';
  className?: string;
}

export function FeatureWithBadge({ 
  feature, 
  children, 
  badgePosition = 'top-right',
  className 
}: FeatureWithBadgeProps) {
  const { hasAccess, requiredTier } = useFeatureAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)}>
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      {badgePosition === 'top-right' ? (
        <PremiumBadge 
          tier={requiredTier?.toUpperCase() || 'PRO'} 
          className="absolute -top-1 -right-1" 
        />
      ) : (
        <PremiumBadge tier={requiredTier?.toUpperCase() || 'PRO'} className="ml-2" />
      )}
    </div>
  );
}
