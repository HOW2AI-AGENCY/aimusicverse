/**
 * Telegram Services - Unified Exports
 * 
 * Consolidates all Telegram-related functionality:
 * - Authentication
 * - Sharing (tracks, playlists, stories)
 * - Notifications via Telegram Bot
 */

// Authentication
export {
  authenticateWithTelegram,
  TelegramAuthService,
  telegramAuthService,
} from './auth';

// Sharing
export {
  // Deep links
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
  
  // Legacy class
  TelegramShareService,
  telegramShareService,
} from './share';

// Telegram Bot Notifications
export {
  queueNotification,
  notifyGenerationComplete as telegramNotifyGenerationComplete,
  notifyGenerationFailed as telegramNotifyGenerationFailed,
  notifySocialEvent as telegramNotifySocialEvent,
  notifyAchievement as telegramNotifyAchievement,
  sendCustomMessage,
} from './notifications';
