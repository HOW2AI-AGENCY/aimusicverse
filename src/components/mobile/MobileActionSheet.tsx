/**
 * MobileActionSheet - iOS-style action sheet for mobile
 * Clean, minimal, optimized for thumb reach
 */

import { memo, ReactNode } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/useHaptic';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionSheetAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'muted';
  disabled?: boolean;
}

interface ActionSheetGroup {
  title?: string;
  actions: ActionSheetAction[];
}

interface MobileActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  groups: ActionSheetGroup[];
  showCancel?: boolean;
  cancelLabel?: string;
}

export const MobileActionSheet = memo(function MobileActionSheet({
  open,
  onOpenChange,
  title,
  description,
  groups,
  showCancel = true,
  cancelLabel = 'Отмена',
}: MobileActionSheetProps) {
  const { patterns } = useHaptic();

  const handleClose = () => {
    patterns.tap();
    onOpenChange(false);
  };

  const handleAction = (action: ActionSheetAction) => {
    if (action.disabled) return;
    
    if (action.variant === 'destructive') {
      patterns.warning();
    } else {
      patterns.select();
    }
    
    action.onClick();
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-sheet-backdrop"
            onClick={handleClose}
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            className="fixed bottom-0 left-0 right-0 z-50 p-3"
            style={{
              paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
            }}
          >
            {/* Main Content */}
            <div className="bg-card rounded-2xl overflow-hidden shadow-2xl">
              {/* Header */}
              {(title || description) && (
                <div className="px-4 py-3 border-b border-border/50 text-center">
                  {title && (
                    <p className="text-sm font-semibold">{title}</p>
                  )}
                  {description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  )}
                </div>
              )}
              
              {/* Action Groups */}
              {groups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {group.title && (
                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {group.title}
                    </div>
                  )}
                  <div className="divide-y divide-border/50">
                    {group.actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={() => handleAction(action)}
                        disabled={action.disabled}
                        className={cn(
                          "w-full px-4 py-3.5 flex items-center justify-center gap-2",
                          "text-sm font-medium transition-colors",
                          "active:bg-muted/50",
                          action.disabled && "opacity-50 cursor-not-allowed",
                          action.variant === 'destructive' && "text-destructive",
                          action.variant === 'muted' && "text-muted-foreground"
                        )}
                      >
                        {action.icon && (
                          <span className="w-5 h-5">{action.icon}</span>
                        )}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Cancel Button */}
            {showCancel && (
              <button
                onClick={handleClose}
                className="w-full mt-2 bg-card rounded-2xl py-3.5 text-sm font-semibold text-primary active:bg-muted/50 transition-colors"
              >
                {cancelLabel}
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default MobileActionSheet;
