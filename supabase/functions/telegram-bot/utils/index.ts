/**
 * Telegram Bot Utilities
 * Centralized utility functions for the bot
 */

// Re-export metrics utilities
export { trackMetric, withMetrics, flushMetrics, checkAlerts, type MetricEventType } from './metrics.ts';

// Re-export database-backed rate limiter
export { 
  checkRateLimitDb, 
  isRateLimited, 
  getRateLimitInfo,
  RateLimitConfigs,
  type ActionType 
} from './rate-limiter.ts';

/**
 * Escape special characters for Telegram MarkdownV2
 * All special characters must be escaped: _ * [ ] ( ) ~ ` > # + - = | { } . !
 */
export function escapeMarkdown(text: string): string {
  if (!text) return '';
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

/**
 * Format duration from seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Split long text into chunks for Telegram message limit
 */
export function splitText(text: string, maxLength: number = 4000): string[] {
  const chunks: string[] = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }
    
    // Find last newline within limit
    let splitIndex = remaining.lastIndexOf('\n', maxLength);
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      // No good newline found, split at space
      splitIndex = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitIndex === -1) {
      // No space found, hard split
      splitIndex = maxLength;
    }
    
    chunks.push(remaining.substring(0, splitIndex));
    remaining = remaining.substring(splitIndex).trim();
  }
  
  return chunks;
}

/**
 * Logger with structured output
 */
export const logger = {
  info: (action: string, data?: Record<string, unknown>) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      action,
      ...data
    }));
  },
  
  warn: (action: string, data?: Record<string, unknown>) => {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      action,
      ...data
    }));
  },
  
  error: (action: string, error: Error | unknown, data?: Record<string, unknown>) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      action,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...data
    }));
  }
};

/**
 * Clean Suno tags from lyrics
 */
export function cleanLyrics(lyrics: string): string {
  return lyrics
    .replace(/\[(?:Verse|Chorus|Bridge|Outro|Intro|Hook|Pre-Chorus|Post-Chorus|Instrumental|Break|Interlude|Refrain|End|Fade|Solo|Tag)[^\]]*\]/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
