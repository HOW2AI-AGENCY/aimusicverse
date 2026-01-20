/**
 * First Comment CTA Component
 * Feature: Sprint 32 - US-005 First Comment CTA
 *
 * Encourages users to leave the first comment on a track
 * Shows as a gradient banner with engaging design
 */

import { memo, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { MessageCircle, Close, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';
import { logger } from '@/lib/logger';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';

interface FirstCommentCTAProps {
  trackId: string;
  trackTitle: string;
  onOpenComments: () => void;
  className?: string;
  variant?: 'banner' | 'card' | 'compact';
}

// Storage key for dismissed CTAs
const DISMISSED_CTAS_KEY = 'dismissed-comment-ctas';

/**
 * Check if user has commented on a track
 */
function useHasCommented(trackId: string) {
  const [hasCommented, setHasCommented] = useState(false);

  useEffect(() => {
    // Check localStorage for comment history
    const commentedTracks = JSON.parse(
      localStorage.getItem('commented-tracks') || '[]'
    );
    setHasCommented(commentedTracks.includes(trackId));
  }, [trackId]);

  return hasCommented;
}

/**
 * Check if CTA was dismissed for this track
 */
function useIsDismissed(trackId: string) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissedCtas = JSON.parse(
      localStorage.getItem(DISMISSED_CTAS_KEY) || '{}'
    );
    const dismissedAt = dismissedCtas[trackId];

    if (dismissedAt) {
      // Check if dismissed more than 7 days ago
      const daysSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      setIsDismissed(daysSinceDismissed < 7);
    }
  }, [trackId]);

  return isDismissed;
}

/**
 * First Comment CTA Component
 *
 * Shows a call-to-action banner encouraging users to leave the first comment
 * on a track that has no comments yet.
 *
 * @example
 * ```tsx
 * <FirstCommentCTA
 *   trackId="123"
 *   trackTitle="My Awesome Track"
 *   onOpenComments={() => setCommentsSheetOpen(true)}
 * />
 * ```
 */
export const FirstCommentCTA = memo(function FirstCommentCTA({
  trackId,
  trackTitle,
  onOpenComments,
  className,
  variant = 'banner',
}: FirstCommentCTAProps) {
  const { hapticFeedback } = useTelegram();
  const { trackEvent } = useAnalyticsTracking();
  const [internalDismissed, setInternalDismissed] = useState(false);

  const hasCommented = useHasCommented(trackId);
  const isPersistentlyDismissed = useIsDismissed(trackId);

  // Don't show if user has commented or dismissed
  if (hasCommented || isPersistentlyDismissed || internalDismissed) {
    return null;
  }

  const handleCommentClick = useCallback(() => {
    hapticFeedback('light');
    trackEvent('comment_cta_tapped', { trackId, variant });

    logger.info('First comment CTA tapped', { trackId, trackTitle });

    onOpenComments();
  }, [hapticFeedback, trackEvent, trackId, trackTitle, onOpenComments]);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback('light');

    trackEvent('comment_cta_dismissed', { trackId, variant });

    // Save dismissal to localStorage
    const dismissedCtas = JSON.parse(
      localStorage.getItem(DISMISSED_CTAS_KEY) || '{}'
    );
    dismissedCtas[trackId] = Date.now();
    localStorage.setItem(DISMISSED_CTAS_KEY, JSON.stringify(dismissedCtas));

    setInternalDismissed(true);

    logger.info('First comment CTA dismissed', { trackId });
  }, [hapticFeedback, trackEvent, trackId]);

  const variants = {
    banner: (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative overflow-hidden rounded-xl',
          'bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10',
          'border border-purple-200/50 dark:border-purple-900/50',
          'p-4',
          className
        )}
      >
        {/* Animated background */}
        <div className="absolute inset-0 opacity-30">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'linear',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-center gap-3">
          {/* Icon */}
          <motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <MessageCircle className="w-5 h-5 text-white" />
          </motion.div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-purple-900 dark:text-purple-100">
              Будьте первым! Оставьте комментарий
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
              Что вам больше всего понравилось в &quot;{trackTitle}&quot;?
            </p>
          </div>

          {/* Comment button */}
          <Button
            onClick={handleCommentClick}
            size="sm"
            className="shrink-0 gap-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Комментировать</span>
            <span className="xs:hidden">Написать</span>
          </Button>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <Close className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </button>
        </div>
      </motion.div>
    ),

    card: (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative overflow-hidden rounded-xl',
          'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500',
          'p-4',
          className
        )}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-md bg-black/10 hover:bg-black/20 transition-colors"
          aria-label="Dismiss"
        >
          <Close className="w-4 h-4 text-white/80" />
        </button>

        {/* Content */}
        <div className="flex items-center gap-3">
          <motion.div
            className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0"
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </motion.div>

          <div className="flex-1 min-w-0 text-white">
            <p className="font-bold text-base flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Будьте первым!
            </p>
            <p className="text-sm text-white/90 mt-0.5">
              Оставьте первый комментарий к &quot;{trackTitle}&quot;
            </p>
          </div>

          <Button
            onClick={handleCommentClick}
            size="lg"
            className="shrink-0 bg-white text-purple-600 hover:bg-white/90 border-0"
          >
            Написать
          </Button>
        </div>
      </motion.div>
    ),

    compact: (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg',
          'bg-purple-50 dark:bg-purple-950/20',
          'border border-purple-200 dark:border-purple-900/50',
          className
        )}
      >
        <MessageCircle className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" />
        <p className="text-xs text-purple-700 dark:text-purple-300 flex-1">
          Будьте первым, кто прокомментирует!
        </p>
        <Button
          onClick={handleCommentClick}
          size="sm"
          variant="ghost"
          className="shrink-0 h-7 text-xs text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
        >
          Написать
        </Button>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30"
        >
          <Close className="w-3 h-3 text-purple-600 dark:text-purple-400" />
        </button>
      </motion.div>
    ),
  };

  return <AnimatePresence>{variants[variant]}</AnimatePresence>;
});

/**
 * Hook to show comment CTA for tracks
 */
export function useCommentCTA() {
  const [shownCtas, setShownCtas] = useState<Set<string>>(new Set());

  const markAsShown = useCallback((trackId: string) => {
    setShownCtas((prev) => new Set(prev).add(trackId));
  }, []);

  const markAsCommented = useCallback((trackId: string) => {
    const commentedTracks = JSON.parse(
      localStorage.getItem('commented-tracks') || '[]'
    );
    if (!commentedTracks.includes(trackId)) {
      commentedTracks.push(trackId);
      localStorage.setItem('commented-tracks', JSON.stringify(commentedTracks));
    }

    setShownCtas((prev) => {
      const next = new Set(prev);
      next.delete(trackId);
      return next;
    });
  }, []);

  return {
    shownCtas,
    markAsShown,
    markAsCommented,
  };
}
