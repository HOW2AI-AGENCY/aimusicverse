/**
 * Modal Dialog Variant
 *
 * Full-screen overlay dialog for desktop views
 * Optimized for Telegram Mini App with safe area support
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

import { useEffect, useRef, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { DialogBackdrop, DialogContainer } from '../unified-dialog';
import { DIALOG_CONFIG } from '../unified-dialog.config';
import type { ModalDialogProps } from '../unified-dialog.types';
import { useHaptic } from '@/hooks/useHaptic';

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
  const { patterns } = useHaptic();
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

  const handleClose = useCallback(() => {
    patterns.tap();
    onOpenChange(false);
  }, [patterns, onOpenChange]);

  const handleOverlayClick = useCallback(() => {
    if (closeOnOverlayClick) {
      handleClose();
    }
  }, [closeOnOverlayClick, handleClose]);

  return (
    <div 
      className="fixed inset-0 z-[80] flex items-center justify-center"
      style={{
        // Telegram Mini App safe area support
        padding: 'max(1rem, max(var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))) 1rem max(1rem, max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))) 1rem',
      }}
    >
      {/* Backdrop */}
      <DialogBackdrop
        visible={open}
        onClick={handleOverlayClick}
      />

      {/* Modal Container */}
      <DialogContainer size={size} className={className}>
        {/* Header with proper touch targets */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b">
          <div className="flex-1 pr-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-accent active:bg-accent/80 transition-colors touch-manipulation flex-shrink-0"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content with scroll support */}
        <div 
          className="p-4 sm:p-6 overflow-auto" 
          ref={contentRef} 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby={title}
          style={{ 
            WebkitOverflowScrolling: 'touch',
            maxHeight: 'calc(85vh - 140px)',
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 sm:p-6 border-t bg-muted/30">
            {footer}
          </div>
        )}
      </DialogContainer>
    </div>
  );
}
