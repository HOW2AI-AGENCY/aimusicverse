/**
 * FormSection - Visual container for form sections
 * Provides consistent spacing, background, and grouping
 * Uses design system tokens (Spec 032)
 */

import { memo, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { glass } from "@/lib/glass";

interface FormSectionProps {
  children: ReactNode;
  className?: string;
  /** Add subtle background to distinguish section */
  elevated?: boolean;
}

export const FormSection = memo(function FormSection({ children, className, elevated = false }: FormSectionProps) {
  return <div className={cn("space-y-3", elevated && cn("p-3 rounded-xl", glass.subtle), className)}>{children}</div>;
});

/**
 * FormDivider - Visual separator between form sections
 */
export const FormDivider = memo(function FormDivider({ className }: { className?: string }) {
  return <div className={cn("h-px bg-border/40 my-4", className)} />;
});
