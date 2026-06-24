/**
 * Telegram-Optimized List Component
 * Feature: 032-professional-ui
 * 
 * List with haptic feedback, swipe actions, and pull-to-refresh
 */

import React, { ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { SwipeableListItem } from '@/components/ui/SwipeableListItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { hapticPatterns } from './TelegramHaptics';
import { Search, Music } from 'lucide-react';

interface TelegramListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  onRefresh?: () => Promise<void>;
  onItemPress?: (item: T, index: number) => void;
  emptyState?: {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  loading?: boolean;
  loadingSkeleton?: ReactNode;
  pullToRefresh?: boolean;
  staggerAnimation?: boolean;
  className?: string;
  listClassName?: string;
}

export function TelegramList<T>({
  items,
  renderItem,
  keyExtractor,
  onRefresh,
  onItemPress,
  emptyState,
  loading,
  loadingSkeleton,
  pullToRefresh = true,
  staggerAnimation = true,
  className,
  listClassName,
}: TelegramListProps<T>) {
  const handleItemPress = useCallback((item: T, index: number) => {
    hapticPatterns.itemSelect();
    onItemPress?.(item, index);
  }, [onItemPress]);

  const content = (
    <div className={cn("flex flex-col", listClassName)}>
      {loading && loadingSkeleton ? (
        loadingSkeleton
      ) : items.length === 0 && emptyState ? (
        <EmptyState
          icon={emptyState.icon || <Music className="w-12 h-12" />}
          title={emptyState.title}
          description={emptyState.description}
          action={emptyState.action}
        />
      ) : (
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <motion.div
              key={keyExtractor(item, index)}
              initial={staggerAnimation ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.2,
                delay: staggerAnimation ? index * 0.05 : 0,
              }}
              onClick={() => handleItemPress(item, index)}
              className="cursor-pointer"
            >
              {renderItem(item, index)}
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );

  if (pullToRefresh && onRefresh) {
    return (
      <PullToRefresh
        onRefresh={onRefresh}
        className={cn("flex-1 overflow-auto", className)}
      >
        {content}
      </PullToRefresh>
    );
  }

  return (
    <div className={cn("flex-1 overflow-auto", className)}>
      {content}
    </div>
  );
}

/**
 * Telegram-Optimized Grid Component
 */
interface TelegramGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  onRefresh?: () => Promise<void>;
  onItemPress?: (item: T, index: number) => void;
  emptyState?: {
    icon?: ReactNode;
    title: string;
    description?: string;
  };
  loading?: boolean;
  loadingSkeleton?: ReactNode;
  className?: string;
}

export function TelegramGrid<T>({
  items,
  renderItem,
  keyExtractor,
  columns = 2,
  gap = 'md',
  onRefresh,
  onItemPress,
  emptyState,
  loading,
  loadingSkeleton,
  className,
}: TelegramGridProps<T>) {
  const handleItemPress = useCallback((item: T, index: number) => {
    hapticPatterns.itemSelect();
    onItemPress?.(item, index);
  }, [onItemPress]);

  const columnClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };

  const content = (
    <>
      {loading && loadingSkeleton ? (
        loadingSkeleton
      ) : items.length === 0 && emptyState ? (
        <EmptyState
          icon={emptyState.icon || <Search className="w-12 h-12" />}
          title={emptyState.title}
          description={emptyState.description}
        />
      ) : (
        <div className={cn(
          "grid",
          columnClasses[columns],
          gapClasses[gap]
        )}>
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <motion.div
                key={keyExtractor(item, index)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.03,
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleItemPress(item, index)}
                className="cursor-pointer"
              >
                {renderItem(item, index)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );

  if (onRefresh) {
    return (
      <PullToRefresh
        onRefresh={onRefresh}
        className={cn("flex-1 overflow-auto", className)}
      >
        {content}
      </PullToRefresh>
    );
  }

  return (
    <div className={cn("flex-1 overflow-auto", className)}>
      {content}
    </div>
  );
}

export default TelegramList;
