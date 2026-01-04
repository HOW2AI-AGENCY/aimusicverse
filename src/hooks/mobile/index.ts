/**
 * Mobile-optimized hooks for touch interactions and performance
 */

// Touch & Gesture hooks
export { useLongPress } from '../useLongPress';
export { useSwipeGesture } from '../useSwipeGesture';
export { useGestures } from '../useGestures';

// Keyboard hooks
export { useEnhancedKeyboard } from '../useEnhancedKeyboard';
export { useKeyboardAware } from '../useKeyboardAware';

// Haptic feedback
export { useHaptic } from '../useHaptic';
export { useHapticFeedback } from '../useHapticFeedback';

// Performance hooks
export { 
  useReducedMotion, 
  useIntersectionObserver,
  usePrefetch,
  useResizeObserver,
  usePerformanceMonitor,
  useLazyImage,
  useBatchedUpdates,
  useThrottledValue,
} from '../usePerformanceOptimization';

// Optimistic updates
export { useOptimisticUpdate } from '../useOptimisticUpdate';

// Media queries
export { useIsMobile } from '../use-mobile';
export { useMediaQuery } from '../useMediaQuery';
