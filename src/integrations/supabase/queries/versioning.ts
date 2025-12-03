/**
 * Versioning Query Functions
 * 
 * Supabase queries for track version management
 * Used by useTrackVersions and useVersionSwitcher hooks
 */

import { supabase } from '../client';
import type { Database } from '../types';

type TrackVersion = Database['public']['Tables']['track_versions']['Row'];
type Track = Database['public']['Tables']['tracks']['Row'];

/**
 * Fetch all versions for a track
 */
export async function fetchTrackVersions(trackId: string) {
  const { data, error } = await supabase
    .from('track_versions')
    .select('*')
    .eq('track_id', trackId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as TrackVersion[];
}

/**
 * Fetch single version by ID
 */
export async function fetchVersion(versionId: string) {
  const { data, error } = await supabase
    .from('track_versions')
    .select('*')
    .eq('id', versionId)
    .single();

  if (error) throw error;
  return data as TrackVersion;
}

/**
 * Fetch primary version for a track
 */
export async function fetchPrimaryVersion(trackId: string) {
  const { data, error } = await supabase
    .from('track_versions')
    .select('*')
    .eq('track_id', trackId)
    .eq('is_primary', true)
    .single();

  // If no primary version, get the first version
  if (error || !data) {
    const { data: firstVersion, error: firstError } = await supabase
      .from('track_versions')
      .select('*')
      .eq('track_id', trackId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (firstError) throw firstError;
    return firstVersion as TrackVersion;
  }

  return data as TrackVersion;
}

/**
 * Set a version as primary
 */
export async function setPrimaryVersion(trackId: string, versionId: string) {
  // First, unset current primary
  const { error: unsetError } = await supabase
    .from('track_versions')
    .update({ is_primary: false })
    .eq('track_id', trackId)
    .eq('is_primary', true);

  if (unsetError) throw unsetError;

  // Then set new primary
  const { error: setError } = await supabase
    .from('track_versions')
    .update({ is_primary: true })
    .eq('id', versionId);

  if (setError) throw setError;

  return { trackId, versionId };
}

/**
 * Create a new version
 */
export async function createVersion(
  trackId: string,
  versionData: {
    audio_url: string;
    cover_url?: string | null;
    duration_seconds?: number | null;
    version_type?: string | null;
    parent_version_id?: string | null;
    metadata?: Record<string, unknown> | null;
  }
) {
  // Get existing versions count
  const { data: versions, error: versionsError } = await supabase
    .from('track_versions')
    .select('id')
    .eq('track_id', trackId);

  if (versionsError) throw versionsError;

  const isFirst = !versions || versions.length === 0;

  // Create the version
  const { data, error } = await supabase
    .from('track_versions')
    .insert({
      track_id: trackId,
      audio_url: versionData.audio_url,
      cover_url: versionData.cover_url,
      duration_seconds: versionData.duration_seconds,
      version_type: versionData.version_type,
      parent_version_id: versionData.parent_version_id,
      metadata: versionData.metadata as any,
      is_primary: isFirst,
    })
    .select()
    .single();

  if (error) throw error;
  return data as TrackVersion;
}

/**
 * Update version metadata
 */
export async function updateVersion(
  versionId: string,
  updates: {
    cover_url?: string | null;
    version_type?: string | null;
    metadata?: Record<string, unknown> | null;
  }
) {
  const { data, error } = await supabase
    .from('track_versions')
    .update({
      cover_url: updates.cover_url,
      version_type: updates.version_type,
      metadata: updates.metadata as any,
    })
    .eq('id', versionId)
    .select()
    .single();

  if (error) throw error;
  return data as TrackVersion;
}

/**
 * Delete a version (cannot delete primary or only version)
 */
export async function deleteVersion(versionId: string, trackId: string) {
  // Check if it's the primary version
  const { data: version, error: versionError } = await supabase
    .from('track_versions')
    .select('is_primary')
    .eq('id', versionId)
    .single();

  if (versionError) throw versionError;

  if (version.is_primary) {
    throw new Error('Cannot delete primary version. Set a different version as primary first.');
  }

  // Check if it's the only version
  const { data: versions, error: versionsError } = await supabase
    .from('track_versions')
    .select('id')
    .eq('track_id', trackId);

  if (versionsError) throw versionsError;

  if (versions.length === 1) {
    throw new Error('Cannot delete the only version of a track.');
  }

  // Delete the version
  const { error } = await supabase
    .from('track_versions')
    .delete()
    .eq('id', versionId);

  if (error) throw error;
}

/**
 * Get version count for a track
 */
export async function getVersionCount(trackId: string) {
  const { count, error } = await supabase
    .from('track_versions')
    .select('id', { count: 'exact', head: true })
    .eq('track_id', trackId);

  if (error) throw error;
  return count || 0;
}

/**
 * Fetch tracks with their primary versions
 */
export async function fetchTracksWithPrimaryVersions(userId: string, limit: number = 20) {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Track[];
}
