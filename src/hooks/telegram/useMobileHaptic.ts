/**
 * useMobileHaptic - Hook for Telegram Mini App Haptic Feedback
 *
 * Provides tactile feedback for user interactions on mobile devices.
 * Falls back gracefully if Telegram API is not available.
 *
 * @see https://core.telegram.org/bots/webapps#hapticfeedback
 */

import { useCallback } from "react";
import { logger } from "@/lib/logger";

type HapticImpactStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
type HapticNotificationType = "error" | "success" | "warning";

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

const MIN_HAPTIC_VERSION = 6.1;

function isHapticSupported(): boolean {
  try {
    const webApp = window.Telegram?.WebApp;
    if (!webApp?.HapticFeedback) return false;
    return parseFloat(webApp.version || "0") >= MIN_HAPTIC_VERSION;
  } catch {
    return false;
  }
}

export function useMobileHaptic(): HapticFeedback {
  const hapticAPI = window.Telegram?.WebApp?.HapticFeedback;
  const isAvailable = isHapticSupported();

  const impact = useCallback(
    (style: HapticImpactStyle = "light") => {
      if (!isAvailable) return;
      try {
        hapticAPI?.impactOccurred(style);
      } catch {
        // Silently fail - haptic feedback is not critical
      }
    },
    [hapticAPI, isAvailable],
  );



  const notification = useCallback(
    (type: HapticNotificationType) => {
      if (!isAvailable) return;
      try {
        hapticAPI?.notificationOccurred(type);
      } catch {
        /* silent */
      }
    },
    [hapticAPI, isAvailable],
  );

  const selectionChanged = useCallback(() => {
    if (!isAvailable) return;
    try {
      hapticAPI?.selectionChanged();
    } catch {
      /* silent */
    }
  }, [hapticAPI, isAvailable]);


  return {
    impact,
    notification,
    selectionChanged,
    isAvailable,
  };
}
