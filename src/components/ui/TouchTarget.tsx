/**
 * TouchTarget — Accessibility wrapper ensuring minimum 44x44px tap area
 * Sprint 038-A: Foundation
 *
 * WCAG 2.5.5 (Target Size) requires interactive elements to be at least 44×44px.
 * Apple HIG recommends 44×44pt. Material Design recommends 48×48dp.
 *
 * This wrapper ensures the inner element has a minimum touch area of 44×44px
 * without changing its visual size (via negative margin centering trick).
 */
import React, { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TouchTargetProps extends HTMLAttributes<HTMLSpanElement> {
  /** Minimum touch target size in px. Default 44. */
  size?: number;
  as?: "span" | "div";
}

export function TouchTarget({ size = 44, as: Component = "span", className, children, ...rest }: TouchTargetProps) {
  return (
    <Component
      className={cn("inline-flex items-center justify-center shrink-0", className)}
      style={{
        minWidth: size,
        minHeight: size,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
}

/**
 * IconButton wrapper — ensures the icon inside has a 44×44px touch target.
 * Usage: <TouchIcon><X className="w-5 h-5" /></TouchIcon>
 */
export function TouchIcon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      role="button"
      tabIndex={0}
      className={cn(
        "inline-flex items-center justify-center shrink-0",
        "min-w-[44px] min-h-[44px]",
        "rounded-lg hover:bg-muted/50 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring",
        className,
      )}
    >
      {children}
    </span>
  );
}

export default TouchTarget;
