/**
 * Telegram Context Module
 * 
 * Modular Telegram Mini App integration.
 * Split from original 1333-line TelegramContext.tsx into focused modules.
 * 
 * @module contexts/telegram
 * 
 * Usage:
 * ```typescript
 * import { TelegramProvider, useTelegram, DeepLinkHandler } from '@/contexts/telegram';
 * 
 * // In your app root
 * <TelegramProvider>
 *   <DeepLinkHandler />
 *   <App />
 * </TelegramProvider>
 * 
 * // In components
 * const { user, hapticFeedback, showMainButton } = useTelegram();
 * ```
 */

// Main exports
export { TelegramProvider, useTelegram } from './TelegramProvider';
export { DeepLinkHandler } from './DeepLinkHandler';

// Types
export type {
  TelegramWebApp,
  TelegramUser,
  TelegramContextType,
  MainButtonOptions,
  SecondaryButtonOptions,
  PopupParams,
  ShareToStoryOptions,
  HapticType,
  SafeAreaInsets,
} from './types';

// Hooks (for advanced use cases)
export { useTelegramInit } from './useTelegramInit';
export { useTelegramActions } from './useTelegramActions';

// Utilities
export { createMockWebApp } from './mockWebApp';
