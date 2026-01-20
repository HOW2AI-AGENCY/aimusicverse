/**
 * Public Content Constants
 *
 * Configuration constants for genre filtering and playlist generation.
 *
 * @module hooks/public-content/constants
 */

import type { GenreQueryConfig, GenrePlaylistConfig } from './types';

/**
 * Genre queries for server-side filtering
 * Values must match computed_genre column in DB exactly
 * DB values: hiphop (253), pop (163), rock (81), electronic (17), folk (47), etc.
 */
export const GENRE_QUERIES: GenreQueryConfig[] = [
  { id: 'hiphop', dbValues: ['hiphop', 'hip-hop', 'rap', 'trap'] },
  { id: 'pop', dbValues: ['pop', 'dance', 'electropop'] },
  { id: 'rock', dbValues: ['rock', 'alternative', 'metal', 'indie'] },
  { id: 'electronic', dbValues: ['electronic', 'house', 'techno', 'edm', 'ambient'] },
  { id: 'folk', dbValues: ['folk', 'acoustic', 'country'] },
];

/**
 * Genre playlist configurations for auto-generated playlists
 */
export const GENRE_PLAYLISTS: GenrePlaylistConfig[] = [
  { 
    genre: 'electronic', 
    title: 'Электроника', 
    description: 'Лучшие электронные треки', 
    keywords: ['electronic', 'electro', 'edm', 'techno', 'house', 'trance'] 
  },
  { 
    genre: 'hip-hop', 
    title: 'Хип-Хоп', 
    description: 'Свежий хип-хоп и рэп', 
    keywords: ['hip-hop', 'hip hop', 'rap', 'trap', 'boom bap'] 
  },
  { 
    genre: 'pop', 
    title: 'Поп', 
    description: 'Популярная музыка', 
    keywords: ['pop', 'dance', 'synth-pop', 'dream pop'] 
  },
  { 
    genre: 'rock', 
    title: 'Рок', 
    description: 'Энергичный рок', 
    keywords: ['rock', 'metal', 'alternative', 'indie', 'punk', 'grunge'] 
  },
  { 
    genre: 'ambient', 
    title: 'Амбиент', 
    description: 'Атмосферная музыка', 
    keywords: ['ambient', 'chill', 'downtempo', 'atmospheric', 'drone'] 
  },
  { 
    genre: 'jazz', 
    title: 'Джаз', 
    description: 'Классический и современный джаз', 
    keywords: ['jazz', 'swing', 'bebop', 'fusion', 'smooth jazz'] 
  },
  { 
    genre: 'rnb', 
    title: 'R&B / Soul', 
    description: 'Ритм-н-блюз и соул', 
    keywords: ['r&b', 'rnb', 'soul', 'neo-soul', 'funk', 'rhythm'] 
  },
  { 
    genre: 'classical', 
    title: 'Классика', 
    description: 'Классическая и оркестровая музыка', 
    keywords: ['classical', 'orchestral', 'symphony', 'piano', 'opera', 'baroque'] 
  },
  { 
    genre: 'lofi', 
    title: 'Lo-Fi', 
    description: 'Lo-Fi биты для релакса', 
    keywords: ['lo-fi', 'lofi', 'chillhop', 'study', 'relax', 'beats'] 
  },
  { 
    genre: 'latin', 
    title: 'Латино', 
    description: 'Латиноамериканская музыка', 
    keywords: ['latin', 'reggaeton', 'salsa', 'bachata', 'cumbia', 'bossa'] 
  },
  { 
    genre: 'country', 
    title: 'Кантри', 
    description: 'Кантри и фолк', 
    keywords: ['country', 'folk', 'acoustic', 'bluegrass', 'americana'] 
  },
  { 
    genre: 'cinematic', 
    title: 'Кинематографичная', 
    description: 'Эпическая и саундтрек музыка', 
    keywords: ['cinematic', 'epic', 'soundtrack', 'film', 'trailer', 'dramatic'] 
  },
];

/**
 * Default stale time for public content queries (5 minutes)
 */
export const PUBLIC_CONTENT_STALE_TIME = 1000 * 60 * 5;

/**
 * Default gc time for public content queries (15 minutes)
 */
export const PUBLIC_CONTENT_GC_TIME = 1000 * 60 * 15;

/**
 * Default batch fetch limit for main tracks
 */
export const BATCH_FETCH_LIMIT = 50;

/**
 * Default fetch limit for genre-specific tracks
 */
export const GENRE_FETCH_LIMIT = 20;
