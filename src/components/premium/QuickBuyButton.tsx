/**
 * QuickBuyButton - Floating CTA for credits purchase
 * Shows when balance is low, prompts subscription upgrade
 */

import { useState, memo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Coins, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useCreditsLimits } from '@/hooks/useCreditsLimits';
import { useTelegram } from '@/contexts/TelegramContext';
import { SubscriptionUpgradePopup } from '@/components/popups/SubscriptionUpgradePopup';
import { cn } from '@/lib/utils';

interface QuickBuyButtonProps {
  /** Balance threshold to show the button */
  threshold?: number;
  /** Custom class name */
  className?: string;
}

export const QuickBuyButton = memo(function QuickBuyButton({
  threshold = 30,
  className,
}: QuickBuyButtonProps) {
  const { balance, isLoading, isAdmin } = useUserCredits();
  const { isFreeUser, isBalanceLimitReached } = useCreditsLimits();
  const { hapticFeedback } = useTelegram();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show for admins, when loading, or if dismissed
  if (isLoading || isAdmin || isDismissed) {
    return null;
  }

  // Show only when balance is low
  const showButton = balance < threshold && !isBalanceLimitReached;

  if (!showButton) {
    return null;
  }

  const handleClick = () => {
    hapticFeedback?.('medium');
    setIsOpen(true);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback?.('light');
    setIsDismissed(true);
  };

  const balanceColor = balance < 10 
    ? 'text-destructive' 
    : balance < 20 
      ? 'text-amber-500' 
      : 'text-primary';

  return (
    <>
      <AnimatePresence>
        {showButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={cn(
              "fixed right-4 z-40",
              // Position above bottom navigation
              "bottom-[calc(var(--island-nav-height,80px)+1rem)]",
              className
            )}
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-destructive/10 transition-colors"
                aria-label="Скрыть"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>

              {/* Main button */}
              <Button
                onClick={handleClick}
                size="lg"
                className={cn(
                  "rounded-full shadow-lg gap-2 px-4",
                  "bg-gradient-to-r from-primary to-purple-600",
                  "hover:from-primary/90 hover:to-purple-600/90",
                  "border border-primary/30"
                )}
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Coins className="w-5 h-5" />
                </motion.div>
                <span className={cn("font-bold", balanceColor)}>
                  {balance}
                </span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </Button>

              {/* Pulsing indicator for very low balance */}
              {balance < 10 && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-destructive/30"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscription upgrade popup */}
      <SubscriptionUpgradePopup
        open={isOpen}
        onClose={() => setIsOpen(false)}
        reason={isFreeUser ? 'balance_limit' : 'general'}
      />
    </>
  );
});
