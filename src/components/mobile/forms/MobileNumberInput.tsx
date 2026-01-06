/**
 * MobileNumberInput - Mobile-optimized number input with +/- buttons
 * Better UX than native number input on mobile
 */

import { memo } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/useHaptic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MobileNumberInputProps {
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
  /** Unit label (BPM, sec, etc) */
  unit?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

export const MobileNumberInput = memo(function MobileNumberInput({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  unit,
  disabled = false,
  className,
}: MobileNumberInputProps) {
  const { patterns } = useHaptic();

  const handleIncrement = () => {
    const newValue = Math.min(value + step, max);
    if (newValue !== value) {
      patterns.tap();
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min);
    if (newValue !== value) {
      patterns.tap();
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      const clampedValue = Math.min(Math.max(newValue, min), max);
      onChange(clampedValue);
    }
  };

  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Decrement Button */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleDecrement}
        disabled={disabled || !canDecrement}
        className="h-11 w-11 shrink-0"
      >
        <Minus className="w-4 h-4" />
      </Button>

      {/* Input */}
      <div className="relative flex-1">
        <Input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            "h-11 text-center text-lg font-semibold",
            unit && "pr-12"
          )}
        />
        {unit && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none">
            {unit}
          </div>
        )}
      </div>

      {/* Increment Button */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleIncrement}
        disabled={disabled || !canIncrement}
        className="h-11 w-11 shrink-0"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
});

export default MobileNumberInput;
