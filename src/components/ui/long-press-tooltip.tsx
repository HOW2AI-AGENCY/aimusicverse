/**
 * LongPressTooltip - Shows full text on long press for truncated content
 * Mobile-friendly alternative to hover tooltips
 */

import { useState, useRef, useCallback, type ReactNode } from 'react';
import { AnimatePresence, motion } from '@/lib/motion';
import { hapticImpact } from '@/lib/haptic';
import { cn } from '@/lib/utils';

interface LongPressTooltipProps {
  content: string;
  children: ReactNode;
  delay?: number; // default 500ms
  className?: string;
}

export function LongPressTooltip({ 
  content, 
  children, 
  delay = 500,
  className 
}: LongPressTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    
    timerRef.current = window.setTimeout(() => {
      setShowTooltip(true);
      hapticImpact('light');
    }, delay);
  }, [delay]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // Cancel if user moves finger more than 10px
    if (deltaX > 10 || deltaY > 10) {
      window.clearTimeout(timerRef.current);
      setShowTooltip(false);
      touchStartRef.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    window.clearTimeout(timerRef.current);
    setShowTooltip(false);
    touchStartRef.current = null;
  }, []);

  const handleTouchCancel = useCallback(() => {
    window.clearTimeout(timerRef.current);
    setShowTooltip(false);
    touchStartRef.current = null;
  }, []);

  return (
    <div 
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 -top-2 -translate-y-full",
              "left-1/2 -translate-x-1/2", // Center the tooltip
              "bg-popover text-popover-foreground",
              "px-3 py-2 rounded-lg shadow-lg border border-border",
              "text-sm max-w-[280px] break-words",
              // Ensure tooltip stays within viewport with proper margins
              "max-w-[calc(100vw-2rem)] mx-4"
            )}
          >
            {content}
            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-popover border-r border-b border-border rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
