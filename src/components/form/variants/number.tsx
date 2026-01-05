/**
 * Number Input Variant
 *
 * Numeric input with min/max validation and steppers
 */

import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react';
import { FormLabel, FormError, FormHelperText } from '../unified-form-input';
import type { NumberInputProps } from '../unified-form-input.types';

export const NumberVariant = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput(
    {
      name,
      label,
      placeholder,
      min,
      max,
      step = 1,
      defaultValue,
      leftIcon,
      rightIcon,
      showSteppers,
      error,
      helperText,
      required,
      disabled,
      className,
    },
    ref
  ) {
    const [value, setValue] = useState(defaultValue ?? 0);

    const increment = () => {
      if (max !== undefined && value >= max) return;
      setValue(value + step);
    };

    const decrement = () => {
      if (min !== undefined && value <= min) return;
      setValue(value - step);
    };

    return (
      <div className="w-full">
        <FormLabel label={label} required={required} disabled={disabled} />

        <div className="relative flex items-center gap-2">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 text-muted-foreground">{leftIcon}</div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type="number"
            name={name}
            id={name}
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className={cn(
              'w-full min-h-[44px] px-3 py-2.5 rounded-md border',
              'bg-background text-foreground',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon && 'pl-10',
              (rightIcon || showSteppers) && 'pr-24',
              error ? 'border-red-500' : 'border-input',
              // Remove spinner buttons
              '[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
              '-moz-appearance:textfield',
              'transition-colors'
            )}
            aria-invalid={!!error}
          />

          {/* Steppers */}
          {showSteppers && (
            <div className="absolute right-2 flex flex-col gap-0.5">
              <button
                type="button"
                onClick={increment}
                disabled={disabled || (max !== undefined && value >= max)}
                className={cn(
                  'w-8 h-5 min-w-[32px] min-h-[20px] flex items-center justify-center',
                  'rounded hover:bg-accent transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                aria-label="Increase"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={decrement}
                disabled={disabled || (min !== undefined && value <= min)}
                className={cn(
                  'w-8 h-5 min-w-[32px] min-h-[20px] flex items-center justify-center',
                  'rounded hover:bg-accent transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                aria-label="Decrease"
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Right Icon (if no steppers) */}
          {rightIcon && !showSteppers && (
            <div className="absolute right-3 text-muted-foreground">{rightIcon}</div>
          )}
        </div>

        <FormError error={error} />
        <FormHelperText helperText={helperText} />
      </div>
    );
  }
);
