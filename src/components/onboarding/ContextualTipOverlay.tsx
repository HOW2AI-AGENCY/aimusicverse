/**
 * ContextualTipOverlay - Auto-showing contextual tips overlay
 * 
 * Phase 4.1: Onboarding integration
 * Shows contextual tips based on page context (library, studio, generation)
 */

import { memo, useEffect, useState } from 'react';
import { AnimatePresence, motion } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAutoShowTip } from '@/hooks/useFeatureTips';
import { useTelegram } from '@/contexts/TelegramContext';

type TipContext = 'library' | 'player' | 'studio' | 'generation' | 'social';

interface ContextualTipOverlayProps {
  context: TipContext;
  /** Delay before showing first tip (ms) */
  delay?: number;
  /** Position of the tip */
  position?: 'top' | 'bottom';
  className?: string;
}

export const ContextualTipOverlay = memo(function ContextualTipOverlay({
  context,
  delay = 2000,
  position = 'bottom',
  className,
}: ContextualTipOverlayProps) {
  const { currentTip, dismissCurrentTip, hasUnseen } = useAutoShowTip(context, delay);
  const { hapticFeedback } = useTelegram();
  const [isClosing, setIsClosing] = useState(false);

  const handleDismiss = () => {
    hapticFeedback('light');
    setIsClosing(true);
    setTimeout(() => {
      dismissCurrentTip(false);
      setIsClosing(false);
    }, 200);
  };

  const handleShowNext = () => {
    hapticFeedback('light');
    setIsClosing(true);
    setTimeout(() => {
      dismissCurrentTip(true);
      setIsClosing(false);
    }, 200);
  };

  if (!currentTip) return null;

  return (
    <AnimatePresence>
      {currentTip && !isClosing && (
        <motion.div
          initial={{ opacity: 0, y: position === 'bottom' ? 20 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === 'bottom' ? 20 : -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            "fixed left-4 right-4 z-40 mx-auto max-w-md",
            position === 'bottom' ? 'bottom-[calc(5rem+env(safe-area-inset-bottom,0px))]' : 'top-20',
            className
          )}
        >
          <div className="relative bg-card/95 backdrop-blur-xl rounded-2xl border border-border/50 shadow-xl overflow-hidden">
            {/* Gradient accent */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
            
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">{currentTip.emoji || '💡'}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    {currentTip.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {currentTip.message}
                  </p>
                </div>

                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-muted/80"
                  aria-label="Закрыть подсказку"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border/30">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-xs text-muted-foreground h-8"
                >
                  Понятно
                </Button>
                {hasUnseen && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleShowNext}
                    className="text-xs h-8 gap-1"
                  >
                    Далее
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

/**
 * Simple hook wrapper for pages that just need the overlay
 */
export function useContextualTips(context: TipContext) {
  return useAutoShowTip(context, 2500);
}

export default ContextualTipOverlay;
