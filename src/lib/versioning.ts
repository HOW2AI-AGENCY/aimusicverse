/**
 * Versioning Utility Functions
 * 
 * Provides utilities for managing track versions, including:
 * - Version management
 * - Primary version management (using `is_primary` field)
 * - Version comparison and sorting
 * - Version label formatting
 * 
 * IMPORTANT: Database Schema Conventions
 * ========================================
 * - The field `is_primary` is used to mark the active/main version of a track
 * - Each track can have multiple versions (e.g., A, B, C clips from Suno)
 * - Only ONE version per track should have `is_primary = true`
 * - The `is_primary` version is displayed by default in the library and player
 * - Do NOT use `is_master` - this is an obsolete field from an old migration
 * 
 * Version Counting Logic:
 * =======================
 * - Each version is a separate row in `track_versions` table
 * - Versions are identified by unique `id` (UUID)
 * - Versions are ordered by `created_at` timestamp
 * - The `version_label` field stores user-friendly labels (A, B, C)
 * 
 * Problem Context:
 * ================
 * This fix addresses an issue where 3 versions were showing when only 2 existed.
 * Root cause: Confusion between `is_primary` and obsolete `is_master` field.
 * Solution: Standardized on `is_primary` throughout the codebase.
 */

import type { Database } from '@/integrations/supabase/types';

type TrackVersion = Database['public']['Tables']['track_versions']['Row'];

/**
 * Get version index (1-based) for a track
 * 
 * Returns the sequential position of a version within all versions of a track.
 * Versions are sorted by creation date (oldest first).
 * 
 * @param versions - Array of all versions for the track
 * @param versionId - The ID of the version to find the index for
 * @returns 1-based index (1, 2, 3...), defaults to 1 if not found
 * 
 * Example: If a track has versions A (created first), B (created second),
 * getVersionIndex(versions, B.id) returns 2
 */
export function getVersionIndex(versions: TrackVersion[], versionId: string): number {
  const sortedVersions = [...versions].sort((a, b) => 
    new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
  );
  const index = sortedVersions.findIndex(v => v.id === versionId);
  return index >= 0 ? index + 1 : 1;
}

/**
 * Set a version as the primary version (optimistic update helper)
 * 
 * Creates a new array where the specified version has `is_primary = true`
 * and all others have `is_primary = false`.
 * 
 * This is used for optimistic UI updates before the database update completes.
 * The actual database update should use the pattern:
 * 1. UPDATE all versions SET is_primary = false WHERE track_id = X
 * 2. UPDATE specific version SET is_primary = true WHERE id = Y
 * 
 * @param versionId - ID of the version to mark as primary
 * @param versions - Current array of versions
 * @returns New array with updated is_primary flags
 */
export function setPrimaryVersionOptimistic(
  versionId: string,
  versions: TrackVersion[]
): TrackVersion[] {
  return versions.map(version => ({
    ...version,
    is_primary: version.id === versionId,
  }));
}

/**
 * Format a version label for display
 * 
 * Creates a human-readable label for a version combining:
 * - Version number (v1, v2, v3...)
 * - Primary indicator if applicable
 * - Version type if not standard (initial/original)
 * 
 * @param version - The version object to format
 * @param index - The sequential index (1-based) of this version
 * @returns Formatted label string, e.g., "v2 (Primary) - Extended"
 * 
 * Examples:
 * - "v1" - First version, not primary, original type
 * - "v2 (Primary)" - Second version, is primary
 * - "v3 (Primary) - Extended" - Third version, primary, extended type
 */
export function formatVersionLabel(version: TrackVersion, index: number): string {
  const versionType = version.version_type || 'original';
  const isPrimary = version.is_primary;
  
  let label = `v${index}`;
  
  if (isPrimary) {
    label += ' (Primary)';
  }
  
  if (versionType && versionType !== 'original' && versionType !== 'initial') {
    const typeLabel = versionType.charAt(0).toUpperCase() + versionType.slice(1);
    label += ` - ${typeLabel}`;
  }
  
  return label;
}

/**
 * Compare two versions for sorting
 * 
 * Sorting priority:
 * 1. Primary version always comes first
 * 2. Among non-primary versions, newest first (descending by creation date)
 * 
 * This ensures the active version is always at the top of the list,
 * followed by other versions in reverse chronological order.
 * 
 * @param a - First version to compare
 * @param b - Second version to compare
 * @returns Negative if a should come before b, positive if after, 0 if equal
 * 
 * Usage example:
 * const sortedVersions = versions.sort(compareVersions);
 * // Result: [primary version, newest version, older version, ...]
 */
export function compareVersions(a: TrackVersion, b: TrackVersion): number {
  // Primary version always comes first
  if (a.is_primary && !b.is_primary) return -1;
  if (!a.is_primary && b.is_primary) return 1;
  
  // If neither or both are primary, sort by creation date (newest first)
  const aDate = new Date(a.created_at || '').getTime();
  const bDate = new Date(b.created_at || '').getTime();
  
  return bDate - aDate;
}

/**
 * Find the primary version in an array of versions
 * 
 * Searches for a version with `is_primary = true`.
 * If no primary version is found, returns the first version as fallback.
 * 
 * @param versions - Array of versions to search
 * @returns The primary version, or first version as fallback, or null if empty
 * 
 * Note: Under normal circumstances, each track should have exactly ONE
 * primary version. If multiple versions have is_primary=true, this returns
 * the first one found (database constraints should prevent this scenario).
 */
export function getPrimaryVersion(versions: TrackVersion[]): TrackVersion | null {
  if (!versions || versions.length === 0) {
    return null;
  }
  
  // Find version marked as primary
  const primaryVersion = versions.find(v => v.is_primary);
  
  // Fallback to first version if no primary is set
  return primaryVersion || versions[0];
}

/**
 * Check if a version is the primary version
 * 
 * @param versionId - ID of the version to check
 * @param versions - Array of versions to search in
 * @returns true if the version exists and has is_primary = true
 * 
 * This is a convenience function for checking primary status by ID.
 * Returns false if the version is not found or is_primary is false/null.
 */
export function isPrimaryVersion(versionId: string, versions: TrackVersion[]): boolean {
  const version = versions.find(v => v.id === versionId);
  return version?.is_primary || false;
}

/**
 * Get version metadata with safe fallbacks
 * 
 * Extracts metadata from a version with type-safe handling.
 * The metadata field in the database is JSONB and can contain various data.
 * 
 * @param version - Version object containing metadata
 * @returns Metadata as a record object, or empty object if invalid/missing
 * 
 * This function handles cases where metadata might be:
 * - null (returns {})
 * - array (returns {})
 * - non-object (returns {})
 * - valid object (returns as-is)
 */
export function getVersionMetadata(version: TrackVersion): Record<string, unknown> {
  if (typeof version.metadata === 'object' && version.metadata !== null && !Array.isArray(version.metadata)) {
    return version.metadata as Record<string, unknown>;
  }
  return {};
}

/**
 * Get total version count
 * 
 * Returns the number of versions in the array.
 * Safe to use with null/undefined inputs (returns 0).
 * 
 * @param versions - Array of versions (or null/undefined)
 * @returns Count of versions, or 0 if array is null/undefined/empty
 * 
 * This count represents the ACTUAL number of version records in the database.
 * Each version is a separate entity (e.g., clip A, clip B from Suno generation).
 */
export function getVersionCount(versions: TrackVersion[]): number {
  return versions?.length || 0;
}
