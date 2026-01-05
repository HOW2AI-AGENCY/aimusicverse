/**
 * MobileSlider - Mobile-optimized slider with large thumb
 * Better touch target for mobile interaction
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/useHaptic';
import { Slider } from '@/components/ui/slider';

interface MobileSliderProps {
  /** Current value */
  value: number;
  /** Value change handler */
  onChange: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Show value label */
  showValue?: boolean;
  /** Value formatter */
  formatValue?: (value: number) => string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

export const MobileSlider = memo(function MobileSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  formatValue = (v) => v.toString(),
  disabled = false,
  className,
}: MobileSliderProps) {
  const { patterns } = useHaptic();

  const handleValueChange = (values: number[]) => {
    onChange(values[0]);
  };

  const handleValueCommit = () => {
    patterns.select();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Slider
        value={[value]}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={cn(
          "touch-none",
          // Larger thumb for mobile
          "[&_[role=slider]]:h-6 [&_[role=slider]]:w-6",
          "[&_[role=slider]]:border-4"
        )}
      />

      {showValue && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">{formatValue(min)}</span>
          <span className="font-semibold text-sm">{formatValue(value)}</span>
          <span className="text-muted-foreground">{formatValue(max)}</span>
        </div>
      )}
    </div>
  );
});

export default MobileSlider;
