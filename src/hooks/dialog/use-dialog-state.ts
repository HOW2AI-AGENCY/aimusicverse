/**
 * useDialogState Hook
 *
 * Manages dialog open/close state with convenient control methods
 */

import { useState, useCallback } from 'react';
import type { UseDialogStateReturn } from '@/components/dialog/unified-dialog.types';

/**
 * Hook for managing dialog state
 *
 * @param initialOpen - Initial open state (default: false)
 * @returns Dialog state control methods
 *
 * @example
 * ```tsx
 * const { isOpen, open, close, toggle } = useDialogState();
 *
 * return (
 *   <>
 *     <button onClick={open}>Open Dialog</button>
 *     <UnifiedDialog variant="modal" open={isOpen} onOpenChange={close}>
 *       Content
 *     </UnifiedDialog>
 *   </>
 * );
 * ```
 */
export function useDialogState(initialOpen = false): UseDialogStateReturn {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
