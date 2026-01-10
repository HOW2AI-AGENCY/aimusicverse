/**
 * Telegram Share Service
 * Handles sharing tracks and playlists via Telegram
 */

import { hapticNotification } from '@/lib/haptic';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'TelegramShare' });

// Bot username for deep links
const BOT_USERNAME = 'AIMusicVerseBot';

interface ShareableTrack {
  id: string;
  title?: string | null;
  cover_url?: string | null;
  audio_url?: string | null;
  style?: string | null;
  duration_seconds?: number | null;
}

interface ShareablePlaylist {
  id: string;
  title: string;
  description?: string | null;
  cover_url?: string | null;
  track_count?: number | null;
  total_duration?: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TelegramWebApp = any;

/**
 * Get Telegram WebApp instance
 */
function getWebApp(): TelegramWebApp | null {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    return (window as any).Telegram.WebApp;
  }
  return null;
}

// ============================================================================
// Deep Links
// ============================================================================

export function getTrackDeepLink(trackId: string): string {
  return `https://t.me/${BOT_USERNAME}/app?startapp=track_${trackId}`;
}

export function getPlaylistDeepLink(playlistId: string): string {
  return `https://t.me/${BOT_USERNAME}/app?startapp=playlist_${playlistId}`;
}

export function getRecognizeDeepLink(): string {
  return `https://t.me/${BOT_USERNAME}/app?startapp=recognize`;
}

// ============================================================================
// Capability Checks
// ============================================================================

export function canShareToStory(): boolean {
  const webApp = getWebApp();
  return !!webApp && typeof webApp.shareToStory === 'function';
}

export function canShareURL(): boolean {
  const webApp = getWebApp();
  return !!webApp && typeof webApp.shareURL === 'function';
}

export function canDownloadFile(): boolean {
  const webApp = getWebApp();
  return !!webApp && typeof webApp.downloadFile === 'function';
}

// ============================================================================
// Track Sharing
// ============================================================================

export function getTrackShareUrl(track: ShareableTrack): string {
  const url = getTrackDeepLink(track.id);
  const text = `🎵 Послушай "${track.title || 'Новый трек'}"!\n✨ Создано в MusicVerse AI`;
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function shareTrackToStory(track: ShareableTrack): boolean {
  const webApp = getWebApp();
  if (!canShareToStory() || !track.cover_url) {
    log.warn('shareToStory not available or no cover URL');
    return false;
  }

  try {
    webApp.shareToStory(track.cover_url, {
      text: `🎵 ${track.title || 'Новый трек'}\n✨ Создано в MusicVerse AI`,
      widgetLink: {
        url: getTrackDeepLink(track.id),
        name: 'Послушать',
      },
    });
    hapticNotification('success');
    return true;
  } catch (error) {
    log.error('Error sharing to story', error);
    return false;
  }
}

export function shareTrackURL(track: ShareableTrack): boolean {
  const webApp = getWebApp();
  const url = getTrackDeepLink(track.id);
  const text = `🎵 Послушай "${track.title || 'Новый трек'}"!`;

  if (canShareURL()) {
    try {
      webApp.shareURL(url, text);
      hapticNotification('success');
      return true;
    } catch (error) {
      log.error('Error with shareURL', error);
    }
  }

  if (webApp?.openTelegramLink) {
    webApp.openTelegramLink(getTrackShareUrl(track));
    hapticNotification('success');
    return true;
  }

  window.open(getTrackShareUrl(track), '_blank');
  return true;
}

export function downloadTrack(track: ShareableTrack): Promise<boolean> {
  return new Promise((resolve) => {
    if (!track.audio_url) {
      log.warn('No audio URL for download');
      resolve(false);
      return;
    }

    const fileName = `${track.title || 'track'}.mp3`;
    const webApp = getWebApp();

    if (canDownloadFile()) {
      try {
        webApp.downloadFile(
          { url: track.audio_url, file_name: fileName },
          (accepted: boolean) => {
            if (accepted) hapticNotification('success');
            resolve(accepted);
          }
        );
        return;
      } catch (error) {
        log.error('Error with downloadFile', error);
      }
    }

    // Browser fallback
    try {
      const a = document.createElement('a');
      a.href = track.audio_url;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      hapticNotification('success');
      resolve(true);
    } catch (error) {
      log.error('Error downloading file', error);
      resolve(false);
    }
  });
}

// ============================================================================
// Playlist Sharing
// ============================================================================

export function getPlaylistShareUrl(playlist: ShareablePlaylist): string {
  const url = getPlaylistDeepLink(playlist.id);
  const text = `📁 Плейлист "${playlist.title}"\n${playlist.track_count || 0} треков\n✨ MusicVerse AI`;
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function sharePlaylistToStory(playlist: ShareablePlaylist): boolean {
  const webApp = getWebApp();
  if (!canShareToStory()) {
    log.warn('shareToStory not available');
    return false;
  }

  const mediaUrl = playlist.cover_url || 'https://via.placeholder.com/512x512?text=Playlist';

  try {
    webApp.shareToStory(mediaUrl, {
      text: `📁 ${playlist.title}\n${playlist.track_count || 0} треков\n✨ MusicVerse AI`,
      widgetLink: {
        url: getPlaylistDeepLink(playlist.id),
        name: 'Открыть плейлист',
      },
    });
    hapticNotification('success');
    return true;
  } catch (error) {
    log.error('Error sharing playlist to story', error);
    return false;
  }
}

export function sharePlaylistURL(playlist: ShareablePlaylist): boolean {
  const webApp = getWebApp();
  const url = getPlaylistDeepLink(playlist.id);
  const text = `📁 Плейлист "${playlist.title}" (${playlist.track_count || 0} треков)`;

  if (canShareURL()) {
    try {
      webApp.shareURL(url, text);
      hapticNotification('success');
      return true;
    } catch (error) {
      log.error('Error with shareURL', error);
    }
  }

  if (webApp?.openTelegramLink) {
    webApp.openTelegramLink(getPlaylistShareUrl(playlist));
    hapticNotification('success');
    return true;
  }

  window.open(getPlaylistShareUrl(playlist), '_blank');
  return true;
}

// ============================================================================
// Inline Query
// ============================================================================

export function switchInlineQuery(query: string = ''): boolean {
  const webApp = getWebApp();
  if (!webApp?.switchInlineQuery) {
    log.warn('switchInlineQuery not available');
    return false;
  }

  try {
    webApp.switchInlineQuery(query, ['users', 'groups', 'channels']);
    return true;
  } catch (error) {
    log.error('Error switching to inline query', error);
    return false;
  }
}

// ============================================================================
// Caption Builders
// ============================================================================

export function buildTrackShareCaption(track: ShareableTrack, creatorUsername?: string): string {
  const lines: string[] = [];

  lines.push(`🎵 *${track.title || 'Новый трек'}*`);

  if (creatorUsername) {
    lines.push(`👤 by @${creatorUsername}`);
  }

  if (track.style) {
    const firstStyle = track.style.split(',')[0].trim();
    lines.push(`🎸 ${firstStyle}`);
  }

  if (track.duration_seconds) {
    const mins = Math.floor(track.duration_seconds / 60);
    const secs = Math.floor(track.duration_seconds % 60);
    lines.push(`⏱️ ${mins}:${String(secs).padStart(2, '0')}`);
  }

  lines.push('');
  lines.push(`🔗 ${getTrackDeepLink(track.id)}`);

  return lines.join('\n');
}

export function buildPlaylistShareCaption(playlist: ShareablePlaylist, creatorUsername?: string): string {
  const lines: string[] = [];

  lines.push(`📁 *${playlist.title}*`);

  if (creatorUsername) {
    lines.push(`👤 by @${creatorUsername}`);
  }

  if (playlist.description) {
    lines.push(`📝 ${playlist.description.substring(0, 100)}${playlist.description.length > 100 ? '...' : ''}`);
  }

  lines.push(`🎵 ${playlist.track_count || 0} треков`);

  if (playlist.total_duration) {
    const hours = Math.floor(playlist.total_duration / 3600);
    const mins = Math.floor((playlist.total_duration % 3600) / 60);
    lines.push(`⏱️ ${hours > 0 ? `${hours} ч ` : ''}${mins} мин`);
  }

  lines.push('');
  lines.push(`🔗 ${getPlaylistDeepLink(playlist.id)}`);

  return lines.join('\n');
}
