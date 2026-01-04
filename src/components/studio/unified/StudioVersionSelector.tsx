/**
 * Studio Version Selector
 * A/B version selector for tracks with haptic feedback
 */

import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Check } from 'lucide-react';

export interface TrackVersion {
  label: string;
  audioUrl: string;
  duration?: number;
}

interface StudioVersionSelectorProps {
  versions: TrackVersion[];
  activeLabel: string;
  onSelect: (label: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const StudioVersionSelector = memo(function StudioVersionSelector({
  versions,
  activeLabel,
  onSelect,
  disabled,
  compact,
}: StudioVersionSelectorProps) {
  const haptic = useHapticFeedback();

  const handleSelect = useCallback((label: string) => {
    if (disabled || label === activeLabel) return;
    haptic.select();
    onSelect(label);
  }, [disabled, activeLabel, haptic, onSelect]);

  if (versions.length < 2) return null;

  return (
    <div className={cn(
      "flex items-center gap-1",
      compact ? "gap-0.5" : "gap-1"
    )}>
      {versions.map((version) => {
        const isActive = version.label === activeLabel;
        return (
          <motion.button
            key={version.label}
            onClick={() => handleSelect(version.label)}
            disabled={disabled}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative flex items-center justify-center rounded-md font-mono font-bold transition-all touch-manipulation",
              compact ? "h-8 w-8 min-w-[32px] text-xs" : "h-11 min-w-[44px] px-2 text-sm",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {version.label}
            <AnimatePresence>
              {isActive && !compact && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center"
                >
                  <Check className="w-2 h-2 text-primary-foreground" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
});
