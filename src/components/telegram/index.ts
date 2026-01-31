/**
 * Telegram Components Index
 * Feature: 032-professional-ui
 * 
 * Central export for all Telegram Mini App components
 */

// Safe Area utilities
export { 
  TelegramSafeArea, 
  TelegramContentArea, 
  useTelegramSafeArea,
  getTelegramSafeAreaTop,
  getTelegramSafeAreaBottom,
} from './TelegramSafeArea';

// Native button wrappers
export { 
  TelegramMainButton, 
  TelegramSecondaryButton 
} from './TelegramButtons';

// Haptic feedback patterns
export { 
  hapticPatterns, 
  useHapticPatterns, 
  withHaptic, 
  hapticClick 
} from './TelegramHaptics';

// Theme synchronization
export { 
  TelegramThemeProvider, 
  useTelegramTheme 
} from './TelegramThemeProvider';

// Telegram-optimized lists
export {
  TelegramList,
  TelegramGrid,
} from './TelegramList';

// Re-export core hooks for convenience
export { useTelegram } from '@/contexts/TelegramContext';
export { useTelegramIntegration } from '@/hooks/useTelegramIntegration';
export { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
export { useTelegramMainButton } from '@/hooks/telegram/useTelegramMainButton';
