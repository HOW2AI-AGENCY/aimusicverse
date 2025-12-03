/**
 * Versioning Utility Functions
 * 
 * Provides utilities for managing track versions, including:
 * - Version management
 * - Primary version management
 * - Version comparison and sorting
 * - Version label formatting
 */

import type { Database } from '@/integrations/supabase/types';

type TrackVersion = Database['public']['Tables']['track_versions']['Row'];

/**
 * Get version index (1-based) for a track
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
 * Primary version comes first, then by creation date (descending)
 */
export function compareVersions(a: TrackVersion, b: TrackVersion): number {
  if (a.is_primary && !b.is_primary) return -1;
  if (!a.is_primary && b.is_primary) return 1;
  
  const aDate = new Date(a.created_at || '').getTime();
  const bDate = new Date(b.created_at || '').getTime();
  
  return bDate - aDate;
}

/**
 * Find the primary version in an array of versions
 */
export function getPrimaryVersion(versions: TrackVersion[]): TrackVersion | null {
  if (!versions || versions.length === 0) {
    return null;
  }
  
  const primaryVersion = versions.find(v => v.is_primary);
  return primaryVersion || versions[0];
}

/**
 * Check if a version is the primary version
 */
export function isPrimaryVersion(versionId: string, versions: TrackVersion[]): boolean {
  const version = versions.find(v => v.id === versionId);
  return version?.is_primary || false;
}

/**
 * Get version metadata with safe fallbacks
 */
export function getVersionMetadata(version: TrackVersion): Record<string, unknown> {
  if (typeof version.metadata === 'object' && version.metadata !== null && !Array.isArray(version.metadata)) {
    return version.metadata as Record<string, unknown>;
  }
  return {};
}

/**
 * Get total version count
 */
export function getVersionCount(versions: TrackVersion[]): number {
  return versions?.length || 0;
}
