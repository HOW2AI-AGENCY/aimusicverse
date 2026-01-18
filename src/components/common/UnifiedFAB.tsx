/**
 * UnifiedFAB - Universal Floating Action Button
 * 
 * Variants:
 * - single: Single action button
 * - expandable: Expandable menu with multiple actions
 * - fullWidth: Full-width bottom button
 */

import React, { useState, useCallback } from 'react';
import { LucideIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useHaptic } from '@/hooks/useHaptic';
import { touchTarget } from '@/lib/touch-target';

export interface FABAction {
  id: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'success';
}

export interface UnifiedFABProps {
  variant?: 'single' | 'expandable' | 'fullWidth';
  icon?: LucideIcon;
  label?: string;
  actions?: FABAction[];
  visible?: boolean;
  loading?: boolean;
  disabled?: boolean;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  withSafeArea?: boolean;
  className?: string;
  onClick?: () => void;
}

const positionClasses = {
  'bottom-right': 'right-4',
  'bottom-center': 'left-1/2 -translate-x-1/2',
  'bottom-left': 'left-4',
} as const;

export function UnifiedFAB({
  variant = 'single',
  icon: Icon,
  label,
  actions = [],
  visible = true,
  loading = false,
  disabled = false,
  position = 'bottom-right',
  withSafeArea = true,
  className,
  onClick,
}: UnifiedFABProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { impact } = useHaptic();

  const handleClick = useCallback(() => {
    impact('light');
    if (variant === 'expandable') {
      setIsExpanded(prev => !prev);
    } else {
      onClick?.();
    }
  }, [variant, onClick, impact]);

  const handleActionClick = useCallback((action: FABAction) => {
    impact('medium');
    action.onClick();
    setIsExpanded(false);
  }, [impact]);

  const bottomStyle = withSafeArea
    ? 'calc(max(var(--tg-content-safe-area-inset-bottom, 0px), var(--tg-safe-area-inset-bottom, 0px)) + 5rem)'
    : '1.25rem';

  // Full width variant
  if (variant === 'fullWidth') {
    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed left-0 right-0 z-50 px-4',
              className
            )}
            style={{ bottom: bottomStyle }}
          >
            <Button
              onClick={handleClick}
              disabled={disabled || loading}
              className={cn(
                'w-full gap-2',
                touchTarget.large
              )}
            >
              {Icon && <Icon className="w-5 h-5" />}
              {label}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Single or expandable variant
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={cn(
            'fixed z-50',
            positionClasses[position],
            className
          )}
          style={{ bottom: bottomStyle }}
        >
          {/* Expandable actions */}
          <AnimatePresence>
            {variant === 'expandable' && isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-16 right-0 flex flex-col gap-2 items-end"
              >
                {actions.map((action, index) => {
                  const ActionIcon = action.icon;
                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-xs bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm whitespace-nowrap">
                        {action.label}
                      </span>
                      <Button
                        size="icon"
                        variant={action.variant === 'destructive' ? 'destructive' : 'secondary'}
                        className={cn(touchTarget.icon, 'rounded-full shadow-lg')}
                        onClick={() => handleActionClick(action)}
                        disabled={action.disabled}
                      >
                        <ActionIcon className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main FAB button */}
          <Button
            size="icon"
            onClick={handleClick}
            disabled={disabled || loading}
            className={cn(
              'rounded-full shadow-xl',
              touchTarget.icon,
              'w-14 h-14',
              isExpanded && 'rotate-45'
            )}
            style={{ transition: 'transform 0.2s ease' }}
          >
            {isExpanded ? (
              <X className="w-6 h-6" />
            ) : Icon ? (
              <Icon className="w-6 h-6" />
            ) : null}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
