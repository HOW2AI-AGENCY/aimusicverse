/**
 * Contract: useTrackVersionSwitcher Hook
 *
 * Hook for switching between A/B versions of a track.
 * Handles atomic updates to is_primary and active_version_id.
 */

import type { TrackVersion } from '@/types/track';

/**
 * Input parameters for useTrackVersionSwitcher hook.
 */
export interface UseTrackVersionSwitcherParams {
  /**
   * The ID of the track to switch versions for.
   */
  trackId: string;
}

/**
 * Return value from useTrackVersionSwitcher hook.
 */
export interface UseTrackVersionSwitcherReturn {
  /**
   * Currently active version of the track.
   */
  activeVersion: TrackVersion | null;

  /**
   * All versions of the track (A and B).
   */
  allVersions: TrackVersion[];

  /**
   * Switch to a different version.
   * Updates both is_primary and active_version_id atomically.
   *
   * @param versionId - The ID of the version to switch to
   *
   * @example
   * ```typescript
   * await switchVersion('version-b-id');
   * // Updates:
   * // - track.active_version_id = 'version-b-id'
   * // - track_versions.is_primary = true for version B
   * // - track_versions.is_primary = false for version A
   * ```
   */
  switchVersion: (versionId: string) => Promise<void>;

  /**
   * Whether a version switch is currently in progress.
   */
  isPending: boolean;

  /**
   * Error from the last version switch, if any.
   */
  error: Error | null;
}

/**
 * Hook contract for useTrackVersionSwitcher.
 *
 * @example
 * ```typescript
 * const { activeVersion, allVersions, switchVersion } = useTrackVersionSwitcher({
 *   trackId: 'track123',
 * });
 *
 * // Switch to version B
 * await switchVersion('version-b-id');
 * ```
 */
export interface UseTrackVersionSwitcherContract {
  /**
   * Hook function signature.
   */
  (params: UseTrackVersionSwitcherParams): UseTrackVersionSwitcherReturn;

  /**
   * Atomic update requirement.
   * Both is_primary and active_version_id must update together.
   */
  atomicUpdate: boolean;

  /**
   * Changelog requirement.
   * All version switches must be logged to track_change_log table.
   */
  changelogRequired: boolean;
}
