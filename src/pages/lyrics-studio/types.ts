/**
 * Типы для LyricsStudio-экосистемы.
 *
 * Извлечено из pages/LyricsStudio.tsx в Sprint 042 (god-page декомпозиция).
 * Используются в LyricsHeader, MobileTemplatesDrawer, LyricsTagsPanels.
 */

export interface ProjectTrackForLyrics {
  position: number;
}

export interface ProjectDataForLyrics {
  title: string;
  cover_url: string | null;
  genre: string | null;
  mood: string | null;
}

export interface TracklistItemForLyrics {
  id: string;
  position: number;
  title: string;
  lyrics: string | null;
  status: string | null;
}
