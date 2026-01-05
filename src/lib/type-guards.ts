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

// Skeleton type guards
export function isTextSkeletonProps(
  props: any
): props is import('@/components/skeleton/unified-skeleton.types').TextSkeletonProps {
  return props?.variant === 'text';
}

export function isCardSkeletonProps(
  props: any
): props is import('@/components/skeleton/unified-skeleton.types').CardSkeletonProps {
  return props?.variant === 'card';
}

export function isListSkeletonProps(
  props: any
): props is import('@/components/skeleton/unified-skeleton.types').ListSkeletonProps {
  return props?.variant === 'list';
}

export function isImageSkeletonProps(
  props: any
): props is import('@/components/skeleton/unified-skeleton.types').ImageSkeletonProps {
  return props?.variant === 'image';
}

// Form input type guards
export function isTextInputProps(
  props: any
): props is import('@/components/form/unified-form-input.types').TextInputProps {
  return props?.variant === 'text';
}

export function isNumberInputProps(
  props: any
): props is import('@/components/form/unified-form-input.types').NumberInputProps {
  return props?.variant === 'number';
}

export function isSelectInputProps(
  props: any
): props is import('@/components/form/unified-form-input.types').SelectInputProps {
  return props?.variant === 'select';
}

export function isCheckboxInputProps(
  props: any
): props is import('@/components/form/unified-form-input.types').CheckboxInputProps {
  return props?.variant === 'checkbox';
}

export function isRadioInputProps(
  props: any
): props is import('@/components/form/unified-form-input.types').RadioInputProps {
  return props?.variant === 'radio';
}
