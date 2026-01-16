/**
 * Telegram Audio Metadata Builder
 * Formats track metadata for proper display in Telegram
 */

import { sanitizeForFilename, sanitizeForTelegram } from './track-naming.ts';
import { APP_NAME, APP_HANDLE, getPerformerName } from './track-name-builder.ts';
import { escapeMarkdown } from './telegram-utils.ts';

export interface TelegramAudioMetadata {
  title: string;
  performer: string;
  caption: string;
  filename: string;
}

export interface TrackMetadataInput {
  title: string;
  artistName?: string;
  creatorDisplayName?: string;
  creatorUsername?: string;
  durationSeconds?: number;
  style?: string;
  versionLabel?: string;
  mode?: 'generate' | 'cover' | 'extend' | 'stems' | 'remix';
  hasVocals?: boolean;
  trackId?: string;
}

/**
 * Format duration as MM:SS
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// escapeMarkdown is now imported from telegram-utils.ts
// which has proper MarkdownV2 escaping for all special characters

/**
 * Get mode emoji
 */
function getModeEmoji(mode?: string): string {
  const modeEmojis: Record<string, string> = {
    generate: '✨',
    cover: '🎤',
    extend: '➕',
    stems: '🎚️',
    remix: '🔄',
  };
  return mode ? modeEmojis[mode] || '🎵' : '🎵';
}

/**
 * Get mode label in Russian
 */
function getModeLabel(mode?: string): string {
  const modeLabels: Record<string, string> = {
    generate: 'Сгенерировано',
    cover: 'Кавер',
    extend: 'Расширено',
    stems: 'Стемы',
    remix: 'Ремикс',
  };
  return mode ? modeLabels[mode] || '' : '';
}

/**
 * Build caption hashtags
 */
function buildHashtags(track: TrackMetadataInput): string[] {
  const tags: string[] = ['#MusicVerseAI'];
  
  if (track.mode) {
    const modeTags: Record<string, string> = {
      generate: '#AIMusic',
      cover: '#AICover',
      extend: '#Extended',
      stems: '#Stems',
      remix: '#Remix',
    };
    const modeTag = modeTags[track.mode];
    if (modeTag) tags.push(modeTag);
  }
  
  if (track.hasVocals === false) {
    tags.push('#Instrumental');
  }
  
  return tags;
}

/**
 * Build Telegram audio metadata
 * 
 * @param track - Track data
 * @returns Formatted metadata for Telegram sendAudio
 */
export function buildTelegramMetadata(track: TrackMetadataInput): TelegramAudioMetadata {
  // Get performer (priority: artistName > creatorDisplayName > creatorUsername > APP_NAME)
  const performer = getPerformerName({
    artistName: track.artistName,
    creatorDisplayName: track.creatorDisplayName,
    creatorUsername: track.creatorUsername,
  });
  
  // Build title with version if available
  let displayTitle = track.title || 'Новый трек';
  if (track.versionLabel) {
    displayTitle = `${displayTitle} — ${track.versionLabel}`;
  }
  
  // Sanitize for Telegram
  const title = displayTitle;
  
  // Build filename
  const safeTitle = sanitizeForFilename(track.title || 'track');
  const safePerformer = sanitizeForFilename(performer);
  const filename = `${safeTitle} - ${safePerformer}.mp3`;
  
  // Build caption
  const captionParts: string[] = [];
  
  // Title line
  const modeEmoji = getModeEmoji(track.mode);
  captionParts.push(`${modeEmoji} *${escapeMarkdown(displayTitle)}*`);
  
  // Performer line
  captionParts.push(`👤 ${escapeMarkdown(performer)}`);
  
  // Duration line
  if (track.durationSeconds) {
    captionParts.push(`⏱️ ${formatDuration(track.durationSeconds)}`);
  }
  
  // Style line (truncated)
  if (track.style) {
    const shortStyle = track.style.slice(0, 60);
    const styleText = shortStyle.length < track.style.length ? `${shortStyle}...` : shortStyle;
    captionParts.push(`🎨 ${escapeMarkdown(styleText)}`);
  }
  
  // Mode label
  const modeLabel = getModeLabel(track.mode);
  if (modeLabel) {
    captionParts.push(`📝 ${modeLabel}`);
  }
  
  // Empty line before footer
  captionParts.push('');
  
  // Hashtags
  const hashtags = buildHashtags(track);
  captionParts.push(hashtags.join(' '));
  
  // App attribution
  captionParts.push(`📱 ${APP_HANDLE}`);
  
  const caption = captionParts.filter(Boolean).join('\n');
  
  return {
    title,
    performer,
    caption,
    filename,
  };
}

/**
 * Build simple caption for quick shares
 */
export function buildSimpleCaption(track: {
  title: string;
  performer?: string;
  duration?: number;
}): string {
  const parts: string[] = [];
  
  parts.push(`🎵 *${escapeMarkdown(track.title)}*`);
  
  if (track.performer) {
    parts.push(`👤 ${escapeMarkdown(track.performer)}`);
  }
  
  if (track.duration) {
    parts.push(`⏱️ ${formatDuration(track.duration)}`);
  }
  
  parts.push('');
  parts.push(`📱 ${APP_HANDLE}`);
  
  return parts.join('\n');
}

/**
 * Build caption for version update notification
 */
export function buildVersionCaption(track: {
  title: string;
  performer?: string;
  versionLabel: string;
  message?: string;
}): string {
  const parts: string[] = [];
  
  parts.push(`🎵 *${escapeMarkdown(track.title)} — ${track.versionLabel}*`);
  
  if (track.performer) {
    parts.push(`👤 ${escapeMarkdown(track.performer)}`);
  }
  
  if (track.message) {
    parts.push('');
    parts.push(track.message);
  }
  
  parts.push('');
  parts.push(`📱 ${APP_HANDLE}`);
  
  return parts.join('\n');
}
