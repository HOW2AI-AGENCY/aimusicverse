/**
 * DesktopToolsGridLayout
 * 
 * Grid layout for tools and feature cards (AudioHub, CreativeTools, etc.)
 * Responsive 1-4 columns based on viewport.
 */

import { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GRID_COLS, MAX_WIDTHS } from '@/lib/breakpoints';

interface DesktopToolsGridLayoutProps {
  /** Header section */
  header?: ReactNode;
  /** Quick actions bar (horizontal, above grid) */
  quickActions?: ReactNode;
  /** Grid items */
  children: ReactNode;
  /** Grid configuration preset */
  gridType?: keyof typeof GRID_COLS;
  /** Max width preset */
  maxWidth?: keyof typeof MAX_WIDTHS;
  /** Custom className */
  className?: string;
  /** Bottom section */
  bottomSection?: ReactNode;
}

export const DesktopToolsGridLayout = memo(function DesktopToolsGridLayout({
  header,
  quickActions,
  children,
  gridType = 'tools',
  maxWidth = 'wide',
  className,
  bottomSection,
}: DesktopToolsGridLayoutProps) {
  return (
    <div className={cn(
      'w-full mx-auto px-4 lg:px-6 py-4 lg:py-6',
      MAX_WIDTHS[maxWidth],
      className
    )}>
      {/* Header */}
      {header && (
        <div className="mb-4 lg:mb-6">
          {header}
        </div>
      )}

      {/* Quick actions bar */}
      {quickActions && (
        <div className="mb-4 lg:mb-6 flex flex-wrap gap-2 lg:gap-3">
          {quickActions}
        </div>
      )}

      {/* Tools grid */}
      <div className={cn('grid', GRID_COLS[gridType])}>
        {children}
      </div>

      {/* Bottom section */}
      {bottomSection && (
        <div className="mt-6 lg:mt-8">
          {bottomSection}
        </div>
      )}
    </div>
  );
});

export default DesktopToolsGridLayout;
