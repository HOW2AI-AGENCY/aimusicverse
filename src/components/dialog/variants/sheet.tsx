/**
 * Sheet Dialog Variant
 *
 * Bottom sheet with swipe-to-dismiss for mobile views
 * Optimized for Telegram Mini App with safe area support
 *
 * @example
 * ```tsx
 * <SheetDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Filters"
 *   snapPoints={[0.25, 0.5, 0.9]}
 *   defaultSnapPoint={1}
 *   closeOnDragDown={true}
 * >
 *   <p>Filter options</p>
 * </SheetDialog>
 * ```
 */

import { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { DialogBackdrop } from '../unified-dialog';
import { DIALOG_CONFIG } from '../unified-dialog.config';
import type { SheetDialogProps } from '../unified-dialog.types';
import { useHaptic } from '@/hooks/useHaptic';
import { DialogHeader } from '../DialogHeader';
import type { ReactNode } from 'react';

const DRAG_CLOSE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;

export function SheetDialog({
  open,
  onOpenChange,
  title,
  children,
  snapPoints = [...DIALOG_CONFIG.snapPoints.default] as number[],
  defaultSnapPoint = DIALOG_CONFIG.snapPoints.defaultSnapIndex,
  closeOnDragDown = true,
  className,
}: SheetDialogProps) {
  const { patterns } = useHaptic();
  const [currentSnapPoint, setCurrentSnapPoint] = useState(defaultSnapPoint);
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const height = typeof window !== 'undefined' ? window.innerHeight : 667;

  // Transform drag gesture for backdrop opacity
  const backdropOpacity = useTransform(y, [0, 200], [1, 0]);
  const snapHeight = snapPoints[currentSnapPoint] * height;

  // Handle drag to close with haptic feedback
  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const { velocity, offset } = info;
    
    // Close if dragged down far enough or with high velocity
    if ((offset.y > DRAG_CLOSE_THRESHOLD || velocity.y > VELOCITY_THRESHOLD) && closeOnDragDown) {
      patterns.tap();
      onOpenChange(false);
      y.set(0);
      return;
    }

    // Snap back to current snap point
    y.set(0);
  }, [closeOnDragDown, onOpenChange, patterns, y]);

  const handleClose = useCallback(() => {
    patterns.tap();
    onOpenChange(false);
  }, [patterns, onOpenChange]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop with opacity transform */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ opacity: backdropOpacity }}
        onClick={handleClose}
      />

      {/* Sheet Container - Telegram Mini App optimized */}
      <motion.div
        ref={containerRef}
        className={cn(
          'relative z-50 bg-background rounded-t-3xl shadow-2xl w-full max-w-lg',
          'flex flex-col overflow-hidden',
          className
        )}
        style={{
          height: snapHeight,
          y,
          // Telegram Mini App safe area bottom padding
          paddingBottom: 'max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))',
        }}
        initial={{ y: height }}
        animate={{ y: 0 }}
        exit={{ y: height }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300,
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.1, bottom: 0.4 }}
        onDragEnd={handleDragEnd}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        {/* Drag Handle - Touch-friendly */}
        <div className="flex justify-center py-2 flex-shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header with X on right */}
        <DialogHeader
          title={title}
          onClose={handleClose}
          className="border-b-0 pt-0"
        />

        {/* Content with scroll */}
        <div 
          className="flex-1 overflow-auto overscroll-contain"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            maxHeight: snapHeight - 100,
          }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
