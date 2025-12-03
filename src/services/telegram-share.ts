// Telegram Share Service for Mini App
import { hapticNotification } from '@/lib/haptic';

interface Track {
  id: string;
  title?: string | null;
  cover_url?: string | null;
  audio_url?: string | null;
  style?: string | null;
  duration_seconds?: number | null;
}

const BOT_USERNAME = 'AIMusicVerseBot';

export class TelegramShareService {
  private webApp: TelegramWebApp | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp;
    }
  }

  /**
   * Get deep link for a track
   */
  getTrackDeepLink(trackId: string): string {
    return `https://t.me/${BOT_USERNAME}/app?startapp=track_${trackId}`;
  }

  /**
   * Get share URL for sharing via Telegram
   */
  getShareUrl(track: Track): string {
    const url = this.getTrackDeepLink(track.id);
    const text = `🎵 Послушай "${track.title || 'Новый трек'}"!\n✨ Создано в MusicVerse AI`;
    return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  }

  /**
   * Check if shareToStory is available
   */
  canShareToStory(): boolean {
    return !!this.webApp && typeof (this.webApp as any).shareToStory === 'function';
  }

  /**
   * Check if shareURL is available (Telegram 8.0+)
   */
  canShareURL(): boolean {
    return !!this.webApp && typeof (this.webApp as any).shareURL === 'function';
  }

  /**
   * Check if downloadFile is available (Telegram 8.0+)
   */
  canDownloadFile(): boolean {
    return !!this.webApp && typeof (this.webApp as any).downloadFile === 'function';
  }

  /**
   * Share track to Telegram Story
   */
  shareToStory(track: Track): boolean {
    if (!this.canShareToStory() || !track.cover_url) {
      console.warn('shareToStory not available or no cover URL');
      return false;
    }

    try {
      (this.webApp as any).shareToStory(track.cover_url, {
        text: `🎵 ${track.title || 'Новый трек'}\n✨ Создано в MusicVerse AI`,
        widgetLink: {
          url: this.getTrackDeepLink(track.id),
          name: 'Послушать',
        },
      });
      
      hapticNotification('success');
      return true;
    } catch (error) {
      console.error('Error sharing to story:', error);
      return false;
    }
  }

  /**
   * Share URL using native Telegram SDK
   */
  shareURL(track: Track): boolean {
    const url = this.getTrackDeepLink(track.id);
    const text = `🎵 Послушай "${track.title || 'Новый трек'}"!`;

    // Try native shareURL first (Telegram 8.0+)
    if (this.canShareURL()) {
      try {
        (this.webApp as any).shareURL(url, text);
        hapticNotification('success');
        return true;
      } catch (error) {
        console.error('Error with shareURL:', error);
      }
    }

    // Fallback to openTelegramLink
    if (this.webApp?.openTelegramLink) {
      const shareLink = this.getShareUrl(track);
      this.webApp.openTelegramLink(shareLink);
      hapticNotification('success');
      return true;
    }

    // Last resort: open in new window
    window.open(this.getShareUrl(track), '_blank');
    return true;
  }

  /**
   * Download track file
   */
  downloadFile(track: Track): Promise<boolean> {
    return new Promise((resolve) => {
      if (!track.audio_url) {
        console.warn('No audio URL for download');
        resolve(false);
        return;
      }

      const fileName = `${track.title || 'track'}.mp3`;

      // Try native downloadFile first (Telegram 8.0+)
      if (this.canDownloadFile()) {
        try {
          (this.webApp as any).downloadFile(
            { url: track.audio_url, file_name: fileName },
            (accepted: boolean) => {
              if (accepted) {
                hapticNotification('success');
              }
              resolve(accepted);
            }
          );
          return;
        } catch (error) {
          console.error('Error with downloadFile:', error);
        }
      }

      // Fallback to browser download
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
        console.error('Error downloading file:', error);
        resolve(false);
      }
    });
  }

  /**
   * Switch to inline query mode
   */
  switchInlineQuery(query: string = ''): boolean {
    if (!this.webApp?.switchInlineQuery) {
      console.warn('switchInlineQuery not available');
      return false;
    }

    try {
      this.webApp.switchInlineQuery(query, ['users', 'groups', 'channels']);
      return true;
    } catch (error) {
      console.error('Error switching to inline query:', error);
      return false;
    }
  }

  /**
   * Build rich caption for sharing
   */
  buildShareCaption(track: Track, creatorUsername?: string): string {
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
    lines.push(`🔗 ${this.getTrackDeepLink(track.id)}`);

    return lines.join('\n');
  }
}

export const telegramShareService = new TelegramShareService();
