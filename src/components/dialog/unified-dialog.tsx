/**
 * UnifiedDialog Component
 *
 * Single entry point for all dialog/sheet/modal patterns with variant system
 *
 * @example
 * ```tsx
 * // Modal variant (desktop)
 * <UnifiedDialog
 *   variant="modal"
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Dialog Title"
 *   size="lg"
 * >
 *   Content
 * </UnifiedDialog>
 *
 * // Sheet variant (mobile)
 * <UnifiedDialog
 *   variant="sheet"
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Sheet Title"
 *   snapPoints={[0.25, 0.5, 0.9]}
 * >
 *   Content
 * </UnifiedDialog>
 *
 * // Alert variant (confirmation)
 * <UnifiedDialog
 *   variant="alert"
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete?"
 *   description="This cannot be undone"
 *   confirmLabel="Delete"
 *   onConfirm={handleDelete}
 *   severity="danger"
 * />
 * ```
 */

import React, { Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { UnifiedDialogProps } from './unified-dialog.types';
import { DIALOG_CONFIG } from './unified-dialog.config';
import { isModalDialogProps, isSheetDialogProps, isAlertDialogProps } from '@/lib/type-guards';

// Lazy load variants for code splitting
const ModalVariant = React.lazy(() => import('./variants/modal').then(m => ({ default: m.ModalDialog })));
const SheetVariant = React.lazy(() => import('./variants/sheet').then(m => ({ default: m.SheetDialog })));
const AlertVariant = React.lazy(() => import('./variants/alert').then(m => ({ default: m.AlertDialog })));

/**
 * Check if we're on mobile device
 */
function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Unified Dialog Component
 *
 * Routes to appropriate variant based on discriminant and device type
 */
export function UnifiedDialog(props: UnifiedDialogProps) {
  const { open, onOpenChange } = props;

  // Close on Escape key (accessibility)
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  // Auto-switch to sheet on mobile for modal variant
  if (isModalDialogProps(props) && isMobile() && DIALOG_CONFIG.mobile.useSheetOnMobile) {
    // Convert modal props to sheet props for mobile
    return (
      <AnimatePresence>
        {open && (
          <SheetVariant
            variant="sheet"
            open={open}
            onOpenChange={onOpenChange}
            title={props.title}
            snapPoints={[0.9]} // Full height on mobile
            closeOnDragDown={true}
          >
            {props.children}
            {props.footer && <div className="mt-4">{props.footer}</div>}
          </SheetVariant>
        )}
      </AnimatePresence>
    );
  }

  // Route to appropriate variant based on discriminant
  if (isModalDialogProps(props)) {
    return (
      <AnimatePresence>
        {open && (
          <Suspense fallback={<DialogFallback />}>
            <ModalVariant {...props} />
          </Suspense>
        )}
      </AnimatePresence>
    );
  }

  if (isSheetDialogProps(props)) {
    return (
      <AnimatePresence>
        {open && (
          <Suspense fallback={<DialogFallback />}>
            <SheetVariant {...props} />
          </Suspense>
        )}
      </AnimatePresence>
    );
  }

  if (isAlertDialogProps(props)) {
    return (
      <AnimatePresence>
        {open && (
          <Suspense fallback={<DialogFallback />}>
            <AlertVariant {...props} />
          </Suspense>
        )}
      </AnimatePresence>
    );
  }

  // Fallback (should never reach here with proper TypeScript types)
  return null;
}

/**
 * Fallback component shown during lazy loading
 */
function DialogFallback() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-background rounded-lg p-6"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <div className="animate-pulse">Loading...</div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Dialog Backdrop
 *
 * Shared backdrop component for modal and sheet variants
 */
export function DialogBackdrop({
  visible,
  onClick,
  blur = DIALOG_CONFIG.backdrop.blur,
  opacity = DIALOG_CONFIG.backdrop.opacity,
}: {
  visible: boolean;
  onClick?: () => void;
  blur?: string;
  opacity?: number;
}) {
  return (
    <motion.div
      className={cn(
        'fixed inset-0 z-40 bg-black',
        visible && 'pointer-events-auto'
      )}
      style={{
        backdropFilter: blur ? `blur(${blur})` : undefined,
        opacity: visible ? opacity : 0,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? opacity : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DIALOG_CONFIG.animations.close.duration / 1000 }}
      onClick={onClick}
      aria-hidden="true"
    />
  );
}

/**
 * Dialog Container
 *
 * Shared container wrapper with consistent styling
 */
export function DialogContainer({
  children,
  className,
  size = 'md',
}: {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }[size];

  return (
    <motion.div
      className={cn(
        'relative z-50 bg-background rounded-lg shadow-lg',
        'max-h-[90vh] overflow-auto',
        sizeClass,
        className
      )}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{
        duration: DIALOG_CONFIG.animations.open.duration / 1000,
        ease: DIALOG_CONFIG.animations.open.easing as any,
      }}
    >
      {children}
    </motion.div>
  );
}
