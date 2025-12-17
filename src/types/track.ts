/**
 * Centralized Track Type Definitions
 * 
 * Single source of truth for track-related types used throughout the application.
 */

import { Database } from '@/integrations/supabase/types';

// Base track type from database
export type TrackRow = Database['public']['Tables']['tracks']['Row'];
export type TrackVersionRow = Database['public']['Tables']['track_versions']['Row'];
export type TrackStemRow = Database['public']['Tables']['track_stems']['Row'];

/**
 * Extended Track type with computed/optional UI fields
 * This is the main type used throughout the application
 */
export interface Track extends TrackRow {
  // Like-related fields (computed from track_likes)
  is_liked: boolean;
  likes_count: number;
  
  // Version counts (computed)
  version_count?: number;
  stem_count?: number;
  
  // Optional fields from various queries
  master_version_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Track with creator info for public display
 */
export interface TrackWithCreator extends Track {
  creator?: {
    id: string;
    display_name: string | null;
    username: string | null;
    photo_url: string | null;
  } | null;
}

/**
 * Minimal track data for lists/cards
 */
export interface TrackSummary {
  id: string;
  title: string | null;
  audio_url: string | null;
  cover_url: string | null;
  duration_seconds: number | null;
  style: string | null;
  is_public: boolean | null;
  play_count: number | null;
  likes_count: number;
}

/**
 * Track with version information
 */
export interface TrackWithVersions extends Track {
  versions?: TrackVersionRow[];
  active_version?: TrackVersionRow | null;
}

/**
 * Track creation input type
 */
export type TrackInsert = Database['public']['Tables']['tracks']['Insert'];

/**
 * Track update input type
 */
export type TrackUpdate = Database['public']['Tables']['tracks']['Update'];

/**
 * Playable track (has audio_url)
 */
export interface PlayableTrack extends Track {
  audio_url: string;
}

/**
 * Type guard to check if track is playable
 */
export function isPlayableTrack(track: Track): track is PlayableTrack {
  return !!track.audio_url;
}
