/**
 * QuickTipToast - Lightweight contextual tip notification
 * 
 * Non-intrusive toast-style tip that appears at bottom of screen
 * Auto-dismisses after a few seconds
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { X, Lightbulb, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useHintTracking } from '@/hooks/useHintTracking';

interface QuickTipToastProps {
  tipId: string;
  message: string;
  emoji?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  position?: 'bottom' | 'top';
  className?: string;
}

export function QuickTipToast({
  tipId,
  message,
  emoji = '💡',
  action,
  duration = 5000,
  position = 'bottom',
  className
}: QuickTipToastProps) {
  const { hasSeenHint, markAsSeen } = useHintTracking(tipId);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!hasSeenHint) {
      // Delay appearance slightly for smoother UX
      const showTimer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(showTimer);
    }
  }, [hasSeenHint]);

  useEffect(() => {
    if (isVisible && duration > 0) {
      const hideTimer = setTimeout(() => {
        handleDismiss();
      }, duration);
      return () => clearTimeout(hideTimer);
    }
  }, [isVisible, duration]);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      markAsSeen();
    }, 300);
  }, [markAsSeen]);

  const handleAction = useCallback(() => {
    action?.onClick();
    handleDismiss();
  }, [action, handleDismiss]);

  if (hasSeenHint || !isVisible) return null;

  const positionClasses = {
    bottom: 'bottom-20 left-4 right-4',
    top: 'top-20 left-4 right-4'
  };

  const animationVariants = {
    initial: position === 'bottom' 
      ? { opacity: 0, y: 20, scale: 0.95 }
      : { opacity: 0, y: -20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: position === 'bottom'
      ? { opacity: 0, y: 10, scale: 0.95 }
      : { opacity: 0, y: -10, scale: 0.95 }
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          className={cn(
            "fixed z-50 max-w-sm mx-auto",
            positionClasses[position],
            className
          )}
          variants={animationVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <div className={cn(
            "flex items-center gap-3 p-3 pr-2",
            "bg-accent/95 backdrop-blur-md",
            "border border-border/50 rounded-xl",
            "shadow-lg shadow-black/10"
          )}>
            {/* Emoji/icon */}
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <span className="text-base">{emoji}</span>
            </div>

            {/* Message */}
            <p className="flex-1 text-sm text-foreground/90 leading-snug pr-1">
              {message}
            </p>

            {/* Action button */}
            {action && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAction}
                className="h-8 px-2 text-xs text-primary hover:text-primary/80 flex-shrink-0"
              >
                {action.label}
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            )}

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className={cn(
                "flex-shrink-0 w-7 h-7 rounded-full",
                "flex items-center justify-center",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-foreground/5 transition-colors"
              )}
              aria-label="Закрыть подсказку"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress indicator */}
          {duration > 0 && (
            <motion.div
              className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary/20 rounded-full overflow-hidden"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              style={{ transformOrigin: 'left' }}
            >
              <div className="h-full bg-primary/50" />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for showing quick tips imperatively
export function useQuickTip() {
  const [activeTip, setActiveTip] = useState<{
    tipId: string;
    message: string;
    emoji?: string;
    action?: { label: string; onClick: () => void };
    duration?: number;
  } | null>(null);

  const showTip = useCallback((config: typeof activeTip) => {
    setActiveTip(config);
  }, []);

  const hideTip = useCallback(() => {
    setActiveTip(null);
  }, []);

  const TipComponent = activeTip ? (
    <QuickTipToast
      tipId={activeTip.tipId}
      message={activeTip.message}
      emoji={activeTip.emoji}
      action={activeTip.action}
      duration={activeTip.duration}
    />
  ) : null;

  return { showTip, hideTip, TipComponent };
}

export default QuickTipToast;
