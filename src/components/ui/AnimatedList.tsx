/**
 * AnimatedList - Staggered animation for list items
 * Feature: UX Improvements
 *
 * Provides smooth stagger animations for lists with optimized performance
 */

import { memo, type ReactNode, type Key } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { staggerContainer, staggerItem } from "@/lib/motion-variants";
import { cn } from "@/lib/utils";

interface AnimatedListProps<T> {
  /** Items to render */
  items: T[];
  /** Key extractor for each item */
  keyExtractor: (item: T, index: number) => Key;
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Container className */
  className?: string;
  /** Item wrapper className */
  itemClassName?: string;
  /** Maximum items to animate (for performance) */
  maxAnimatedItems?: number;
  /** Layout direction */
  direction?: "vertical" | "horizontal";
  /** Gap between items */
  gap?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Skeleton to show when loading */
  loadingSkeleton?: ReactNode;
  /** Empty state component */
  emptyState?: ReactNode;
}

function AnimatedListInner<T>({
  items,
  keyExtractor,
  renderItem,
  className,
  itemClassName,
  maxAnimatedItems = 20,
  direction = "vertical",
  gap = 3,
  isLoading,
  loadingSkeleton,
  emptyState,
}: AnimatedListProps<T>) {
  // Show loading skeleton
  if (isLoading && loadingSkeleton) {
    return <>{loadingSkeleton}</>;
  }

  // Show empty state
  if (!isLoading && items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const containerStyles =
    direction === "vertical" ? `flex flex-col gap-${gap}` : `flex flex-row gap-${gap} overflow-x-auto`;

  // For large lists, skip stagger animation for performance
  const shouldAnimate = items.length <= maxAnimatedItems;

  if (!shouldAnimate) {
    return (
      <div className={cn(containerStyles, className)}>
        {items.map((item, index) => (
          <div key={keyExtractor(item, index)} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={cn(containerStyles, className)}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div key={keyExtractor(item, index)} variants={staggerItem} layout className={itemClassName}>
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

export const AnimatedList = memo(AnimatedListInner) as typeof AnimatedListInner;

/**
 * AnimatedGrid - Grid with stagger animations
 */
interface AnimatedGridProps<T> extends Omit<AnimatedListProps<T>, "direction"> {
  columns?: 2 | 3 | 4;
}

function AnimatedGridInner<T>({
  items,
  keyExtractor,
  renderItem,
  className,
  itemClassName,
  columns = 2,
  maxAnimatedItems = 12,
  isLoading,
  loadingSkeleton,
  emptyState,
}: AnimatedGridProps<T>) {
  // Show loading skeleton
  if (isLoading && loadingSkeleton) {
    return <>{loadingSkeleton}</>;
  }

  // Show empty state
  if (!isLoading && items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  };

  const shouldAnimate = items.length <= maxAnimatedItems;

  if (!shouldAnimate) {
    return (
      <div className={cn(`grid ${gridCols[columns]} gap-3`, className)}>
        {items.map((item, index) => (
          <div key={keyExtractor(item, index)} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={cn(`grid ${gridCols[columns]} gap-3`, className)}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div key={keyExtractor(item, index)} variants={staggerItem} layout className={itemClassName}>
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

export const AnimatedGrid = memo(AnimatedGridInner) as typeof AnimatedGridInner;

export default AnimatedList;
