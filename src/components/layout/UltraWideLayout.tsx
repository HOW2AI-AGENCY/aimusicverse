/**
 * Ultra-Wide Layout Component
 * Feature: 032-professional-ui (P3)
 * 
 * Optimized layouts for 2K+ monitors (1920px and above).
 * Provides centered content with sidebars for better readability.
 * 
 * @module UltraWideLayout
 */

import { ReactNode, memo } from 'react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface UltraWideLayoutProps {
  children: ReactNode;
  /** Left sidebar content (optional) */
  leftSidebar?: ReactNode;
  /** Right sidebar content (optional) */
  rightSidebar?: ReactNode;
  /** Main content max width */
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  /** Whether to center content when no sidebars */
  centered?: boolean;
  /** Additional className */
  className?: string;
}

const maxWidthClasses = {
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-6xl',
  '3xl': 'max-w-7xl',
  full: 'max-w-full',
};

/**
 * Layout optimized for ultra-wide screens (3xl: 1920px+)
 * 
 * Features:
 * - Optional left/right sidebars that appear on ultra-wide
 * - Centered main content with reasonable max-width
 * - Graceful degradation on smaller screens
 */
export const UltraWideLayout = memo(function UltraWideLayout({
  children,
  leftSidebar,
  rightSidebar,
  maxWidth = 'xl',
  centered = true,
  className,
}: UltraWideLayoutProps) {
  const isUltraWide = useMediaQuery('(min-width: 1920px)');
  const is4K = useMediaQuery('(min-width: 2560px)');
  
  // On smaller screens, render children directly
  if (!isUltraWide) {
    return <>{children}</>;
  }
  
  return (
    <div 
      className={cn(
        'flex w-full gap-6',
        is4K && 'gap-8',
        className
      )}
    >
      {/* Left Sidebar - sticky on ultra-wide */}
      {leftSidebar && (
        <aside 
          className={cn(
            'hidden 3xl:block flex-shrink-0',
            'w-64 4xl:w-80',
            'sticky top-6 h-fit max-h-[calc(100vh-3rem)]',
            'overflow-y-auto scrollbar-thin'
          )}
        >
          {leftSidebar}
        </aside>
      )}
      
      {/* Main Content */}
      <main 
        className={cn(
          'flex-1 min-w-0',
          centered && !leftSidebar && !rightSidebar && 'mx-auto',
          maxWidthClasses[maxWidth]
        )}
      >
        {children}
      </main>
      
      {/* Right Sidebar - sticky on ultra-wide */}
      {rightSidebar && (
        <aside 
          className={cn(
            'hidden 3xl:block flex-shrink-0',
            'w-64 4xl:w-80',
            'sticky top-6 h-fit max-h-[calc(100vh-3rem)]',
            'overflow-y-auto scrollbar-thin'
          )}
        >
          {rightSidebar}
        </aside>
      )}
    </div>
  );
});

interface UltraWideGridProps {
  children: ReactNode;
  /** Number of columns on ultra-wide screens */
  cols?: 4 | 5 | 6 | 7 | 8;
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

const gridColsClasses = {
  4: '3xl:grid-cols-4 4xl:grid-cols-5',
  5: '3xl:grid-cols-5 4xl:grid-cols-6',
  6: '3xl:grid-cols-6 4xl:grid-cols-7',
  7: '3xl:grid-cols-7 4xl:grid-cols-8',
  8: '3xl:grid-cols-8 4xl:grid-cols-9',
};

const gapClasses = {
  sm: 'gap-3 3xl:gap-4',
  md: 'gap-4 3xl:gap-5 4xl:gap-6',
  lg: 'gap-6 3xl:gap-8',
};

/**
 * Grid that expands columns on ultra-wide screens
 */
export const UltraWideGrid = memo(function UltraWideGrid({
  children,
  cols = 5,
  gap = 'md',
  className,
}: UltraWideGridProps) {
  return (
    <div 
      className={cn(
        'grid',
        'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5',
        gridColsClasses[cols],
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
});

interface UltraWideContainerProps {
  children: ReactNode;
  /** Padding on ultra-wide screens */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

const paddingClasses = {
  none: '',
  sm: '3xl:px-8 4xl:px-12',
  md: '3xl:px-12 4xl:px-16 ultrawide:px-24',
  lg: '3xl:px-16 4xl:px-24 ultrawide:px-32',
};

/**
 * Container with increased padding on ultra-wide screens
 * Prevents content from stretching too wide
 */
export const UltraWideContainer = memo(function UltraWideContainer({
  children,
  padding = 'md',
  className,
}: UltraWideContainerProps) {
  return (
    <div className={cn(paddingClasses[padding], className)}>
      {children}
    </div>
  );
});

export default UltraWideLayout;
