/**
 * Telegram Context (Legacy Re-export)
 * 
 * This file is maintained for backward compatibility.
 * The actual implementation has been split into modules in src/contexts/telegram/
 * 
 * @deprecated Import from '@/contexts/telegram' instead:
 * ```typescript
 * import { TelegramProvider, useTelegram, DeepLinkHandler } from '@/contexts/telegram';
 * ```
 * 
 * Constitution v3.0.0 Compliance:
 * - Original file: 1333 lines (violated 500 line limit)
 * - Refactored into 7 modules, each under 350 lines
 * 
 * @see src/contexts/telegram/index.ts - Main entry point
 */

// Re-export everything from the modular structure
export {
  TelegramProvider,
  useTelegram,
  DeepLinkHandler,
  useTelegramInit,
  useTelegramActions,
  createMockWebApp,
} from './telegram';

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
} from './telegram';
