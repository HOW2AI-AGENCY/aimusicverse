/**
 * UnifiedTipCard - Single visual for all in-app hint cards.
 *
 * Adaptive:
 *  - mobile (<768px): bottom-anchored card with safe-area + player offset,
 *    z below sheets/dialogs (z-floating range, value 95).
 *  - desktop (>=768px): floating card pinned to bottom-right.
 *
 * Always exclusive — only one card is visible thanks to HintRegistry.
 */

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from '@/lib/motion';
import { X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHintRegistry } from './HintRegistry';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';

export interface UnifiedTipCardProps {
  id: string;
  title: string;
  message: string;
  emoji?: string;
  /** Show "Next" button when more tips are queued. */
  hasNext?: boolean;
  onDismiss: () => void;
  onNext?: () => void;
  /** Auto-show after this delay (ms). Default 1500ms. */
  delay?: number;
  /** Force re-show even if already seen. Default false. */
  force?: boolean;
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export function UnifiedTipCard({
  id,
  title,
  message,
  emoji,
  hasNext = false,
  onDismiss,
  onNext,
  delay = 1500,
  force = false,
}: UnifiedTipCardProps) {
  const isMobile = useIsMobile();
  const hasMiniPlayer = usePlayerStore((s) => !!s.activeTrack);
  const reg = useHintRegistry();
  const isActive = reg.activeId === id;
  const hasSeen = reg.hasSeen(id);
  const overlayOpen = reg.overlayOpen;
  const request = () => reg.request(id);
  const release = () => reg.release(id);
  const markSeen = () => reg.markSeen(id);

  // Try to claim the visible slot after `delay`, unless already seen.
  useEffect(() => {
    if (!force && hasSeen) return;
    if (overlayOpen) return;
    const t = setTimeout(() => {
      request();
    }, delay);
    return () => clearTimeout(t);
  }, [request, delay, force, hasSeen, overlayOpen]);

  // Release on unmount
  useEffect(() => {
    return () => release();
  }, [release]);

  const handleClose = () => {
    markSeen();
    release();
    onDismiss();
  };

  const handleNext = () => {
    markSeen();
    release();
    onNext?.();
  };

  const positionClass = useMemo(() => {
    if (!isMobile) {
      return 'fixed right-6 bottom-6 w-[360px] max-w-[calc(100vw-3rem)] z-[95]';
    }
    // Mobile: must clear bottom-nav (~80px) + mini-player (~72px) + safe-area.
    // Honor Telegram safe-area var when present.
    const bottom = hasMiniPlayer
      ? 'bottom-[calc(10rem+max(var(--tg-safe-area-inset-bottom,0px),env(safe-area-inset-bottom,0px)))]'
      : 'bottom-[calc(5.5rem+max(var(--tg-safe-area-inset-bottom,0px),env(safe-area-inset-bottom,0px)))]';
    return cn('fixed left-3 right-3 mx-auto max-w-md z-[95]', bottom);
  }, [isMobile, hasMiniPlayer]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: isMobile ? 16 : 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isMobile ? 16 : 12, scale: 0.98 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className={positionClass}
        >
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl border border-border/60 shadow-2xl',
              'bg-card/95 backdrop-blur-xl text-card-foreground'
            )}
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg">
                  <span aria-hidden="true">{emoji ?? '💡'}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="mb-1 text-sm font-semibold leading-tight">
                    {title}
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {message}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8 flex-shrink-0 rounded-full hover:bg-muted/80"
                  aria-label="Закрыть подсказку"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2 border-t border-border/40 pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 text-xs text-muted-foreground"
                >
                  Понятно
                </Button>
                {hasNext && onNext && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleNext}
                    className="h-8 gap-1 text-xs"
                  >
                    Далее
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default UnifiedTipCard;
