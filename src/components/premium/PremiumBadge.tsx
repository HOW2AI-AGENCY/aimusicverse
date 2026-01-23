/**
 * PremiumBadge - Small badge indicating feature requires premium
 * Used inline next to feature names/buttons
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { Crown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  /** Tier name to display (PRO, PREMIUM, etc.) */
  tier?: string;
  /** Show lock icon instead of crown */
  showLock?: boolean;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md';
  /** Custom class name */
  className?: string;
  /** Animate on mount */
  animate?: boolean;
}

const sizeClasses = {
  xs: 'text-[9px] px-1 py-0.5 gap-0.5',
  sm: 'text-[10px] px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2 py-1 gap-1',
};

const iconSizes = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
};

export const PremiumBadge = memo(function PremiumBadge({
  tier = 'PRO',
  showLock = false,
  size = 'sm',
  className,
  animate = true,
}: PremiumBadgeProps) {
  const Icon = showLock ? Lock : Crown;
  
  // Color based on tier
  const getColors = () => {
    const upperTier = tier.toUpperCase();
    if (upperTier === 'PREMIUM') {
      return {
        bg: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20',
        border: 'border-purple-500/40',
        text: 'text-purple-500',
      };
    }
    if (upperTier === 'ADMIN') {
      return {
        bg: 'bg-gradient-to-r from-red-500/20 to-orange-500/20',
        border: 'border-red-500/40',
        text: 'text-red-500',
      };
    }
    // Default: PRO
    return {
      bg: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/40',
      text: 'text-amber-500',
    };
  };

  const colors = getColors();

  const badge = (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-bold uppercase",
        "border",
        sizeClasses[size],
        colors.bg,
        colors.border,
        colors.text,
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      {tier}
    </span>
  );

  if (!animate) {
    return badge;
  }

  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="inline-flex"
    >
      {badge}
    </motion.span>
  );
});
