/**
 * Unified Dialog Component Family - Type Definitions
 *
 * Component: UnifiedDialog
 * Variants: modal, sheet, alert
 * Purpose: Single entry point for all dialog/sheet/modal patterns
 *
 * These are the TypeScript type definitions for the unified dialog component.
 * Implementation files will import these types from src/components/dialog/unified-dialog.types.ts
 */

import type { ReactNode } from 'react';

/**
 * Base dialog properties shared across all variants
 */
export interface BaseDialogProps {
  /** Whether the dialog is currently open */
  open: boolean;
  /** Callback when the open state changes */
  onOpenChange: (open: boolean) => void;
  /** Optional CSS class name for custom styling */
  className?: string;
  /** Optional children to render in dialog content */
  children?: ReactNode;
}

/**
 * Modal variant - Full-screen overlay for desktop
 *
 * Usage: Primary dialog pattern for desktop views, confirmation dialogs,
 * and complex multi-field forms.
 */
export interface ModalDialogProps extends BaseDialogProps {
  /** Discriminant: 'modal' variant */
  variant: 'modal';
  /** Dialog title */
  title: string;
  /** Optional description or subtitle */
  description?: string;
  /** Dialog content */
  children: ReactNode;
  /** Optional footer content (buttons, actions) */
  footer?: ReactNode;
  /** Dialog size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Close when clicking overlay backdrop */
  closeOnOverlayClick?: boolean;
  /** Close when pressing Escape key */
  closeOnEscape?: boolean;
}

/**
 * Sheet variant - Bottom sheet for mobile with swipe-to-dismiss
 *
 * Usage: Mobile-first dialog pattern, forms, menus, filters,
 * and detail views on mobile devices.
 */
export interface SheetDialogProps extends BaseDialogProps {
  /** Discriminant: 'sheet' variant */
  variant: 'sheet';
  /** Sheet title */
  title: string;
  /** Sheet content */
  children: ReactNode;
  /** Snap points as percentages of viewport height (e.g., [0.25, 0.5, 0.9]) */
  snapPoints?: number[];
  /** Default snap point index */
  defaultSnapPoint?: number;
  /** Enable close on swipe down */
  closeOnDragDown?: boolean;
}

/**
 * Alert variant - Confirmation dialog with confirm/cancel actions
 *
 * Usage: Destructive actions (delete, remove), confirmation dialogs,
 * and critical decisions requiring explicit user confirmation.
 */
export interface AlertDialogProps extends BaseDialogProps {
  /** Discriminant: 'alert' variant */
  variant: 'alert';
  /** Alert title */
  title: string;
  /** Alert description */
  description: string;
  /** Confirm button label */
  confirmLabel: string;
  /** Optional cancel button label */
  cancelLabel?: string;
  /** Confirm action callback */
  onConfirm: () => void | Promise<void>;
  /** Optional cancel action callback */
  onCancel?: () => void;
  /** Alert severity level */
  severity?: 'danger' | 'warning' | 'info';
}

/**
 * Unified Dialog Props - Discriminated Union
 *
 * The 'variant' property acts as the discriminant, allowing TypeScript
 * to narrow the type and provide accurate intellisense for each variant.
 */
export type UnifiedDialogProps =
  | ModalDialogProps
  | SheetDialogProps
  | AlertDialogProps;

/**
 * Dialog state management hook return type
 */
export interface UseDialogStateReturn {
  /** Whether the dialog is currently open */
  isOpen: boolean;
  /** Function to open the dialog */
  open: () => void;
  /** Function to close the dialog */
  close: () => void;
  /** Function to toggle the dialog state */
  toggle: () => void;
}

/**
 * Dialog configuration options
 */
export interface DialogConfig {
  /** Default animation duration in milliseconds */
  animationDuration?: number;
  /** Enable backdrop blur effect */
  backdropBlur?: boolean;
  /** Enable focus trap (accessibility) */
  focusTrap?: boolean;
  /** Enable restore focus on close (accessibility) */
  restoreFocus?: boolean;
}

/**
 * Dialog gesture controls (mobile)
 */
export interface DialogGestures {
  /** Enable swipe-to-close gesture */
  swipeToClose?: boolean;
  /** Enable drag-to-move gesture */
  dragToMove?: boolean;
  /** Minimum swipe distance to trigger close (pixels) */
  swipeThreshold?: number;
  /** Haptic feedback on gesture start */
  hapticOnStart?: boolean;
  /** Haptic feedback on gesture complete */
  hapticOnComplete?: boolean;
}

/**
 * Type guard for modal variant
 */
export function isModalDialogProps(
  props: UnifiedDialogProps
): props is ModalDialogProps {
  return props.variant === 'modal';
}

/**
 * Type guard for sheet variant
 */
export function isSheetDialogProps(
  props: UnifiedDialogProps
): props is SheetDialogProps {
  return props.variant === 'sheet';
}

/**
 * Type guard for alert variant
 */
export function isAlertDialogProps(
  props: UnifiedDialogProps
): props is AlertDialogProps {
  return props.variant === 'alert';
}
