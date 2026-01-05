/**
 * Track-related hook types
 *
 * Per data-model.md: TypeScript interfaces for track hooks
 * including useTrackData, useTrackActions, useTrackVersionSwitcher,
 * and useRealtimeTrackUpdates.
 */

import type { Track, TrackVersion, PublicTrackWithCreator } from '@/types/track';

// ============================================================================
// useTrackData Hook Types
// ============================================================================

/**
 * Parameters for useTrackData hook
 */
export interface UseTrackDataParams {
  /** Filter by user ID */
  userId?: string;
  /** Public tracks only */
  isPublic?: boolean;
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
  /** Filter by genres */
  genres?: string[];
  /** Filter by moods */
  moods?: string[];
  /** Search query */
  searchQuery?: string;
}

/**
 * Return value for useTrackData hook
 */
export interface UseTrackDataReturn {
  /** Fetched tracks */
  tracks: Track[] | PublicTrackWithCreator[];
  /** Initial loading state */
  isLoading: boolean;
  /** Background refetching state */
  isFetching: boolean;
  /** Error object */
  error: Error | null;
  /** Manual refetch function */
  refetch: () => void;
  /** More pages available */
  hasNextPage: boolean;
  /** Load next page function */
  fetchNextPage: () => void;
  /** Fetching next page state */
  isFetchingNextPage: boolean;
  /** Total matching tracks */
  totalCount?: number;
}

// ============================================================================
// useTrackActions Hook Types
// ============================================================================

/**
 * Share platform options
 */
export type SharePlatform = 'telegram' | 'twitter' | 'clipboard';

/**
 * Parameters for useTrackActions hook
 */
export interface UseTrackActionsParams {
  /** Track ID to perform actions on */
  trackId: string;
  /** Enable optimistic updates */
  enableOptimistic?: boolean;
}

/**
 * Return value for useTrackActions hook
 */
export interface UseTrackActionsReturn {
  /** Like the track */
  likeTrack: () => Promise<void>;
  /** Unlike the track */
  unlikeTrack: () => Promise<void>;
  /** Share the track */
  shareTrack: (platform: SharePlatform) => Promise<void>;
  /** Delete the track */
  deleteTrack: () => Promise<void>;
  /** Add to playlist */
  addToPlaylist: (playlistId: string) => Promise<void>;
  /** Remove from playlist */
  removeFromPlaylist: (playlistId: string) => Promise<void>;
  /** Remix the track */
  remixTrack: () => Promise<void>;
  /** Download the track */
  downloadTrack: () => Promise<void>;
  /** Any action in progress */
  isPending: boolean;
  /** Last error */
  error: Error | null;
}

// ============================================================================
// useTrackVersionSwitcher Hook Types
// ============================================================================

/**
 * Parameters for useTrackVersionSwitcher hook
 */
export interface UseTrackVersionSwitcherParams {
  /** Track ID with versions */
  trackId: string;
  /** Enable automatic refetch */
  enableRefetch?: boolean;
}

/**
 * Return value for useTrackVersionSwitcher hook
 */
export interface UseTrackVersionSwitcherReturn {
  /** Currently active version */
  activeVersion: TrackVersion | null;
  /** All available versions */
  allVersions: TrackVersion[];
  /** Switch to a different version */
  switchVersion: (versionId: string) => Promise<void>;
  /** Action in progress */
  isPending: boolean;
  /** Error object */
  error: Error | null;
}

// ============================================================================
// useRealtimeTrackUpdates Hook Types
// ============================================================================

/**
 * Track update payload from real-time subscription
 */
export interface TrackUpdate {
  /** Track ID */
  trackId: string;
  /** Update type */
  type: 'like' | 'play' | 'version' | 'delete' | 'metadata';
  /** Updated data */
  data: Partial<Track>;
  /** Timestamp */
  timestamp: number;
}

/**
 * Parameters for useRealtimeTrackUpdates hook
 */
export interface UseRealtimeTrackUpdatesParams {
  /** Track ID to subscribe to */
  trackId: string;
  /** Enable subscription */
  enabled?: boolean;
  /** Callback on update */
  onUpdate?: (update: TrackUpdate) => void;
}

/**
 * Return value for useRealtimeTrackUpdates hook
 */
export interface UseRealtimeTrackUpdatesReturn {
  /** Latest update data */
  data: TrackUpdate | null;
  /** Connection status */
  isConnected: boolean;
  /** Error object */
  error: Error | null;
}

// ============================================================================
// Combined Track Hook Types (for components using multiple hooks)
// ============================================================================

/**
 * Combined track data and actions
 */
export interface UseTrackDataAndActions extends UseTrackDataReturn, UseTrackActionsReturn {
  /** Track object */
  track: Track | PublicTrackWithCreator;
}
