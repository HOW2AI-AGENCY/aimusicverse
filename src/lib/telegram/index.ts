/**
 * Telegram Utilities - Barrel Export
 * 
 * Centralized exports for Telegram-related utilities.
 * 
 * @module lib/telegram
 */

// Constants and deep link utilities
export {
  TELEGRAM_BOT_USERNAME,
  TELEGRAM_APP_SHORT_NAME,
  TELEGRAM_MINI_APP_BASE_URL,
  TELEGRAM_BOT_START_URL,
  getMiniAppDeepLink,
  getTrackDeepLink,
  getPlaylistDeepLink,
  getProjectDeepLink,
  getProfileDeepLink,
  getArtistDeepLink,
  getGenerateDeepLink,
  getRecognizeDeepLink,
  getInviteDeepLink,
  getBotMention,
  getTelegramShareUrl,
} from './constants';
