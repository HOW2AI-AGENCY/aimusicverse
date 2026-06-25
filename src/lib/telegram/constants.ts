/**
 * Telegram Bot Configuration Constants
 *
 * Centralized configuration for Telegram Mini App integration.
 * All bot-related constants should be defined here.
 *
 * @module lib/telegram/constants
 */

/**
 * Official Telegram Bot username (without @)
 * Used for deep links and share URLs
 */
export const TELEGRAM_BOT_USERNAME = "AIMusicVerseBot";

/**
 * Telegram Mini App short name
 * Used in app deep links: https://t.me/BOT/APP_NAME
 */
export const TELEGRAM_APP_SHORT_NAME = "app";

/**
 * Base URL for Mini App deep links
 */
export const TELEGRAM_MINI_APP_BASE_URL = `https://t.me/${TELEGRAM_BOT_USERNAME}/${TELEGRAM_APP_SHORT_NAME}`;

/**
 * Base URL for bot start links
 */
export const TELEGRAM_BOT_START_URL = `https://t.me/${TELEGRAM_BOT_USERNAME}`;

/**
 * Generate a deep link to the Mini App with a start parameter
 * @param startParam - The start_param value
 * @returns Full deep link URL
 */
export function getMiniAppDeepLink(startParam: string): string {
  return `${TELEGRAM_MINI_APP_BASE_URL}?startapp=${startParam}`;
}

/**
 * Generate a track deep link
 * @param trackId - Track ID
 */
export function getTrackDeepLink(trackId: string): string {
  return getMiniAppDeepLink(`track_${trackId}`);
}

/**
 * Generate a playlist deep link
 * @param playlistId - Playlist ID
 */
export function getPlaylistDeepLink(playlistId: string): string {
  return getMiniAppDeepLink(`playlist_${playlistId}`);
}

/**
 * Generate a project deep link
 * @param projectId - Project ID
 */
export function getProjectDeepLink(projectId: string): string {
  return getMiniAppDeepLink(`project_${projectId}`);
}

/**
 * Generate a profile deep link
 * @param userId - User ID
 */
export function getProfileDeepLink(userId: string): string {
  return getMiniAppDeepLink(`profile_${userId}`);
}

/**
 * Generate an artist deep link
 * @param artistId - Artist ID
 */
export function getArtistDeepLink(artistId: string): string {
  return getMiniAppDeepLink(`artist_${artistId}`);
}

/**
 * Generate a generation deep link with optional style
 * @param style - Optional style preset
 */
export function getGenerateDeepLink(style?: string): string {
  return style ? getMiniAppDeepLink(`generate_${style}`) : getMiniAppDeepLink("generate");
}

/**
 * Generate a recognize/shazam deep link
 */
export function getRecognizeDeepLink(): string {
  return getMiniAppDeepLink("recognize");
}

/**
 * Generate an invite/referral deep link
 * @param userId - Inviting user's ID
 */
export function getInviteDeepLink(userId: string): string {
  return getMiniAppDeepLink(`invite_${userId}`);
}

/**
 * Generate a bot mention for display in UI
 * @returns Bot username with @ prefix
 */
export function getBotMention(): string {
  return `@${TELEGRAM_BOT_USERNAME}`;
}

/**
 * Generate a Telegram share URL for sharing content
 * @param url - URL to share
 * @param text - Optional share text
 */
export function getTelegramShareUrl(url: string, text?: string): string {
  const params = new URLSearchParams({ url });
  if (text) params.set("text", text);
  return `https://t.me/share/url?${params.toString()}`;
}
