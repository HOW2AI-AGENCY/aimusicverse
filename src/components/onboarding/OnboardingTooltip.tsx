/**
 * Onboarding Tooltip System
 * 
 * Contextual hints for new users to discover features.
 * Automatically dismisses after interaction or timeout.
 * 
 * @module components/onboarding/OnboardingTooltip
 */

import { memo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { X, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';

interface OnboardingTooltipProps {
  /** Unique ID for persistence */
  id: string;
  /** Tooltip content */
  content: string;
  /** Optional title */
  title?: string;
  /** Optional action label */
  actionLabel?: string;
  /** Action callback */
  onAction?: () => void;
  /** Position relative to anchor */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Additional class name */
  className?: string;
  /** Delay before showing (ms) */
  delay?: number;
  /** Auto-hide after (ms), 0 to disable */
  autoHideAfter?: number;
  /** Only show for new users */
  newUsersOnly?: boolean;
  /** Children to wrap */
  children: React.ReactNode;
}

const STORAGE_KEY = 'onboarding-dismissed';

function getDismissedTooltips(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function dismissTooltip(id: string) {
  try {
    const dismissed = getDismissedTooltips();
    dismissed.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed]));
  } catch {
    // Ignore storage errors
  }
}

export const OnboardingTooltip = memo(function OnboardingTooltip({
  id,
  content,
  title,
  actionLabel,
  onAction,
  position = 'bottom',
  className,
  delay = 500,
  autoHideAfter = 10000,
  newUsersOnly = true,
  children,
}: OnboardingTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { hapticFeedback } = useTelegram();

  // Check if already dismissed
  useEffect(() => {
    const dismissed = getDismissedTooltips();
    if (dismissed.has(id)) return;

    // Check new user condition
    if (newUsersOnly) {
      const hasGeneratedTrack = localStorage.getItem('first-generated-track-id');
      if (hasGeneratedTrack) return;
    }

    // Show with delay
    const showTimer = setTimeout(() => setIsVisible(true), delay);

    // Auto-hide
    let hideTimer: ReturnType<typeof setTimeout>;
    if (autoHideAfter > 0) {
      hideTimer = setTimeout(() => {
        setIsVisible(false);
        dismissTooltip(id);
      }, delay + autoHideAfter);
    }

    return () => {
      clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [id, delay, autoHideAfter, newUsersOnly]);

  const handleDismiss = useCallback(() => {
    hapticFeedback('light');
    setIsVisible(false);
    dismissTooltip(id);
  }, [id, hapticFeedback]);

  const handleAction = useCallback(() => {
    hapticFeedback('medium');
    onAction?.();
    setIsVisible(false);
    dismissTooltip(id);
  }, [id, hapticFeedback, onAction]);

  // Position styles
  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45',
    left: 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45',
    right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rotate-45',
  };

  return (
    <div className="relative inline-block">
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute z-50 w-64 p-3 rounded-xl',
              'bg-primary text-primary-foreground shadow-lg',
              positionStyles[position],
              className
            )}
          >
            {/* Arrow */}
            <div
              className={cn(
                'absolute w-3 h-3 bg-primary',
                arrowStyles[position]
              )}
            />

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-primary-foreground/20 transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Content */}
            <div className="pr-6">
              {title && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-sm font-semibold">{title}</span>
                </div>
              )}
              <p className="text-xs opacity-90 leading-relaxed">{content}</p>
            </div>

            {/* Action button */}
            {actionLabel && onAction && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleAction}
                className="mt-2 w-full h-8 text-xs bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
              >
                {actionLabel}
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/**
 * Hook to check if a tooltip should be shown
 */
export function useOnboardingStatus(id: string): boolean {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const dismissed = getDismissedTooltips();
    setShouldShow(!dismissed.has(id));
  }, [id]);

  return shouldShow;
}

/**
 * Reset all dismissed tooltips (for testing)
 */
export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}
