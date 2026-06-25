/**
 * Telegram Services - Unified Exports
 *
 * Consolidates all Telegram-related functionality:
 * - Authentication
 * - Sharing (tracks, playlists, stories)
 * - Notifications via Telegram Bot
 *
 * Note: For constants and deep link utilities, import from '@/lib/telegram'
 */

// Authentication
export { authenticateWithTelegram } from "./auth";

// Sharing
export {
  // Deep links - prefer importing from @/lib/telegram
  getTrackDeepLink,
  getPlaylistDeepLink,
  getRecognizeDeepLink,

  // Capability checks
  canShareToStory,
  canShareURL,
  canDownloadFile,

  // Track sharing
  getTrackShareUrl,
  shareTrackToStory,
  shareTrackURL,
  downloadTrack,

  // Playlist sharing
  getPlaylistShareUrl,
  sharePlaylistToStory,
  sharePlaylistURL,

  // Inline query
  switchInlineQuery,

  // Caption builders
  buildTrackShareCaption,
  buildPlaylistShareCaption,
} from "./share";

// Telegram Bot Notifications
export {
  queueNotification,
  notifyGenerationComplete as telegramNotifyGenerationComplete,
  notifyGenerationFailed as telegramNotifyGenerationFailed,
  notifySocialEvent as telegramNotifySocialEvent,
  notifyAchievement as telegramNotifyAchievement,
  sendCustomMessage,
} from "./notifications";

// Re-export constants from lib for convenience
export {
  TELEGRAM_BOT_USERNAME,
  TELEGRAM_APP_SHORT_NAME,
  TELEGRAM_MINI_APP_BASE_URL,
  getBotMention,
  getMiniAppDeepLink,
} from "@/lib/telegram";
