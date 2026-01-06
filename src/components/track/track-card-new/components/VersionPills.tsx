/**
 * VersionPills - Single icon version switcher
 * Cycles through versions on click (A → B → C → D → A)
 * Shows hammer icon for studio-saved versions
 */

import { memo, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';
import { Layers, Hammer } from 'lucide-react';

interface VersionPillsProps {
  count: number;
  activeIndex?: number;
  onSwitch?: (index: number) => void;
  compact?: boolean;
  /** Source type of the currently active version */
  activeSourceType?: 'generated' | 'studio' | 'extended' | 'cover' | 'remix' | null;
}

export const VersionPills = memo(function VersionPills({
  count,
  activeIndex = 0,
  onSwitch,
  compact = false,
  activeSourceType,
}: VersionPillsProps) {
  if (count <= 1) return null;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('light');
    // Cycle to next version
    const nextIndex = (activeIndex + 1) % count;
    onSwitch?.(nextIndex);
  }, [onSwitch, activeIndex, count]);

  const currentLabel = String.fromCharCode(65 + activeIndex); // A, B, C, D
  const iconSize = compact ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const buttonSize = compact ? 'w-7 h-7 min-w-[28px]' : 'w-8 h-8 min-w-[32px]';
  
  // Show hammer icon for studio versions
  const isStudioVersion = activeSourceType === 'studio';
  const Icon = isStudioVersion ? Hammer : Layers;

  return (
    <motion.button
      onClick={handleClick}
      className={cn(
        buttonSize,
        'rounded-lg font-bold transition-all touch-manipulation',
        'flex items-center justify-center gap-0.5',
        isStudioVersion 
          ? 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border border-amber-500/20'
          : 'bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20'
      )}
      whileTap={{ scale: 0.92 }}
      title={isStudioVersion 
        ? `Версия ${currentLabel} (Студия) из ${count}. Нажмите для переключения`
        : `Версия ${currentLabel} из ${count}. Нажмите для переключения`
      }
    >
      <Icon className={cn(iconSize, 'flex-shrink-0')} />
      <span className={cn(
        compact ? 'text-[10px]' : 'text-xs',
        'font-bold leading-none'
      )}>
        {currentLabel}
      </span>
    </motion.button>
  );
});
