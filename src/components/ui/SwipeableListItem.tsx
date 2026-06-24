/**
 * Swipeable List Item Component
 * Feature: 032-professional-ui
 * 
 * List item with reveal actions on swipe
 */

import React, { ReactNode } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useSwipeActions } from '@/hooks/useSwipeActions';

interface SwipeAction {
  id: string;
  icon: ReactNode;
  label: string;
  color: string;
  onAction: () => void;
}

interface SwipeableListItemProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

export function SwipeableListItem({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  disabled,
  className,
}: SwipeableListItemProps) {
  const {
    offset,
    isOpen,
    activeAction,
    handlers,
    executeAction,
    close,
  } = useSwipeActions({
    leftActions,
    rightActions,
    threshold,
    disabled,
  });

  const hasLeft = leftActions.length > 0;
  const hasRight = rightActions.length > 0;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Left actions (revealed when swiping right) */}
      {hasLeft && (
        <div className="absolute inset-y-0 left-0 flex items-stretch">
          {leftActions.map((action) => (
            <motion.button
              key={action.id}
              className={cn(
                "flex flex-col items-center justify-center px-4",
                "text-white font-medium text-xs gap-1",
                action.color
              )}
              style={{ width: threshold }}
              onClick={() => executeAction(action.id)}
              animate={{
                scale: activeAction === action.id ? 1.1 : 1,
              }}
            >
              {action.icon}
              <span>{action.label}</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Right actions (revealed when swiping left) */}
      {hasRight && (
        <div className="absolute inset-y-0 right-0 flex items-stretch">
          {rightActions.map((action) => (
            <motion.button
              key={action.id}
              className={cn(
                "flex flex-col items-center justify-center px-4",
                "text-white font-medium text-xs gap-1",
                action.color
              )}
              style={{ width: threshold }}
              onClick={() => executeAction(action.id)}
              animate={{
                scale: activeAction === action.id ? 1.1 : 1,
              }}
            >
              {action.icon}
              <span>{action.label}</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Main content */}
      <motion.div
        className="relative bg-background"
        style={{ x: offset }}
        {...handlers}
        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        onClick={() => {
          if (isOpen) {
            close();
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default SwipeableListItem;
