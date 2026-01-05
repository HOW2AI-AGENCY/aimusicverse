/**
 * Modal Dialog Variant
 *
 * Full-screen overlay dialog for desktop views
 *
 * @example
 * ```tsx
 * <ModalDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Settings"
 *   description="Configure your preferences"
 *   size="lg"
 *   closeOnOverlayClick={true}
 *   closeOnEscape={true}
 * >
 *   <p>Settings content</p>
 *   <div className="flex justify-end gap-2 mt-4">
 *     <button onClick={close}>Cancel</button>
 *     <button onClick={save}>Save</button>
 *   </div>
 * </ModalDialog>
 * ```
 */

import { useEffect, useRef } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { DialogBackdrop, DialogContainer } from '../unified-dialog';
import { DIALOG_CONFIG } from '../unified-dialog.config';
import type { ModalDialogProps } from '../unified-dialog.types';

export function ModalDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
}: ModalDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Focus trap: keep focus within dialog
  useEffect(() => {
    if (!open) return;

    const content = contentRef.current;
    if (!content) return;

    // Focus first focusable element
    const focusableElements = content.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    firstElement?.focus();

    // Trap focus within dialog
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const first = focusableElements[0] as HTMLElement;
      const last = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [open]);

  // Restore focus to trigger element on close
  const triggerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement;
    }
    return () => {
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <DialogBackdrop
        visible={open}
        onClick={closeOnOverlayClick ? () => onOpenChange(false) : undefined}
      />

      {/* Modal Container */}
      <DialogContainer size={size} className={className}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-accent transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6" ref={contentRef} role="dialog" aria-modal="true" aria-labelledby={title}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t bg-muted/30">
            {footer}
          </div>
        )}
      </DialogContainer>
    </div>
  );
}
