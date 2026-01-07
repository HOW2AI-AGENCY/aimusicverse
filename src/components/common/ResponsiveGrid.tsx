/**
 * ResponsiveGrid - Unified responsive grid component
 * 
 * Centralizes grid column definitions and breakpoints for consistency
 */

import { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 'auto';
type GridGap = 1 | 2 | 3 | 4 | 5 | 6;

interface ResponsiveGridProps {
  /** Number of columns or 'auto' for auto-fill */
  columns?: GridColumns;
  /** Gap size (uses Tailwind gap scale) */
  gap?: GridGap;
  /** Children elements */
  children: ReactNode;
  /** Additional className */
  className?: string;
  /** Whether to use CSS Grid (default) or Flexbox */
  type?: 'grid' | 'flex';
  /** Minimum item width for 'auto' columns (default: 160px) */
  minItemWidth?: number;
}

const GRID_COLS: Record<GridColumns, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
  auto: '', // Handled separately with minItemWidth
};

const GAP_SIZES: Record<GridGap, string> = {
  1: 'gap-1',
  2: 'gap-2 sm:gap-2',
  3: 'gap-2 sm:gap-3',
  4: 'gap-3 sm:gap-4',
  5: 'gap-3 sm:gap-5',
  6: 'gap-4 sm:gap-6',
};

export const ResponsiveGrid = memo(function ResponsiveGrid({
  columns = 2,
  gap = 3,
  children,
  className,
  type = 'grid',
  minItemWidth = 160,
}: ResponsiveGridProps) {
  if (type === 'flex') {
    return (
      <div
        className={cn(
          "flex flex-wrap",
          GAP_SIZES[gap],
          className
        )}
      >
        {children}
      </div>
    );
  }

  const gridColsClass = columns === 'auto'
    ? undefined
    : GRID_COLS[columns];

  const gridStyle = columns === 'auto'
    ? { gridTemplateColumns: `repeat(auto-fill, minmax(${minItemWidth}px, 1fr))` }
    : undefined;

  return (
    <div
      className={cn(
        "grid",
        gridColsClass,
        GAP_SIZES[gap],
        className
      )}
      style={gridStyle}
    >
      {children}
    </div>
  );
});

/**
 * Preset grid configurations for common use cases
 */
export const GRID_PRESETS = {
  /** Track cards in library */
  tracks: { columns: 2 as const, gap: 3 as const },
  /** Project cards */
  projects: { columns: 3 as const, gap: 4 as const },
  /** User avatars */
  users: { columns: 4 as const, gap: 3 as const },
  /** Small badges/tags */
  tags: { columns: 'auto' as const, gap: 2 as const, minItemWidth: 80 },
} as const;
