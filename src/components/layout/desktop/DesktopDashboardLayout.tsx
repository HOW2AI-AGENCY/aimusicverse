/**
 * DesktopDashboardLayout
 *
 * Two-column dashboard layout for analytics, profiles, and overview pages.
 * Automatically collapses to single column on mobile.
 */

import { memo, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GRID_COLS, MAX_WIDTHS } from "@/lib/breakpoints";

interface DesktopDashboardLayoutProps {
  /** Header section (full width) */
  header?: ReactNode;
  /** Left column content */
  leftColumn: ReactNode;
  /** Right column content */
  rightColumn?: ReactNode;
  /** Bottom section (full width, below columns) */
  bottomSection?: ReactNode;
  /** Max width preset */
  maxWidth?: keyof typeof MAX_WIDTHS;
  /** Custom className for the container */
  className?: string;
  /** Gap between columns */
  gap?: "sm" | "md" | "lg" | "xl";
}

const gapClasses = {
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

export const DesktopDashboardLayout = memo(function DesktopDashboardLayout({
  header,
  leftColumn,
  rightColumn,
  bottomSection,
  maxWidth = "wide",
  className,
  gap = "lg",
}: DesktopDashboardLayoutProps) {
  return (
    <div className={cn("w-full mx-auto px-4 lg:px-6 py-4 lg:py-6", MAX_WIDTHS[maxWidth], className)}>
      {/* Header - full width */}
      {header && <div className="mb-6">{header}</div>}

      {/* Two-column grid */}
      <div className={cn("grid", rightColumn ? GRID_COLS.dashboard : "grid-cols-1", gapClasses[gap])}>
        {/* Left column */}
        <div className="space-y-4 lg:space-y-6">{leftColumn}</div>

        {/* Right column */}
        {rightColumn && <div className="space-y-4 lg:space-y-6">{rightColumn}</div>}
      </div>

      {/* Bottom section - full width */}
      {bottomSection && <div className="mt-6 lg:mt-8">{bottomSection}</div>}
    </div>
  );
});

export default DesktopDashboardLayout;
