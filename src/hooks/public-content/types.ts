/**
 * Public Content Types
 *
 * Shared type definitions for public content hooks.
 * Used for fetching public tracks, projects, and artists.
 *
 * @module hooks/public-content/types
 */

import type { Database } from "@/integrations/supabase/types";

// ============ Base Types from Database ============

export type PublicTrack = Database["public"]["Tables"]["tracks"]["Row"];
export type PublicProject = Database["public"]["Tables"]["music_projects"]["Row"];
export type PublicArtist = Database["public"]["Tables"]["artists"]["Row"];

// ============ Filter Interfaces ============

/**
 * Filters for fetching public content
 */
export interface PublicContentFilters {
  /** Genre to filter by */
  genre?: string;
  /** Mood to filter by */
  mood?: string;
  /** Sort order */
  sortBy?: "recent" | "popular" | "trending";
  /** Number of items to fetch */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Parameters for usePublicContent hook
 */
export interface UsePublicContentParams {
  /** Sort order */
  sort?: "recent" | "popular" | "trending" | "featured";
  /** Number of items to fetch */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Genre to filter by */
  genre?: string;
  /** Mood to filter by */
  mood?: string;
}

// ============ Extended Types ============

/**
 * Extended track type with creator info and likes
 * Includes enriched data from profiles and track_likes tables
 */
export interface PublicTrackWithCreator extends PublicTrack {
  /** Creator's display name */
  creator_name?: string;
  /** Creator's username */
  creator_username?: string;
  /** Creator's avatar URL */
  creator_photo_url?: string;
  /** Total number of likes */
  like_count?: number;
  /** Whether current user has liked the track */
  user_liked?: boolean;
}

/**
 * Aggregated public content data
 * Used by homepage sections for efficient rendering
 */
export interface PublicContentData {
  /** Featured/highlighted tracks */
  featuredTracks: PublicTrackWithCreator[];
  /** Most recently created tracks */
  recentTracks: PublicTrackWithCreator[];
  /** Most played tracks */
  popularTracks: PublicTrackWithCreator[];
  /** All fetched tracks */
  allTracks: PublicTrackWithCreator[];
  /** Tracks grouped by genre */
  tracksByGenre?: Record<string, PublicTrackWithCreator[]>;
}

// ============ Genre Configuration ============

/**
 * Genre query configuration for server-side filtering
 */
export interface GenreQueryConfig {
  /** Genre identifier */
  id: string;
  /** Database values to match in computed_genre column */
  dbValues: string[];
}

/**
 * Genre playlist definition
 */
export interface GenrePlaylistConfig {
  /** Genre identifier */
  genre: string;
  /** Display title */
  title: string;
  /** Description text */
  description: string;
  /** Keywords to match in track metadata */
  keywords: string[];
}

/**
 * Generated genre playlist with tracks
 */
export interface GenrePlaylist {
  /** Unique playlist ID */
  id: string;
  /** Genre identifier */
  genre: string;
  /** Display title */
  title: string;
  /** Description text */
  description: string;
  /** Tracks in the playlist */
  tracks: PublicTrackWithCreator[];
}
