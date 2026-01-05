/**
 * Alert Dialog Variant
 *
 * Confirmation dialog for destructive actions
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
import type { AlertDialogProps } from '../unified-dialog.types';

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  severity = 'danger',
}: AlertDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsConfirming(false);
    }
  };

  // Severity styling
  const severityConfig = {
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-500',
      borderColor: 'border-red-500',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
      borderColor: 'border-yellow-500',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500',
      borderColor: 'border-blue-500',
    },
  }[severity];

  const Icon = severityConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <DialogBackdrop visible={open} />

      {/* Alert Container */}
      <DialogContainer size="sm" className="max-w-md">
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={cn(
              'w-12 h-12 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center',
              severityConfig.bgColor,
              severityConfig.iconColor.replace('text-', 'bg-opacity-10 bg-')
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
              onClick={() => onOpenChange(false)}
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
                'text-white',
                severity === 'danger' && 'bg-red-500 hover:bg-red-600',
                severity === 'warning' && 'bg-yellow-500 hover:bg-yellow-600 text-black',
                severity === 'info' && 'bg-blue-500 hover:bg-blue-600',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isConfirming ? 'Confirming...' : confirmLabel}
            </button>
          </div>
        </div>
      </DialogContainer>
    </div>
  );
}
