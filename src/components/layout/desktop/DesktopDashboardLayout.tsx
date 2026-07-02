/**
 * DesktopDashboardLayout
 *
 * Two-column dashboard layout for analytics, profiles, and overview pages.
 * Automatically collapses to single column on mobile.
 */

import { memo, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GRID_COLS, MAX_WIDTHS, GAPS } from "@/lib/breakpoints";

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
  gap?: keyof typeof GAPS;
}

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
      {header && <div className={cn("mb-6", "2xl:mb-8")}>{header}</div>}

      {/* Two-column grid */}
      <div className={cn("grid", rightColumn ? GRID_COLS.dashboard : "grid-cols-1", GAPS[gap])}>
        {/* Left column */}
        <div className={cn(GAPS.md, "lg:gap-6 xl:gap-8")}>{leftColumn}</div>

        {/* Right column */}
        {rightColumn && <div className={cn(GAPS.md, "lg:gap-6 xl:gap-8")}>{rightColumn}</div>}
      </div>

      {/* Bottom section - full width */}
      {bottomSection && <div className={cn("mt-6 lg:mt-8 2xl:mt-10")}>{bottomSection}</div>}
    </div>
  );
});

export default DesktopDashboardLayout;
