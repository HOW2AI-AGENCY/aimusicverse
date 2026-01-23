/**
 * ProactiveUpsellBanner - Shows after successful generations for free users
 * Encourages upgrade with session-based cooldown
 */

import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Crown, X, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreditsLimits } from '@/hooks/useCreditsLimits';
import { useTelegram } from '@/contexts/TelegramContext';
import { SubscriptionUpgradePopup } from '@/components/popups/SubscriptionUpgradePopup';
import { cn } from '@/lib/utils';

const SESSION_KEY = 'upsell_banner_dismissed';
const MIN_GENERATIONS_TO_SHOW = 3;

interface ProactiveUpsellBannerProps {
  /** Number of successful generations in current session */
  generationCount: number;
  /** Custom class name */
  className?: string;
}

export const ProactiveUpsellBanner = memo(function ProactiveUpsellBanner({
  generationCount,
  className,
}: ProactiveUpsellBannerProps) {
  const { isFreeUser } = useCreditsLimits();
  const { hapticFeedback } = useTelegram();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Check session storage on mount
  useEffect(() => {
    const dismissed = sessionStorage.getItem(SESSION_KEY);
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  // Don't show for paid users or if dismissed
  if (!isFreeUser || isDismissed) {
    return null;
  }

  // Only show after minimum generations
  if (generationCount < MIN_GENERATIONS_TO_SHOW) {
    return null;
  }

  const handleDismiss = () => {
    hapticFeedback?.('light');
    setIsDismissed(true);
    sessionStorage.setItem(SESSION_KEY, 'true');
  };

  const handleUpgrade = () => {
    hapticFeedback?.('medium');
    setIsPopupOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        {!isDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "relative overflow-hidden rounded-xl",
              "bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-purple-500/10",
              "border border-amber-500/30",
              "p-4",
              className
            )}
          >
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50 transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Animated background sparkles */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="absolute top-3 right-12 w-4 h-4 text-amber-500/40" />
              <Sparkles className="absolute bottom-2 left-8 w-3 h-3 text-purple-500/40" />
            </motion.div>

            <div className="flex items-start gap-3">
              {/* Icon */}
              <motion.div
                className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shrink-0"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Crown className="w-5 h-5 text-white" />
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-6">
                <h4 className="font-bold text-sm mb-1">
                  Вам понравилось? 🎵
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Вы создали уже {generationCount} треков! Получите PRO для неограниченного творчества
                </p>

                {/* CTA */}
                <Button
                  size="sm"
                  onClick={handleUpgrade}
                  className={cn(
                    "gap-1.5 h-8",
                    "bg-gradient-to-r from-amber-500 to-orange-500",
                    "hover:from-amber-600 hover:to-orange-600",
                    "text-white font-medium"
                  )}
                >
                  <Crown className="w-3.5 h-3.5" />
                  Получить PRO
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Bonus badge */}
            <motion.div
              className="absolute -top-1 -left-1 px-2 py-0.5 rounded-br-lg rounded-tl-lg bg-purple-500 text-white text-[10px] font-bold"
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              +50% бонус
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscription popup */}
      <SubscriptionUpgradePopup
        open={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        reason="general"
      />
    </>
  );
});
