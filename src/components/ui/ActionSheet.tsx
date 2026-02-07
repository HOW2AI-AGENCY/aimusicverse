/**
 * Action Sheet Component
 * Feature: 032-professional-ui
 * 
 * iOS-style action sheet for mobile actions
 */

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { triggerHapticFeedback } from '@/lib/mobile-utils';
import { LucideIcon } from 'lucide-react';

interface ActionItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  variant?: 'default' | 'destructive' | 'primary';
  disabled?: boolean;
  onSelect: () => void;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  actions: ActionItem[];
  cancelLabel?: string;
  className?: string;
}

export function ActionSheet({
  isOpen,
  onClose,
  title,
  description,
  actions,
  cancelLabel = 'Отмена',
  className,
}: ActionSheetProps) {
  const handleSelect = (action: ActionItem) => {
    if (action.disabled) return;
    
    triggerHapticFeedback('medium');
    action.onSelect();
    onClose();
  };

  const handleCancel = () => {
    triggerHapticFeedback('light');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay - theme-aware backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/50 dark:bg-black/50 backdrop-blur-sm z-50"
            onClick={handleCancel}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 p-2",
              "safe-area-inset-bottom",
              className
            )}
          >
            {/* Actions group */}
            <div className="bg-card rounded-xl overflow-hidden mb-2 shadow-lg">
              {/* Header */}
              {(title || description) && (
                <div className="px-4 py-3 text-center border-b border-border">
                  {title && (
                    <p className="text-sm font-medium text-muted-foreground">
                      {title}
                    </p>
                  )}
                  {description && (
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {description}
                    </p>
                  )}
                </div>
              )}

              {/* Action items */}
              {actions.map((action, index) => {
                const Icon = action.icon;
                
                return (
                  <motion.button
                    key={action.id}
                    whileTap={{ scale: 0.98, backgroundColor: 'hsl(var(--accent))' }}
                    onClick={() => handleSelect(action)}
                    disabled={action.disabled}
                    className={cn(
                      "w-full px-4 py-3.5",
                      "flex items-center justify-center gap-2",
                      "text-base font-medium",
                      "transition-colors",
                      "border-b border-border last:border-b-0",
                      // Variants
                      action.variant === 'destructive' && "text-destructive",
                      action.variant === 'primary' && "text-primary",
                      action.variant === 'default' && "text-foreground",
                      !action.variant && "text-primary",
                      // Disabled
                      action.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    {action.label}
                  </motion.button>
                );
              })}
            </div>

            {/* Cancel button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleCancel}
              className={cn(
                "w-full px-4 py-3.5",
                "bg-card rounded-xl",
                "text-base font-semibold text-primary",
                "shadow-lg"
              )}
            >
              {cancelLabel}
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ActionSheet;
