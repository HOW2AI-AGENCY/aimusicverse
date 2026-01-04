/**
 * Haptic feedback utilities for Telegram Mini App
 * 
 * Usage Guidelines:
 * - light: Navigation, tab switching, selection changes
 * - medium: Button presses, form submissions, confirmations
 * - heavy: Destructive actions, important alerts, errors
 * - soft: Drag gestures, sliders, subtle interactions
 * - rigid: Toggle switches, checkboxes
 */
import { logger } from '@/lib/logger';

export type ImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
export type NotificationType = 'error' | 'success' | 'warning';

/**
 * Haptic usage guidelines for consistent UX
 */
export const HAPTIC_GUIDE = {
  navigation: 'light' as ImpactStyle,
  buttonPress: 'medium' as ImpactStyle,
  destructive: 'heavy' as ImpactStyle,
  toggle: 'rigid' as ImpactStyle,
  drag: 'soft' as ImpactStyle,
  selection: 'light' as ImpactStyle,
  success: 'success' as NotificationType,
  error: 'error' as NotificationType,
  warning: 'warning' as NotificationType,
} as const;

/**
 * Trigger impact haptic feedback
 */
export const hapticImpact = (style: ImpactStyle = 'medium') => {
  try {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    }
  } catch (error) {
    logger.warn('Haptic feedback not available', { error });
  }
};

/**
 * Trigger notification haptic feedback
 */
export const hapticNotification = (type: NotificationType = 'success') => {
  try {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
    }
  } catch (error) {
    logger.warn('Haptic feedback not available', { error });
  }
};

/**
 * Trigger selection changed haptic feedback
 */
export const hapticSelectionChanged = () => {
  try {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  } catch (error) {
    logger.warn('Haptic feedback not available', { error });
  }
};

/**
 * Check if haptic feedback is available
 */
export const isHapticAvailable = (): boolean => {
  return !!window.Telegram?.WebApp?.HapticFeedback;
};

/**
 * Smart haptic - auto-selects appropriate feedback based on action type
 */
export const smartHaptic = (action: keyof typeof HAPTIC_GUIDE) => {
  const feedback = HAPTIC_GUIDE[action];
  
  if (feedback === 'success' || feedback === 'error' || feedback === 'warning') {
    hapticNotification(feedback);
  } else {
    hapticImpact(feedback);
  }
};
