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

import { useCallback, useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "@/lib/motion";
import { X, ChevronRight, Lightbulb } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHintRegistry } from "./HintRegistry";
import { useTipPosition } from "./useTipPosition";

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
  const { isMobile, className: positionClass } = useTipPosition();
  const reg = useHintRegistry();
  const [claimed, setClaimed] = useState(false);
  const isActive = reg.activeId === id;
  const hasSeen = reg.hasSeen(id);
  const overlayOpen = reg.overlayOpen;

  const request = useCallback(() => reg.request(id), [reg, id]);
  const release = useCallback(() => reg.release(id), [reg, id]);
  const markSeen = useCallback(() => reg.markSeen(id), [reg, id]);

  // Try to claim the visible slot after `delay`, unless already seen.
  useEffect(() => {
    if (!force && hasSeen) return;
    if (overlayOpen) return;
    const t = setTimeout(() => {
      setClaimed(request());
    }, delay);
    return () => clearTimeout(t);
  }, [request, delay, force, hasSeen, overlayOpen]);

  // Reset claimed state when this card is no longer active. Uses the
  // render-time setState escape hatch (with a ref guard) instead of an effect
  // to avoid a cascading render (set-state-in-effect rule).
  const prevIsActiveRef = useRef(isActive);
  if (!isActive && prevIsActiveRef.current) {
    prevIsActiveRef.current = false;
    setClaimed(false);
  } else if (isActive) {
    prevIsActiveRef.current = true;
  }

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

  return (
    <AnimatePresence>
      {isActive && claimed && (
        <motion.div
          role="status"
          aria-live="polite"
          data-hint-id={id}
          data-testid="unified-tip-card"
          initial={{ opacity: 0, y: isMobile ? 16 : 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isMobile ? 16 : 12, scale: 0.98 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className={positionClass}
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border border-border/60 shadow-2xl",
              "bg-card/95 backdrop-blur-xl text-card-foreground",
            )}
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  {emoji ? (
                    <span aria-hidden="true" className="text-lg">
                      {emoji}
                    </span>
                  ) : (
                    <Lightbulb className="h-5 w-5 text-primary" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="mb-1 text-sm font-semibold leading-tight">{title}</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">{message}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-11 w-11 min-w-[44px] min-h-[44px] flex-shrink-0 rounded-full hover:bg-muted/80"
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
                  className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs text-muted-foreground"
                >
                  Понятно
                </Button>
                {hasNext && onNext && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleNext}
                    className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 gap-1 text-xs"
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
