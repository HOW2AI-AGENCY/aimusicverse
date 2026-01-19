/**
 * Confirmation Dialog for Destructive Actions
 * 
 * Unified wrapper around UnifiedDialog alert variant
 * Provides backwards compatibility with existing API
 */

import { UnifiedDialog } from '@/components/dialog';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'default';
  onConfirm: () => void | Promise<void>;
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
  // Map variant to severity
  const severity = variant === 'destructive' ? 'danger' : 'info';

  return (
    <UnifiedDialog
      variant="alert"
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onConfirm={onConfirm}
      onCancel={onCancel}
      severity={severity}
    />
  );
}
