/**
 * Checkbox Input Variant
 *
 * Boolean toggle with label and description
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { CheckboxInputProps } from '../unified-form-input.types';

export const CheckboxVariant = forwardRef<HTMLInputElement, CheckboxInputProps>(
  function Checkbox(
    {
      name,
      label,
      description,
      defaultChecked = false,
      indeterminate = false,
      size = 'md',
      error,
      disabled,
      className,
    },
    ref
  ) {
    const sizeClass = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    }[size];

    return (
      <label className={cn(
        'flex items-start gap-3 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed'
      )}>
        {/* Checkbox */}
        <div className="relative flex-shrink-0 pt-0.5">
          <input
            ref={ref}
            type="checkbox"
            name={name}
            id={name}
            defaultChecked={defaultChecked}
            disabled={disabled}
            ref={(el) => {
              if (el) {
                el.indeterminate = indeterminate;
              }
              if (typeof ref === 'function') {
                ref(el);
              } else if (ref) {
                ref.current = el;
              }
            }}
            className={cn(
              'peer',
              'appearance-none',
              sizeClass,
              'rounded border border-input',
              'checked:bg-primary checked:border-primary',
              'transition-colors',
              'cursor-pointer',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            aria-invalid={!!error}
          />

          {/* Custom Check Icon */}
          <div className={cn(
            'absolute left-0 top-0 pointer-events-none',
            sizeClass,
            'flex items-center justify-center',
            'text-primary-foreground',
            'opacity-0 peer-checked:opacity-100',
            'transition-opacity'
          )}>
            <Check className="w-3 h-3" />
          </div>
        </div>

        {/* Label & Description */}
        <div className="flex-1">
          {label && (
            <span className={cn(
              'text-sm font-medium block',
              disabled && 'text-muted-foreground'
            )}>
              {label}
            </span>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </label>
    );
  }
);
