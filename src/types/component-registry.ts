/**
 * Component Registry
 *
 * Centralized type registry for all unified components
 */

export interface ComponentRegistry {
  Dialog: import('./dialog/unified-dialog.types').UnifiedDialogProps;
  Skeleton: import('./skeleton/unified-skeleton.types').UnifiedSkeletonProps;
  FormInput: import('./form/unified-form-input.types').UnifiedFormInputProps;
}
