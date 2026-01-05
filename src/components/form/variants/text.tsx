/**
 * Text Input Variant
 *
 * Single-line text input (text, email, password, URL, tel)
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { FormLabel, FormError, FormHelperText } from '../unified-form-input';
import type { TextInputProps } from '../unified-form-input.types';

export const TextVariant = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    {
      name,
      label,
      type = 'text',
      placeholder,
      maxLength,
      minLength,
      autoComplete,
      leftIcon,
      rightIcon,
      showPasswordToggle,
      error,
      helperText,
      required,
      disabled,
      className,
    },
    ref
  ) {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        <FormLabel label={label} required={required} disabled={disabled} />

        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={inputType}
            name={name}
            id={name}
            placeholder={placeholder}
            maxLength={maxLength}
            minLength={minLength}
            autoComplete={autoComplete}
            disabled={disabled}
            className={cn(
              'w-full min-h-[44px] px-3 py-2.5 rounded-md border',
              'bg-background text-foreground',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon && 'pl-10',
              (rightIcon || showPasswordToggle || error) && 'pr-10',
              error ? 'border-red-500' : 'border-input',
              'transition-colors'
            )}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${name}-error` : helperText ? `${name}-helper` : undefined
            }
          />

          {/* Right Icon / Password Toggle / Error Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {error && <AlertCircle className="w-4 h-4 text-red-500" />}
            {isPassword && showPasswordToggle && !error && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
            {rightIcon && !error && <div className="text-muted-foreground">{rightIcon}</div>}
          </div>
        </div>

        <FormError error={error} />
        <FormHelperText helperText={helperText} />
      </div>
    );
  }
);
