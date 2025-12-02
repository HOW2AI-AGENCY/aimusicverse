// Task: T011-T012 - Player state and queue interfaces
// Client-side player state management types

import { Database } from '@/integrations/supabase/types';

// Type aliases for database types
type Track = Database['public']['Tables']['tracks']['Row'];
type TrackVersion = Database['public']['Tables']['track_versions']['Row'];

/**
 * Timestamped lyrics format from Suno AI
 */
export interface TimestampedLyrics {
  alignedWords: Array<{
    word: string;
    startS: number;
    endS: number;
  }>;
}

/**
 * Extended track type with computed fields for UI
 */
export interface TrackWithMetadata extends Track {
  version_count?: number;
  stem_count?: number;
  is_liked?: boolean;
  timestamped_lyrics?: TimestampedLyrics | null;
}

/**
 * Playback queue management
 */
export interface PlaybackQueue {
  current_track: TrackWithMetadata;
  current_version: TrackVersion | null;
  
  // Queue management
  queue: TrackWithMetadata[];           // Upcoming tracks
  history: TrackWithMetadata[];         // Previously played (last 50)
  
  // Playback modes
  repeat_mode: 'off' | 'one' | 'all';
  shuffle: boolean;
  shuffle_order: number[];              // Pre-shuffled indices
  
  // Metadata
  created_at: number;                   // Timestamp
  source: 'library' | 'playlist' | 'public' | 'project';
}

/**
 * Player UI state (3 states: compact/expanded/fullscreen)
 */
export interface PlayerState {
  // Current playback
  track: TrackWithMetadata | null;
  version: TrackVersion | null;
  
  // Player UI state
  state: 'compact' | 'expanded' | 'fullscreen';
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  
  // Queue
  queue: PlaybackQueue | null;
  
  // Lyrics
  showLyrics: boolean;
  currentWord: number | null;
}

/**
 * Player actions for Zustand store
 */
export interface PlayerActions {
  playTrack: (track: TrackWithMetadata, version?: TrackVersion) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setState: (state: PlayerState['state']) => void;
  toggleLyrics: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setRepeatMode: (mode: PlaybackQueue['repeat_mode']) => void;
  toggleShuffle: () => void;
  addToQueue: (track: TrackWithMetadata) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
}

/**
 * Combined player store type
 */
export type PlayerStore = PlayerState & PlayerActions;
