/**
 * SafeArea Component
 *
 * A component that applies safe area insets for iOS devices with notches,
 * Dynamic Island, or home indicators. Ensures content is not obscured by
 * hardware elements.
 *
 * @example
 * ```tsx
 * <SafeArea edges={['top', 'bottom']}>
 *   <header>My Header</header>
 *   <main>Content</main>
 *   <footer>My Footer</footer>
 * </SafeArea>
 * ```
 *
 * @feature Spec 001 - Phase 2: Foundational Components
 * @priority P1 - Mobile Optimization
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SafeAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Which edges to apply safe area insets to
   * @default ['top', 'bottom']
   */
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;

  /**
   * Minimum padding to apply if safe area inset is smaller
   * @default 16
   */
  minPadding?: number;

  /**
   * Child elements that need safe area spacing
   */
  children: React.ReactNode;
}

export const SafeArea = React.forwardRef<HTMLDivElement, SafeAreaProps>(
  ({
    edges = ['top', 'bottom'],
    minPadding = 16,
    className,
    children,
    ...props
  }, ref) => {
    const edgeStyles = React.useMemo(() => {
      const styles: Record<string, string> = {};

      if (edges.includes('top')) {
        styles.paddingTop = `max(env(safe-area-inset-top), ${minPadding}px)`;
      }

      if (edges.includes('bottom')) {
        styles.paddingBottom = `max(env(safe-area-inset-bottom), ${minPadding}px)`;
      }

      if (edges.includes('left')) {
        styles.paddingLeft = `max(env(safe-area-inset-left), ${minPadding}px)`;
      }

      if (edges.includes('right')) {
        styles.paddingRight = `max(env(safe-area-inset-right), ${minPadding}px)`;
      }

      return styles;
    }, [edges, minPadding]);

    return (
      <div
        ref={ref}
        className={cn('safe-area-wrapper', className)}
        style={edgeStyles}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SafeArea.displayName = 'SafeArea';
