/**
 * T064 - Confirmation Dialog for Destructive Actions
 * 
 * Provides a reusable confirmation dialog with:
 * - Haptic feedback integration
 * - Customizable title, description, and action labels
 * - Support for destructive (red) and normal actions
 * - Keyboard shortcuts (Enter to confirm, Esc to cancel)
 * - Mobile-optimized layout with touch-friendly buttons
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useHapticFeedback } from '@/lib/mobile-utils';
import { useEffect } from 'react';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'default';
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const triggerWarningHaptic = useHapticFeedback('warning');
  const triggerSelectionHaptic = useHapticFeedback('selection');

  // Trigger warning haptic when dialog opens for destructive actions
  useEffect(() => {
    if (open && variant === 'destructive') {
      triggerWarningHaptic();
    }
  }, [open, variant, triggerWarningHaptic]);

  const handleConfirm = () => {
    triggerSelectionHaptic();
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    triggerSelectionHaptic();
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={handleCancel} className="w-full sm:w-auto">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto'
                : 'w-full sm:w-auto'
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * TODO: T064 - Future enhancements for confirmation dialogs
 * 
 * Planned features:
 * 1. Support for "Don't show this again" checkbox
 * 2. Custom icon support (info, warning, error, success)
 * 3. Input field for double-confirmation (e.g., "type DELETE to confirm")
 * 4. Timer-based confirmation (can't confirm for first 2 seconds)
 * 5. Preview of action consequences (e.g., "This will delete 5 tracks")
 * 6. Undo functionality with toast notification
 * 7. Batch confirmations (confirm multiple actions at once)
 * 8. Keyboard shortcuts for power users (Cmd+Enter to confirm)
 * 9. Animation transitions for better UX
 * 10. Accessibility improvements (screen reader support, focus management)
 */
