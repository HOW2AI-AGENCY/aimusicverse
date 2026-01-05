/**
 * Unified Dialog Component Family - Exports
 *
 * Main exports and type definitions for the unified dialog component
 */

// Main component
export { UnifiedDialog, DialogBackdrop, DialogContainer } from './unified-dialog';

// Types
export type {
  UnifiedDialogProps,
  ModalDialogProps,
  SheetDialogProps,
  AlertDialogProps,
  BaseDialogProps,
  UseDialogStateReturn,
  DialogConfig,
  DialogGestures,
} from './unified-dialog.types';

// Type guards
export {
  isModalDialogProps,
  isSheetDialogProps,
  isAlertDialogProps,
} from './unified-dialog.types';

// Config
export { DIALOG_CONFIG, DIALOG_PRESETS } from './unified-dialog.config';
