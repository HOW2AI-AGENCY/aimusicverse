/**
 * Telegram Haptic Patterns
 * Feature: 032-professional-ui
 * 
 * Predefined haptic feedback patterns for common UX actions
 */

import { triggerHapticFeedback } from '@/lib/mobile-utils';

/**
 * Haptic pattern types for different interactions
 */
export const hapticPatterns = {
  // Navigation
  navigate: () => triggerHapticFeedback('light'),
  back: () => triggerHapticFeedback('light'),
  tabSwitch: () => triggerHapticFeedback('light'),
  
  // Buttons
  buttonPress: () => triggerHapticFeedback('medium'),
  primaryAction: () => triggerHapticFeedback('heavy'),
  secondaryAction: () => triggerHapticFeedback('light'),
  
  // Lists & Selection
  itemSelect: () => triggerHapticFeedback('light'),
  multiSelect: () => triggerHapticFeedback('light'),
  dragStart: () => triggerHapticFeedback('medium'),
  dragEnd: () => triggerHapticFeedback('light'),
  reorder: () => triggerHapticFeedback('light'),
  
  // Forms
  inputFocus: () => triggerHapticFeedback('light'),
  inputError: () => triggerHapticFeedback('medium'),
  formSubmit: () => triggerHapticFeedback('medium'),
  
  // Toggles & Switches
  toggle: () => triggerHapticFeedback('light'),
  sliderSnap: () => triggerHapticFeedback('light'),
  
  // Gestures
  swipeAction: () => triggerHapticFeedback('medium'),
  pullToRefresh: () => triggerHapticFeedback('medium'),
  longPress: () => triggerHapticFeedback('heavy'),
  
  // Feedback
  success: () => triggerHapticFeedback('medium'),
  error: () => triggerHapticFeedback('heavy'),
  warning: () => triggerHapticFeedback('medium'),
  
  // Player
  playPause: () => triggerHapticFeedback('light'),
  seek: () => triggerHapticFeedback('light'),
  volumeChange: () => triggerHapticFeedback('light'),
  trackChange: () => triggerHapticFeedback('medium'),
  
  // Generation
  generationStart: () => triggerHapticFeedback('medium'),
  generationComplete: () => triggerHapticFeedback('heavy'),
  
  // Likes & Social
  like: () => triggerHapticFeedback('medium'),
  unlike: () => triggerHapticFeedback('light'),
  share: () => triggerHapticFeedback('light'),
  
  // Modals
  modalOpen: () => triggerHapticFeedback('light'),
  modalClose: () => triggerHapticFeedback('light'),
  sheetSnap: () => triggerHapticFeedback('light'),
} as const;

/**
 * Hook for using haptic patterns
 */
export function useHapticPatterns() {
  return hapticPatterns;
}

/**
 * HOC to add haptic feedback to any handler
 */
export function withHaptic<T extends (...args: any[]) => any>(
  handler: T,
  pattern: keyof typeof hapticPatterns = 'buttonPress'
): T {
  return ((...args: Parameters<T>) => {
    hapticPatterns[pattern]();
    return handler(...args);
  }) as T;
}

/**
 * Wrapper for click handlers with haptic
 */
export function hapticClick(
  handler: () => void,
  pattern: keyof typeof hapticPatterns = 'buttonPress'
): () => void {
  return () => {
    hapticPatterns[pattern]();
    handler();
  };
}

export default hapticPatterns;
