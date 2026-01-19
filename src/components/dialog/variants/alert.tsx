/**
 * Alert Dialog Variant
 *
 * Confirmation dialog for destructive actions with haptic feedback
 *
 * @example
 * ```tsx
 * <AlertDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Track?"
 *   description="This action cannot be undone. All versions will be permanently deleted."
 *   confirmLabel="Delete"
 *   cancelLabel="Cancel"
 *   onConfirm={async () => {
 *     await deleteTrack(trackId);
 *     onOpenChange(false);
 *   }}
 *   severity="danger"
 * />
 * ```
 */

import { useEffect, useState } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { DialogBackdrop, DialogContainer } from '../unified-dialog';
import { useHapticFeedback } from '@/lib/mobile-utils';
import type { AlertDialogProps } from '../unified-dialog.types';

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Отмена',
  onConfirm,
  onCancel,
  severity = 'danger',
}: AlertDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const triggerWarningHaptic = useHapticFeedback('warning');
  const triggerSelectionHaptic = useHapticFeedback('selection');

  // Trigger warning haptic when dialog opens for danger severity
  useEffect(() => {
    if (open && severity === 'danger') {
      triggerWarningHaptic();
    }
  }, [open, severity, triggerWarningHaptic]);

  const handleConfirm = async () => {
    setIsConfirming(true);
    triggerSelectionHaptic();
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    triggerSelectionHaptic();
    onCancel?.();
    onOpenChange(false);
  };

  // Severity styling
  const severityConfig = {
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500',
      buttonBg: 'bg-destructive hover:bg-destructive/90',
      buttonText: 'text-destructive-foreground',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500',
      buttonBg: 'bg-yellow-500 hover:bg-yellow-600',
      buttonText: 'text-black',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500',
      buttonBg: 'bg-primary hover:bg-primary/90',
      buttonText: 'text-primary-foreground',
    },
  }[severity];

  const Icon = severityConfig.icon;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <DialogBackdrop visible={open} />

      {/* Alert Container */}
      <DialogContainer size="sm" className="max-w-md">
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={cn(
              'w-12 h-12 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center',
              severityConfig.bgColor
            )}>
              <Icon className={cn('w-6 h-6', severityConfig.iconColor)} />
            </div>
          </div>

          {/* Title & Description */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold mb-2">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-center">
            <button
              onClick={handleCancel}
              disabled={isConfirming}
              className={cn(
                'w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-md font-medium transition-colors',
                'border border-input bg-background hover:bg-accent',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              className={cn(
                'w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-md font-medium transition-colors',
                severityConfig.buttonBg,
                severityConfig.buttonText,
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isConfirming ? 'Выполняется...' : confirmLabel}
            </button>
          </div>
        </div>
      </DialogContainer>
    </div>
  );
}
