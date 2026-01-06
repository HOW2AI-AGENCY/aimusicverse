/**
 * Type Guards for Unified Components
 *
 * Type guard functions for discriminated union type narrowing
 */

// Dialog type guards
export function isModalDialogProps(
  props: any
): props is import('@/components/dialog/unified-dialog.types').ModalDialogProps {
  return props?.variant === 'modal';
}

export function isSheetDialogProps(
  props: any
): props is import('@/components/dialog/unified-dialog.types').SheetDialogProps {
  return props?.variant === 'sheet';
}

export function isAlertDialogProps(
  props: any
): props is import('@/components/dialog/unified-dialog.types').AlertDialogProps {
  return props?.variant === 'alert';
}
