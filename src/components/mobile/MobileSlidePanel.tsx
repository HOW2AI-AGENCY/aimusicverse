/**
 * MobileSlidePanel - Slide-in panel from edge
 * Alternative to bottom sheet for side panels (mixer, tools, etc.)
 */

import { memo, ReactNode, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/useHaptic';
import { motion, AnimatePresence, PanInfo, useMotionValue } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface MobileSlidePanelProps {
  /** Panel open state */
  open: boolean;
  /** Open change handler */
  onOpenChange: (open: boolean) => void;
  /** Panel content */
  children: ReactNode;
  /** Panel title */
  title?: string;
  /** Slide direction */
  side?: 'left' | 'right';
  /** Panel width (percentage or px) */
  width?: string;
  /** Show close button */
  showClose?: boolean;
  /** Additional className */
  className?: string;
}

const DRAG_CLOSE_THRESHOLD = 100; // pixels
const VELOCITY_THRESHOLD = 500; // pixels per second

export const MobileSlidePanel = memo(function MobileSlidePanel({
  open,
  onOpenChange,
  children,
  title,
  side = 'right',
  width = '80%',
  showClose = true,
  className,
}: MobileSlidePanelProps) {
  const { patterns } = useHaptic();
  const x = useMotionValue(0);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { velocity, offset } = info;
    const shouldClose = side === 'right'
      ? offset.x > DRAG_CLOSE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD
      : offset.x < -DRAG_CLOSE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD;

    if (shouldClose) {
      patterns.tap();
      onOpenChange(false);
    }
  }, [side, patterns, onOpenChange]);

  const handleClose = useCallback(() => {
    patterns.tap();
    onOpenChange(false);
  }, [patterns, onOpenChange]);

  const handleBackdropClick = useCallback(() => {
    patterns.tap();
    onOpenChange(false);
  }, [patterns, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={handleBackdropClick}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: side === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'right' ? '100%' : '-100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            drag="x"
            dragConstraints={{
              left: side === 'right' ? 0 : undefined,
              right: side === 'left' ? 0 : undefined,
            }}
            dragElastic={{
              left: side === 'right' ? 0.1 : 0.4,
              right: side === 'left' ? 0.1 : 0.4,
            }}
            onDragEnd={handleDragEnd}
            style={{
              x,
              width,
              [side]: 0,
            }}
            className={cn(
              "fixed top-0 bottom-0 z-50",
              "bg-background shadow-2xl",
              "flex flex-col overflow-hidden",
              className
            )}
          >
            {/* Header */}
            {(title || showClose) && (
              <div
                className="flex items-center justify-between gap-3 p-4 border-b border-border/50 shrink-0"
                style={{
                  paddingTop: 'max(1rem, env(safe-area-inset-top))',
                }}
              >
                {title && (
                  <h2 className="text-base font-semibold flex-1">
                    {title}
                  </h2>
                )}
                {showClose && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="h-9 w-9 shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default MobileSlidePanel;
