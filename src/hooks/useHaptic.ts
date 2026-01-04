import { useCallback, useMemo } from 'react';
import { 
  hapticImpact, 
  hapticNotification, 
  hapticSelectionChanged, 
  isHapticAvailable 
} from '@/lib/haptic';

type ImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type NotificationType = 'error' | 'success' | 'warning';

interface UseHapticReturn {
  /** Check if haptic feedback is available */
  isAvailable: boolean;
  /** Trigger impact feedback for user interactions */
  impact: (style?: ImpactStyle) => void;
  /** Trigger notification feedback for results */
  notification: (type?: NotificationType) => void;
  /** Trigger selection changed feedback */
  selectionChanged: () => void;
  /** Common haptic patterns */
  patterns: {
    tap: () => void;
    success: () => void;
    error: () => void;
    warning: () => void;
    select: () => void;
    delete: () => void;
    toggle: () => void;
  };
}

/**
 * Hook for easy access to haptic feedback with common patterns
 */
export function useHaptic(): UseHapticReturn {
  const isAvailable = useMemo(() => isHapticAvailable(), []);

  const impact = useCallback((style: ImpactStyle = 'medium') => {
    hapticImpact(style);
  }, []);

  const notification = useCallback((type: NotificationType = 'success') => {
    hapticNotification(type);
  }, []);

  const selectionChanged = useCallback(() => {
    hapticSelectionChanged();
  }, []);

  // Pre-defined patterns for common use cases
  const patterns = useMemo(() => ({
    // Light tap for buttons
    tap: () => hapticImpact('light'),
    // Success notification
    success: () => hapticNotification('success'),
    // Error notification
    error: () => hapticNotification('error'),
    // Warning notification
    warning: () => hapticNotification('warning'),
    // Selection change (e.g., toggle, radio)
    select: () => hapticSelectionChanged(),
    // Heavy impact for destructive actions
    delete: () => hapticImpact('heavy'),
    // Medium impact for toggles
    toggle: () => hapticImpact('medium'),
  }), []);

  return {
    isAvailable,
    impact,
    notification,
    selectionChanged,
    patterns,
  };
}
