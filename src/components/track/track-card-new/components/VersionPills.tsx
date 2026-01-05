/**
 * VersionPills - A/B/C/D version switcher pills
 */

import { memo, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';

interface VersionPillsProps {
  count: number;
  activeIndex?: number;
  onSwitch?: (index: number) => void;
  compact?: boolean;
}

export const VersionPills = memo(function VersionPills({
  count,
  activeIndex = 0,
  onSwitch,
  compact = false,
}: VersionPillsProps) {
  if (count <= 1) return null;

  const handleClick = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    hapticImpact('light');
    onSwitch?.(index);
  }, [onSwitch]);

  const pillSize = compact ? 'w-6 h-6 min-w-[24px] min-h-[24px] text-[10px]' : 'w-7 h-7 min-w-[28px] min-h-[28px] text-xs';

  return (
    <div
      className="flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full px-1.5 py-0.5 border border-border/50"
      onClick={(e) => e.stopPropagation()}
    >
      {Array.from({ length: Math.min(count, 4) }).map((_, i) => {
        const isActive = i === activeIndex;
        const label = String.fromCharCode(65 + i); // A, B, C, D

        return (
          <motion.button
            key={i}
            onClick={(e) => handleClick(e, i)}
            className={cn(
              pillSize,
              'rounded-full font-bold transition-all touch-manipulation',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
            whileTap={{ scale: 0.95 }}
          >
            {label}
          </motion.button>
        );
      })}
      {count > 4 && (
        <span className="text-[10px] text-muted-foreground font-medium px-0.5">
          +{count - 4}
        </span>
      )}
    </div>
  );
});
