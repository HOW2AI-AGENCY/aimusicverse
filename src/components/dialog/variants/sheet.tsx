/**
 * Sheet Dialog Variant
 *
 * Bottom sheet with swipe-to-dismiss for mobile views
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

import { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { DialogBackdrop } from '../unified-dialog';
import { DIALOG_CONFIG } from '../unified-dialog.config';
import type { SheetDialogProps } from '../unified-dialog.types';

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
  const [currentSnapPoint, setCurrentSnapPoint] = useState(defaultSnapPoint);
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const height = typeof window !== 'undefined' ? window.innerHeight : 667;

  // Transform drag gesture to percentage
  const percentage = useTransform(y, [0, height], [0, 100]);
  const snapHeight = snapPoints[currentSnapPoint] * height;

  // Handle drag to close
  const handleDragEnd = (_: any, info: PanInfo) => {
    const shouldClose = info.offset.y > (DIALOG_CONFIG.gestures.swipeThreshold || 100);

    if (shouldClose && closeOnDragDown) {
      onOpenChange(false);
      y.set(0);
    } else {
      // Snap back to current snap point
      y.set(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <DialogBackdrop visible={open} onClick={() => onOpenChange(false)} />

      {/* Sheet Container */}
      <motion.div
        ref={containerRef}
        className={cn(
          'relative z-50 bg-background rounded-t-2xl shadow-lg w-full max-w-lg',
          className
        )}
        style={{
          height: snapHeight,
          y,
        }}
        initial={{ y: height }}
        animate={{ y: 0 }}
        exit={{ y: height }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 200,
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex-1">{title}</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-accent transition-colors"
            aria-label="Close sheet"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto" style={{ maxHeight: snapHeight - 120 }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
