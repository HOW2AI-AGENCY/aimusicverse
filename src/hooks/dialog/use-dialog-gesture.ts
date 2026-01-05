/**
 * useDialogGesture Hook
 *
 * Manages gesture controls for mobile dialogs (swipe-to-dismiss, haptic feedback)
 */

import { useCallback } from 'react';
import { HapticFeedback } from '@twa-dev/sdk';
import type { DialogGestures } from '@/components/dialog/unified-dialog.types';

/**
 * Hook for managing dialog gestures on mobile
 *
 * @param config - Gesture configuration options
 * @returns Gesture props to pass to dialog components
 *
 * @example
 * ```tsx
 * const gestures = useDialogGestures({
 *   swipeToClose: true,
 *   swipeThreshold: 100,
 *   hapticOnStart: true,
 *   hapticOnComplete: true,
 * });
 *
 * <UnifiedDialog variant="sheet" {...gestures}>
 *   Swipe down to close
 * </UnifiedDialog>
 * ```
 */
export function useDialogGesture(config: DialogGestures = {}) {
  const {
    swipeToClose = true,
    swipeThreshold = 100,
    hapticOnStart = false,
    hapticOnComplete = false,
  } = config;

  const handleGestureStart = useCallback(() => {
    try {
      if (hapticOnStart) {
        HapticFeedback.impactOccurred('light');
      }
    } catch (error) {
      // Haptic feedback not available (desktop)
    }
  }, [hapticOnStart]);

  const handleGestureComplete = useCallback(() => {
    try {
      if (hapticOnComplete) {
        HapticFeedback.notificationOccurred('success');
      }
    } catch (error) {
      // Haptic feedback not available (desktop)
    }
  }, [hapticOnComplete]);

  return {
    swipeToClose,
    swipeThreshold,
    onGestureStart: handleGestureStart,
    onGestureComplete: handleGestureComplete,
  };
}
