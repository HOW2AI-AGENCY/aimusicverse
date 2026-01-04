/**
 * Telegram utility functions shared across edge functions
 */

/**
 * Escape special characters for Telegram MarkdownV2
 * 
 * MarkdownV2 requires escaping these characters: _*[]()~`>#+-=|{}.!\
 * 
 * @param text - Text to escape
 * @returns Escaped text safe for MarkdownV2
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

/**
 * Format duration from seconds to MM:SS
 * 
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
