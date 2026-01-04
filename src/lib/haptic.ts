/**
 * Haptic feedback utilities for Telegram Mini App
 */
import { logger } from '@/lib/logger';

type ImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type NotificationType = 'error' | 'success' | 'warning';

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
