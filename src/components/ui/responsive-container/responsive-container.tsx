/**
 * ResponsiveContainer Component
 *
 * A responsive container that adapts to different screen sizes and orientations.
 * Provides consistent max-width, padding, and centering across breakpoints.
 *
 * @example
 * ```tsx
 * <ResponsiveContainer size="lg">
 *   <header>My Header</header>
 *   <main>Content</main>
 * </ResponsiveContainer>
 * ```
 *
 * @feature Spec 001 - Phase 2: Foundational Components
 * @priority P1 - Mobile Optimization
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Maximum width of the container
   * @default 'xl'
   */
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";

  /**
   * Padding at different breakpoints
   * @default true
   */
  padding?: boolean;

  /**
   * Whether to center the container
   * @default true
   */
  center?: boolean;

  /**
   * Child elements
   */
  children: React.ReactNode;
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
};

export const ResponsiveContainer = React.forwardRef<HTMLDivElement, ResponsiveContainerProps>(
  ({ size = "xl", padding = true, center = true, className, children, ...props }, ref) => {
    const containerStyles = React.useMemo(() => {
      return cn(sizeStyles[size], center && "mx-auto", padding && "px-4 sm:px-6 lg:px-8", "w-full", className);
    }, [size, center, padding, className]);

    return (
      <div ref={ref} className={containerStyles} {...props}>
        {children}
      </div>
    );
  },
);

ResponsiveContainer.displayName = "ResponsiveContainer";
