/**
 * Bottom Sheet Component
 * Feature: 032-professional-ui
 * 
 * Mobile-friendly bottom sheet with drag-to-dismiss
 */

import React, { ReactNode, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { triggerHapticFeedback } from '@/lib/mobile-utils';
import { backdrop } from '@/lib/overlay-colors';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  snapPoints?: number[];
  defaultSnapPoint?: number;
  showHandle?: boolean;
  showOverlay?: boolean;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  description,
  snapPoints = [0.5, 0.9],
  defaultSnapPoint = 0,
  showHandle = true,
  showOverlay = true,
  className,
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(defaultSnapPoint);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentHeight = snapPoints[currentSnap];
  const dismissThreshold = 100;

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const velocity = info.velocity.y;
      const offset = info.offset.y;

      // Fast swipe down = dismiss
      if (velocity > 500 || offset > dismissThreshold) {
        triggerHapticFeedback('light');
        onClose();
        return;
      }

      // Fast swipe up = expand
      if (velocity < -500 && currentSnap < snapPoints.length - 1) {
        triggerHapticFeedback('light');
        setCurrentSnap(currentSnap + 1);
        return;
      }

      // Find nearest snap point based on current position
      const containerHeight = containerRef.current?.clientHeight || 0;
      const currentPosition = (containerHeight * currentHeight - offset) / containerHeight;
      
      let nearestSnap = 0;
      let minDistance = Infinity;
      
      snapPoints.forEach((point, index) => {
        const distance = Math.abs(point - currentPosition);
        if (distance < minDistance) {
          minDistance = distance;
          nearestSnap = index;
        }
      });

      if (nearestSnap !== currentSnap) {
        triggerHapticFeedback('light');
      }
      setCurrentSnap(nearestSnap);
    },
    [currentSnap, currentHeight, snapPoints, onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("fixed inset-0 z-50", backdrop.medium)}
              onClick={onClose}
            />
          )}

          {/* Sheet */}
          <motion.div
            ref={containerRef}
            initial={{ y: '100%' }}
            animate={{ y: `${(1 - currentHeight) * 100}%` }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50",
              "bg-background rounded-t-2xl",
              "shadow-2xl",
              "flex flex-col",
              "max-h-[95vh]",
              className
            )}
            style={{ height: `${currentHeight * 100}vh` }}
          >
            {/* Handle */}
            {showHandle && (
              <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
            )}

            {/* Header */}
            {(title || description) && (
              <div className="px-4 pb-4 border-b border-border">
                {title && (
                  <h2 className="text-lg font-semibold text-foreground">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Content */}
            <div 
              ref={contentRef}
              className="flex-1 overflow-y-auto overscroll-contain"
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default BottomSheet;
