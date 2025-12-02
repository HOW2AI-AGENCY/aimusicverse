/**
 * Versioning Utility Functions
 * 
 * Provides utilities for managing track versions, including:
 * - Version number generation and validation
 * - Master version management
 * - Version comparison and sorting
 * - Version label formatting
 */

import type { TrackVersion } from '@/hooks/useTrackVersions';

/**
 * Get the next version number for a track
 * @param versions - Array of existing versions for the track
 * @returns Next sequential version number
 */
export function getVersionNumber(versions: TrackVersion[]): number {
  if (!versions || versions.length === 0) {
    return 1;
  }
  
  const maxVersion = Math.max(
    ...versions.map(v => v.version_number || 0)
  );
  
  return maxVersion + 1;
}

/**
 * Set a version as the master version
 * This function prepares the data for an optimistic update
 * @param trackId - The track ID
 * @param versionId - The version ID to set as master
 * @param versions - Current versions array
 * @returns Updated versions array with new master
 */
export function setMasterVersion(
  trackId: string,
  versionId: string,
  versions: TrackVersion[]
): TrackVersion[] {
  return versions.map(version => ({
    ...version,
    is_master: version.id === versionId,
  }));
}

/**
 * Format a version label for display
 * @param version - The track version object
 * @returns Formatted version label (e.g., "v2 (Master)", "v1 - Remix")
 */
export function formatVersionLabel(version: TrackVersion): string {
  const versionNumber = version.version_number || 1;
  const versionType = version.version_type || 'original';
  const isMaster = version.is_master;
  
  let label = `v${versionNumber}`;
  
  if (isMaster) {
    label += ' (Master)';
  }
  
  if (versionType && versionType !== 'original') {
    const typeLabel = versionType.charAt(0).toUpperCase() + versionType.slice(1);
    label += ` - ${typeLabel}`;
  }
  
  return label;
}

/**
 * Compare two versions for sorting
 * Master version comes first, then by version number (descending)
 * @param a - First version
 * @param b - Second version
 * @returns Comparison result (-1, 0, 1)
 */
export function compareVersions(a: TrackVersion, b: TrackVersion): number {
  // Master version always comes first
  if (a.is_master && !b.is_master) return -1;
  if (!a.is_master && b.is_master) return 1;
  
  // Then sort by version number (descending)
  const aVersion = a.version_number || 0;
  const bVersion = b.version_number || 0;
  
  return bVersion - aVersion;
}

/**
 * Find the master version in an array of versions
 * @param versions - Array of track versions
 * @returns The master version, or the first version if no master is set
 */
export function getMasterVersion(versions: TrackVersion[]): TrackVersion | null {
  if (!versions || versions.length === 0) {
    return null;
  }
  
  const masterVersion = versions.find(v => v.is_master);
  return masterVersion || versions[0];
}

/**
 * Check if a version is the master version
 * @param versionId - Version ID to check
 * @param versions - Array of versions
 * @returns True if the version is the master
 */
export function isMasterVersion(versionId: string, versions: TrackVersion[]): boolean {
  const version = versions.find(v => v.id === versionId);
  return version?.is_master || false;
}

/**
 * Get version metadata with safe fallbacks
 * @param version - The track version
 * @returns Metadata object with type-safe access
 */
export function getVersionMetadata(version: TrackVersion): Record<string, unknown> {
  return version.metadata || {};
}

/**
 * Validate version number is within acceptable range
 * @param versionNumber - Version number to validate
 * @returns True if valid
 */
export function isValidVersionNumber(versionNumber: number): boolean {
  return Number.isInteger(versionNumber) && versionNumber > 0 && versionNumber <= 9999;
}
