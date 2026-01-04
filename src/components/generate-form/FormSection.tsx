/**
 * FormSection - Visual container for form sections
 * Provides consistent spacing, background, and grouping
 */

import { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  children: ReactNode;
  className?: string;
  /** Add subtle background to distinguish section */
  elevated?: boolean;
}

export const FormSection = memo(function FormSection({
  children,
  className,
  elevated = false,
}: FormSectionProps) {
  return (
    <div 
      className={cn(
        "space-y-3",
        elevated && "p-3 rounded-xl bg-muted/30 border border-border/50",
        className
      )}
    >
      {children}
    </div>
  );
});

/**
 * FormDivider - Visual separator between form sections
 */
export const FormDivider = memo(function FormDivider({ 
  className 
}: { 
  className?: string 
}) {
  return (
    <div className={cn("h-px bg-border/40 my-4", className)} />
  );
});
