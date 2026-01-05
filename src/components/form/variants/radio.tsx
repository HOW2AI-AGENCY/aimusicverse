/**
 * Radio Input Variant
 *
 * Single selection from radio group
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { RadioInputProps } from '../unified-form-input.types';

export const RadioVariant = forwardRef<HTMLInputElement, RadioInputProps>(
  function Radio(
    {
      name,
      label,
      options,
      defaultValue,
      orientation = 'vertical',
      error,
      helperText,
      required,
      disabled,
      className,
    },
    ref
  ) {
    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label className="block text-sm font-medium mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div
          className={cn(
            'flex gap-4',
            orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
          )}
        >
          {options.map(option => (
            <label
              key={option.value}
              className={cn(
                'flex items-center gap-3 cursor-pointer min-h-[44px]',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
                {/* Radio Input */}
                <div className="relative flex-shrink-0">
                  <input
                    ref={ref}
                    type="radio"
                    name={name}
                    value={option.value}
                    defaultChecked={option.value === defaultValue}
                    disabled={disabled || option.disabled}
                    className={cn(
                      'peer',
                      'appearance-none',
                      'w-5 h-5 min-w-[20px] min-h-[20px]',
                      'rounded-full border-2 border-input',
                      'checked:border-primary checked:bg-primary',
                      'transition-all',
                      'cursor-pointer',
                      'disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                  />

                  {/* Radio Dot */}
                  <div className={cn(
                    'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                    'w-2.5 h-2.5 rounded-full',
                    'bg-white',
                    'opacity-0 peer-checked:opacity-100',
                    'transition-opacity'
                  )} />
                </div>

                {/* Label & Description */}
                <div className="flex-1">
                  <span className={cn(
                    'text-sm font-medium',
                    disabled && 'text-muted-foreground'
                  )}>
                    {option.label}
                  </span>
                  {option.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                  )}
                </div>
              </label>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 mt-1.5" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground mt-1.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
