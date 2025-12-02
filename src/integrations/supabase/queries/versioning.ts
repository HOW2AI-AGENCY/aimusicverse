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
    .order('is_master', { ascending: false })
    .order('version_number', { ascending: false });

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
 * Fetch master version for a track
 */
export async function fetchMasterVersion(trackId: string) {
  const { data, error } = await supabase
    .from('track_versions')
    .select('*')
    .eq('track_id', trackId)
    .eq('is_master', true)
    .single();

  // If no master version, get the first version
  if (error || !data) {
    const { data: firstVersion, error: firstError } = await supabase
      .from('track_versions')
      .select('*')
      .eq('track_id', trackId)
      .order('version_number', { ascending: true })
      .limit(1)
      .single();

    if (firstError) throw firstError;
    return firstVersion as TrackVersion;
  }

  return data as TrackVersion;
}

/**
 * Set a version as master
 */
export async function setMasterVersion(trackId: string, versionId: string) {
  // First, unset current master
  const { error: unsetError } = await supabase
    .from('track_versions')
    .update({ is_master: false })
    .eq('track_id', trackId)
    .eq('is_master', true);

  if (unsetError) throw unsetError;

  // Then set new master
  const { error: setError } = await supabase
    .from('track_versions')
    .update({ is_master: true })
    .eq('id', versionId);

  if (setError) throw setError;

  // Update the track's master_version_id
  const { error: trackError } = await supabase
    .from('tracks')
    .update({ master_version_id: versionId })
    .eq('id', trackId);

  if (trackError) throw trackError;

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
  // Get the next version number
  const { data: versions, error: versionsError } = await supabase
    .from('track_versions')
    .select('version_number')
    .eq('track_id', trackId)
    .order('version_number', { ascending: false })
    .limit(1);

  if (versionsError) throw versionsError;

  const nextVersionNumber = versions && versions.length > 0 
    ? (versions[0].version_number || 0) + 1 
    : 1;

  // Create the version
  const { data, error } = await supabase
    .from('track_versions')
    .insert({
      track_id: trackId,
      version_number: nextVersionNumber,
      is_master: nextVersionNumber === 1, // First version is master
      ...versionData,
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
    .update(updates)
    .eq('id', versionId)
    .select()
    .single();

  if (error) throw error;
  return data as TrackVersion;
}

/**
 * Delete a version (cannot delete master or only version)
 */
export async function deleteVersion(versionId: string, trackId: string) {
  // Check if it's the master version
  const { data: version, error: versionError } = await supabase
    .from('track_versions')
    .select('is_master')
    .eq('id', versionId)
    .single();

  if (versionError) throw versionError;

  if (version.is_master) {
    throw new Error('Cannot delete master version. Set a different version as master first.');
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
 * Fetch tracks with their master versions
 */
export async function fetchTracksWithMasterVersions(userId: string, limit: number = 20) {
  const { data, error } = await supabase
    .from('tracks')
    .select(`
      *,
      master_version:track_versions!master_version_id(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as (Track & { master_version: TrackVersion | null })[];
}
