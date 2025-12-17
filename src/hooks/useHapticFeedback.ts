/**
 * Hook for haptic feedback using Telegram Mini App or native Vibration API
 */

import { useCallback } from 'react';

type HapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type NotificationStyle = 'error' | 'success' | 'warning';

export function useHapticFeedback() {
  const haptic = typeof window !== 'undefined' 
    ? (window as any).Telegram?.WebApp?.HapticFeedback 
    : null;

  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const impact = useCallback((style: HapticStyle = 'medium') => {
    if (haptic?.impactOccurred) {
      haptic.impactOccurred(style);
    } else {
      const patterns: Record<HapticStyle, number> = {
        light: 10,
        medium: 20,
        heavy: 30,
        rigid: 15,
        soft: 25,
      };
      vibrate(patterns[style]);
    }
  }, [haptic, vibrate]);

  const notification = useCallback((type: NotificationStyle) => {
    if (haptic?.notificationOccurred) {
      haptic.notificationOccurred(type);
    } else {
      const patterns: Record<NotificationStyle, number[]> = {
        success: [10, 50, 10],
        warning: [20, 30, 20],
        error: [30, 30, 30, 30],
      };
      vibrate(patterns[type]);
    }
  }, [haptic, vibrate]);

  const selectionChanged = useCallback(() => {
    if (haptic?.selectionChanged) {
      haptic.selectionChanged();
    } else {
      vibrate(5);
    }
  }, [haptic, vibrate]);

  // Preset actions
  const tap = useCallback(() => impact('light'), [impact]);
  const select = useCallback(() => selectionChanged(), [selectionChanged]);
  const success = useCallback(() => notification('success'), [notification]);
  const error = useCallback(() => notification('error'), [notification]);
  const warning = useCallback(() => notification('warning'), [notification]);

  // Knob-specific haptics
  const onKnobChange = useCallback((value: number, prevValue: number) => {
    // Light feedback for movement
    impact('light');
    
    // Extra feedback at boundaries (0 or 1)
    if ((value === 0 && prevValue > 0) || (value === 1 && prevValue < 1)) {
      setTimeout(() => impact('rigid'), 30);
    }
  }, [impact]);

  const onKnobSnap = useCallback(() => {
    // Stronger feedback when snapping to preset values
    selectionChanged();
  }, [selectionChanged]);

  const boundary = useCallback(() => {
    impact('rigid');
  }, [impact]);

  return {
    impact,
    notification,
    selectionChanged,
    tap,
    select,
    success,
    error,
    warning,
    onKnobChange,
    onKnobSnap,
    boundary,
  };
}
