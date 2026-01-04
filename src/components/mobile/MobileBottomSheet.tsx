/**
 * MobileBottomSheet - Optimized bottom sheet for mobile with gestures
 * Features: drag-to-dismiss, snap points, velocity-based closing
 */

import { memo, useRef, useCallback, useState, ReactNode } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/useHaptic';

interface MobileBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  snapPoints?: number[]; // Percentages: [0.5, 0.9] = 50% and 90% height
  defaultSnapPoint?: number;
  className?: string;
  showHandle?: boolean;
  onSnapChange?: (snapIndex: number) => void;
}

const DRAG_CLOSE_THRESHOLD = 100; // pixels
const VELOCITY_THRESHOLD = 500; // pixels per second

export const MobileBottomSheet = memo(function MobileBottomSheet({
  open,
  onOpenChange,
  children,
  snapPoints = [0.9],
  defaultSnapPoint = 0,
  className,
  showHandle = true,
  onSnapChange,
}: MobileBottomSheetProps) {
  const { patterns } = useHaptic();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSnap, setCurrentSnap] = useState(defaultSnapPoint);
  
  const y = useMotionValue(0);
  const backdropOpacity = useTransform(y, [0, 200], [1, 0]);
  
  const currentHeight = snapPoints[currentSnap] * window.innerHeight;

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { velocity, offset } = info;
    
    // Close if dragged down far enough or with high velocity
    if (offset.y > DRAG_CLOSE_THRESHOLD || velocity.y > VELOCITY_THRESHOLD) {
      patterns.tap();
      onOpenChange(false);
      return;
    }
    
    // Snap to nearest snap point
    const currentPosition = offset.y;
    let closestSnapIndex = currentSnap;
    let closestDistance = Infinity;
    
    snapPoints.forEach((snap, index) => {
      const snapY = (1 - snap) * window.innerHeight;
      const distance = Math.abs(currentPosition - snapY);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSnapIndex = index;
      }
    });
    
    if (closestSnapIndex !== currentSnap) {
      patterns.select();
      setCurrentSnap(closestSnapIndex);
      onSnapChange?.(closestSnapIndex);
    }
  }, [currentSnap, snapPoints, patterns, onOpenChange, onSnapChange]);

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
            style={{ opacity: backdropOpacity }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleBackdropClick}
          />
          
          {/* Sheet */}
          <motion.div
            ref={containerRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
            style={{ 
              y,
              height: `${snapPoints[currentSnap] * 100}vh`,
            }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-background rounded-t-3xl",
              "shadow-2xl",
              "flex flex-col overflow-hidden",
              className
            )}
          >
            {/* Drag Handle */}
            {showHandle && (
              <div className="flex justify-center py-3 flex-shrink-0 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default MobileBottomSheet;
