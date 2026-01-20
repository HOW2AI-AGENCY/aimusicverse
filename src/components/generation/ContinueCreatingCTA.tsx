/**
 * Continue Creating CTA Component
 * Feature: Sprint 32 - US-008 Continue Creating
 *
 * Shows after track finishes playing to encourage more creation
 * Prefills form with similar settings
 */

import { memo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';
import type { Track } from '@/types/track';

interface ContinueCreatingCTAProps {
  track: Track;
  onDismiss?: () => void;
  className?: string;
  variant?: 'banner' | 'card' | 'inline';
}

/**
 * Generate similar prompt based on track
 */
function generateSimilarPrompt(track: Track): {
  style: string;
  description: string;
} {
  const style = track.style || 'Pop';

  const descriptions = [
    `Another ${style.toLowerCase()} track similar vibe`,
    `${style} with energetic mood like this`,
    `Follow up to "${track.title}" in ${style} style`,
    `${style} track with same energy`,
  ];

  return {
    style,
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
  };
}

/**
 * Continue Creating CTA Component
 */
export const ContinueCreatingCTA = memo(function ContinueCreatingCTA({
  track,
  onDismiss,
  className,
  variant = 'banner',
}: ContinueCreatingCTAProps) {
  const { hapticFeedback } = useTelegram();
  const navigate = useNavigate();
  const { trackEvent } = useAnalyticsTracking();
  const [internalDismissed, setInternalDismissed] = useState(false);

  const handleCreateSimilar = useCallback(() => {
    hapticFeedback?.('medium');

    const prompt = generateSimilarPrompt(track);

    trackEvent({
      eventType: 'feature_used',
      eventName: 'continue_creating_tapped',
      metadata: { fromTrackId: track.id, style: prompt.style },
    });

    logger.info('Continue creating CTA tapped', {
      trackId: track.id,
      prompt,
    });

    // Store preset for GenerateSheet
    const presetParams = {
      style: prompt.style,
      description: prompt.description,
      quick: true,
    };

    sessionStorage.setItem('quickStartPreset', JSON.stringify(presetParams));
    sessionStorage.setItem('fromQuickCreate', 'true');
    sessionStorage.setItem('continueFromTrack', track.id);

    // Navigate with generate sheet open
    navigate('/', { state: { openGenerate: true } });
  }, [hapticFeedback, track, trackEvent, navigate]);

  const handleDismiss = useCallback(() => {
    hapticFeedback?.('light');
    setInternalDismissed(true);
    onDismiss?.();
  }, [hapticFeedback, onDismiss]);

  if (internalDismissed) {
    return null;
  }

  const variants = {
    banner: (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
          className={cn(
            'relative overflow-hidden rounded-xl',
            'bg-gradient-to-r from-primary/10 via-generate/10 to-primary/10',
            'border border-primary/20',
            'p-4',
            className
          )}
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 opacity-50">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/20 via-generate/20 to-primary/20"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'linear',
              }}
            />
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Content */}
          <div className="relative z-10 flex items-center gap-3">
            {/* Icon */}
            <motion.div
              className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-generate flex items-center justify-center shrink-0"
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
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground mb-0.5">
                Нравится этот трек?
              </p>
              <p className="text-xs text-muted-foreground">
                Создайте что-то похожее в том же стиле
              </p>
            </div>

            {/* Action button */}
            <Button
              onClick={handleCreateSimilar}
              size="sm"
              className="shrink-0 gap-1.5 bg-gradient-to-r from-primary to-generate hover:from-primary/90 hover:to-generate/90 text-white border-0"
            >
              Создать похожее
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    ),

    card: (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'relative overflow-hidden rounded-xl',
            'bg-gradient-to-br from-primary to-generate',
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
            <X className="w-4 h-4 text-white/80" />
          </button>

          {/* Content */}
          <div className="flex items-center gap-3">
            <motion.div
              className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0"
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
              <Sparkles className="w-7 h-7 text-white" />
            </motion.div>

            <div className="flex-1 min-w-0 text-white">
              <p className="font-bold text-base mb-0.5">
                Хотите ещё?
              </p>
              <p className="text-sm text-white/90">
                Создайте трек похожий на &quot;{track.title}&quot;
              </p>
            </div>

            <Button
              onClick={handleCreateSimilar}
              size="lg"
              className="shrink-0 bg-white text-primary hover:bg-white/90 border-0 gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Создать
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    ),

    inline: (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg',
            'bg-primary/5 border border-primary/20',
            className
          )}
        >
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <p className="text-sm text-foreground flex-1">
            Создать похожий на &quot;{track.title}&quot;?
          </p>
          <Button
            onClick={handleCreateSimilar}
            size="sm"
            variant="ghost"
            className="shrink-0 h-8 text-xs text-primary hover:bg-primary/10"
          >
            Создать
          </Button>
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 rounded hover:bg-black/5"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        </motion.div>
      </AnimatePresence>
    ),
  };

  return variants[variant];
});
