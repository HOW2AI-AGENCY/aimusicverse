/**
 * Contract: useTrackActions Hook
 *
 * Action hook for track operations (like, share, delete, etc.)
 * with optimistic updates.
 */

import type { Track } from '@/types/track';

/**
 * Input parameters for useTrackActions hook.
 */
export interface UseTrackActionsParams {
  /**
   * The ID of the track to perform actions on.
   */
  trackId: string;

  /**
   * Whether the hook should enable real-time updates.
   * @default true
   */
  enableRealtime?: boolean;
}

/**
 * Return value from useTrackActions hook.
 */
export interface UseTrackActionsReturn {
  /**
   * Like the track.
   * Performs optimistic update before API call.
   */
  likeTrack: () => Promise<void>;

  /**
   * Unlike the track.
   * Performs optimistic update before API call.
   */
  unlikeTrack: () => Promise<void>;

  /**
   * Share the track to a platform.
   * Supports: telegram, twitter, clipboard
   */
  shareTrack: (platform: 'telegram' | 'twitter' | 'clipboard') => Promise<void>;

  /**
   * Delete the track.
   * Shows confirmation dialog before deletion.
   */
  deleteTrack: () => Promise<void>;

  /**
   * Add track to a playlist.
   */
  addToPlaylist: (playlistId: string) => Promise<void>;

  /**
   * Remove track from a playlist.
   */
  removeFromPlaylist: (playlistId: string) => Promise<void>;

  /**
   * Duplicate/remix the track.
   */
  remixTrack: () => Promise<void>;

  /**
   * Download the track audio file.
   */
  downloadTrack: () => Promise<void>;

  /**
   * Whether any action is currently pending.
   */
  isPending: boolean;

  /**
   * Error from the last action, if any.
   */
  error: Error | null;

  /**
   * Clear the current error state.
   */
  clearError: () => void;
}

/**
 * Hook contract for useTrackActions.
 *
 * @example
 * ```typescript
 * const { likeTrack, shareTrack, deleteTrack, isPending } = useTrackActions({
 *   trackId: 'track123',
 * });
 *
 * await likeTrack(); // Optimistic update + API call
 * ```
 */
export interface UseTrackActionsContract {
  /**
   * Hook function signature.
   */
  (params: UseTrackActionsParams): UseTrackActionsReturn;

  /**
   * Mutations managed by this hook.
   */
  mutations: {
    likeTrack: string;
    unlikeTrack: string;
    shareTrack: string;
    deleteTrack: string;
    addToPlaylist: string;
    removeFromPlaylist: string;
    remixTrack: string;
    downloadTrack: string;
  };

  /**
   * Whether optimistic updates are enabled.
   */
  optimisticUpdates: boolean;
}
