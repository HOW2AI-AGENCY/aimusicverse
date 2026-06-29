/**
 * Telegram Haptic Feedback Wrapper
 * Sprint 038-C: Animation & Polish
 *
 * Safe wrapper around Telegram Mini App HapticFeedback API.
 * No-ops gracefully outside Telegram WebApp (browser dev, tests).
 */

type HapticImpactStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
type HapticNotificationType = "error" | "success" | "warning";

function getHaptic() {
  try {
    return window.Telegram?.WebApp?.HapticFeedback;
  } catch {
    return undefined;
  }
}

export const haptics = {
  /** Light tap — tab switch, selection */
  light() {
    getHaptic()?.impactOccurred("light");
  },
  /** Medium tap — like, save */
  medium() {
    getHaptic()?.impactOccurred("medium");
  },
  /** Heavy tap — major action */
  heavy() {
    getHaptic()?.impactOccurred("heavy");
  },
  /** Custom impact */
  impact(style: HapticImpactStyle) {
    getHaptic()?.impactOccurred(style);
  },
  /** Success notification — generation complete */
  success() {
    getHaptic()?.notificationOccurred("success");
  },
  /** Error notification */
  error() {
    getHaptic()?.notificationOccurred("error");
  },
  /** Warning notification */
  warning() {
    getHaptic()?.notificationOccurred("warning");
  },
  /** Custom notification */
  notification(type: HapticNotificationType) {
    getHaptic()?.notificationOccurred(type);
  },
} as const;
