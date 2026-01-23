/**
 * BalanceIndicator - Header balance display with quick buy access
 * Color-coded to show balance status
 */

import { useState, memo } from 'react';
import { motion } from '@/lib/motion';
import { Coins, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useCreditsLimits } from '@/hooks/useCreditsLimits';
import { useTelegram } from '@/contexts/TelegramContext';
import { SubscriptionUpgradePopup } from '@/components/popups/SubscriptionUpgradePopup';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface BalanceIndicatorProps {
  /** Show only icon in compact mode */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

export const BalanceIndicator = memo(function BalanceIndicator({
  compact = false,
  className,
}: BalanceIndicatorProps) {
  const { balance, isLoading, isAdmin, apiBalance } = useUserCredits();
  const { isFreeUser, isBalanceLimitReached } = useCreditsLimits();
  const { hapticFeedback } = useTelegram();
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // For admins, show API balance
  const displayBalance = isAdmin ? (apiBalance ?? 0) : balance;

  const handleClick = () => {
    if (isAdmin) return; // Admins don't need to buy
    hapticFeedback?.('light');
    setIsPopupOpen(true);
  };

  // Determine color based on balance level
  const getBalanceStatus = () => {
    if (isAdmin) {
      return {
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        icon: Wallet,
        label: 'API',
      };
    }
    
    if (displayBalance >= 50) {
      return {
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        icon: TrendingUp,
        label: 'Хорошо',
      };
    }
    
    if (displayBalance >= 20) {
      return {
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        icon: Coins,
        label: 'Мало',
      };
    }
    
    return {
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/30',
      icon: TrendingDown,
      label: 'Критично',
    };
  };

  const status = getBalanceStatus();
  const Icon = status.icon;

  if (isLoading) {
    return (
      <Skeleton className={cn("h-8 w-16 rounded-full", className)} />
    );
  }

  return (
    <>
      <motion.button
        onClick={handleClick}
        disabled={isAdmin}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full",
          "border transition-all duration-200",
          status.bgColor,
          status.borderColor,
          !isAdmin && "hover:scale-105 active:scale-95 cursor-pointer",
          isAdmin && "cursor-default",
          className
        )}
        whileTap={!isAdmin ? { scale: 0.95 } : undefined}
      >
        <motion.div
          animate={displayBalance < 20 && !isAdmin ? { 
            scale: [1, 1.2, 1],
          } : undefined}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Icon className={cn("w-4 h-4", status.color)} />
        </motion.div>
        
        {!compact && (
          <span className={cn("text-sm font-bold tabular-nums", status.color)}>
            {displayBalance.toLocaleString()}
          </span>
        )}

        {/* Balance limit badge for free users */}
        {isFreeUser && isBalanceLimitReached && !compact && (
          <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-500 font-medium">
            MAX
          </span>
        )}
      </motion.button>

      {/* Subscription upgrade popup */}
      <SubscriptionUpgradePopup
        open={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        reason={isFreeUser && isBalanceLimitReached ? 'balance_limit' : 'general'}
      />
    </>
  );
});
