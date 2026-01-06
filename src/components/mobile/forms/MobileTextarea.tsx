/**
 * MobileTextarea - Mobile-optimized textarea with character counter
 * Auto-grows with content, keyboard-aware
 */

import { memo, useRef, useEffect, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

interface MobileTextareaProps {
  /** Textarea value */
  value: string;
  /** Value change handler */
  onChange: (value: string) => void;
  /** Placeholder */
  placeholder?: string;
  /** Minimum rows */
  minRows?: number;
  /** Maximum rows */
  maxRows?: number;
  /** Maximum characters */
  maxLength?: number;
  /** Show character counter */
  showCounter?: boolean;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

export const MobileTextarea = memo(forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
  function MobileTextarea({
    value,
    onChange,
    placeholder,
    minRows = 3,
    maxRows = 10,
    maxLength,
    showCounter = false,
    autoFocus = false,
    disabled = false,
    className,
  }, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const actualRef = (ref as React.RefObject<HTMLTextAreaElement>) || textareaRef;

    // Auto-grow textarea
    useEffect(() => {
      const textarea = actualRef.current;
      if (!textarea) return;

      // Reset height to auto to get correct scrollHeight
      textarea.style.height = 'auto';

      // Calculate new height
      const lineHeight = 24; // Approximate line height in pixels
      const minHeight = minRows * lineHeight;
      const maxHeight = maxRows * lineHeight;
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);

      textarea.style.height = `${newHeight}px`;
    }, [value, minRows, maxRows, actualRef]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;

      // Enforce maxLength if specified
      if (maxLength && newValue.length > maxLength) {
        return;
      }

      onChange(newValue);
    };

    const charCount = value.length;
    const remaining = maxLength ? maxLength - charCount : null;

    return (
      <div className="relative">
        <Textarea
          ref={actualRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          className={cn(
            "min-h-[72px] resize-none",
            "text-sm leading-relaxed",
            showCounter && maxLength && "pb-8",
            className
          )}
          style={{
            overflow: value.split('\n').length > maxRows ? 'auto' : 'hidden',
          }}
        />

        {/* Character Counter */}
        {showCounter && (maxLength || charCount > 0) && (
          <div className={cn(
            "absolute bottom-2 right-3 text-xs",
            remaining !== null && remaining < 20
              ? "text-destructive font-medium"
              : "text-muted-foreground"
          )}>
            {maxLength ? (
              <span>{remaining} осталось</span>
            ) : (
              <span>{charCount} символов</span>
            )}
          </div>
        )}
      </div>
    );
  }
));

export default MobileTextarea;
