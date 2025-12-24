/**
 * Common utilities barrel file
 * 
 * Centralized exports for frequently used utilities.
 * Import from here to keep imports clean and ensure tree-shaking.
 * 
 * @example
 * import { cn, formatTime, formatDate, debounce, throttle, logger } from '@/lib/common';
 */

// Class utilities
export { cn } from './utils';

// Formatting utilities
export { formatTime, formatDuration } from './formatters';
export { formatDate, formatRelative } from './date-utils';

// Performance utilities
export { 
  debounce, 
  throttle, 
  memoize, 
  markPerformance,
  batchUpdates,
  requestIdleCallback,
  preloadAudio,
} from './performance-utils';

// Logging
export { logger } from './logger';

// Mobile utilities
export { 
  triggerHapticFeedback, 
  useTouchEvents,
} from './mobile-utils';

// Haptic feedback
export { hapticImpact, hapticNotification, hapticSelectionChanged } from './haptic';

// Motion (centralized framer-motion)
export { motion, AnimatePresence, useAnimation, useInView } from './motion';
