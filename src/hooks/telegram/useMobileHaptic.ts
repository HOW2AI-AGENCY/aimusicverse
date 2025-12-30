/**
 * useMobileHaptic - Hook for Telegram Mini App Haptic Feedback
 *
 * Provides tactile feedback for user interactions on mobile devices.
 * Falls back gracefully if Telegram API is not available.
 *
 * @see https://core.telegram.org/bots/webapps#hapticfeedback
 */

import { useCallback } from 'react';

type HapticImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type HapticNotificationType = 'error' | 'success' | 'warning';

interface HapticFeedback {
  /**
   * Impact feedback - for button taps, selections
   */
  impact: (style: HapticImpactStyle) => void;

  /**
   * Notification feedback - for task completion, errors
   */
  notification: (type: HapticNotificationType) => void;

  /**
   * Selection changed - for swipes, tab switches
   */
  selectionChanged: () => void;

  /**
   * Check if haptic feedback is available
   */
  isAvailable: boolean;
}

export function useMobileHaptic(): HapticFeedback {
  const hapticAPI = window.Telegram?.WebApp?.HapticFeedback;
  const isAvailable = !!hapticAPI;

  const impact = useCallback((style: HapticImpactStyle = 'light') => {
    try {
      hapticAPI?.impactOccurred(style);
    } catch (error) {
      // Silently fail - haptic feedback is not critical
      console.debug('Haptic feedback not available:', error);
    }
  }, [hapticAPI]);

  const notification = useCallback((type: HapticNotificationType) => {
    try {
      hapticAPI?.notificationOccurred(type);
    } catch (error) {
      console.debug('Haptic feedback not available:', error);
    }
  }, [hapticAPI]);

  const selectionChanged = useCallback(() => {
    try {
      hapticAPI?.selectionChanged();
    } catch (error) {
      console.debug('Haptic feedback not available:', error);
    }
  }, [hapticAPI]);

  return {
    impact,
    notification,
    selectionChanged,
    isAvailable,
  };
}
