/**
 * MobileFormField - Mobile-optimized form field wrapper
 * Provides consistent form field styling with large touch targets
 */

import { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileFormFieldProps {
  /** Field label */
  label: string;
  /** Field description */
  description?: string;
  /** Field content */
  children: ReactNode;
  /** Error message */
  error?: string;
  /** Required indicator */
  required?: boolean;
  /** Additional className */
  className?: string;
}

export const MobileFormField = memo(function MobileFormField({
  label,
  description,
  children,
  error,
  required = false,
  className,
}: MobileFormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <label className="flex items-center gap-1 text-sm font-medium">
        {label}
        {required && (
          <span className="text-destructive">*</span>
        )}
      </label>

      {/* Description */}
      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}

      {/* Field */}
      <div>
        {children}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive font-medium">
          {error}
        </p>
      )}
    </div>
  );
});

export default MobileFormField;
