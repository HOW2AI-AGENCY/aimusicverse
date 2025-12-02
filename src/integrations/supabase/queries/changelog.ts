/**
 * Changelog Query Functions
 * 
 * Supabase queries for track changelog and audit trail
 * Used by useTrackChangelog hook
 */

import { supabase } from '../client';
import type { Database, Json } from '../types';

type TrackChangelog = Database['public']['Tables']['track_changelog']['Row'];

type ChangeType = 
  | 'version_created'
  | 'master_changed'
  | 'metadata_updated'
  | 'stem_generated'
  | 'cover_updated'
  | 'lyrics_updated';

/**
 * Fetch changelog for a track
 */
export async function fetchTrackChangelog(trackId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('track_changelog')
    .select('*')
    .eq('track_id', trackId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as TrackChangelog[];
}

/**
 * Fetch changelog for a specific version
 */
export async function fetchVersionChangelog(versionId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('track_changelog')
    .select('*')
    .eq('version_id', versionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as TrackChangelog[];
}

/**
 * Create a changelog entry
 */
export async function createChangelogEntry(
  trackId: string,
  changeType: ChangeType,
  changeData: Json = {},
  versionId?: string | null
) {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('track_changelog')
    .insert({
      track_id: trackId,
      version_id: versionId || null,
      change_type: changeType,
      change_data: changeData,
      user_id: userData.user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as TrackChangelog;
}

/**
 * Log version creation
 */
export async function logVersionCreated(
  trackId: string,
  versionId: string,
  versionNumber: number,
  versionType: string | null
) {
  return createChangelogEntry(
    trackId,
    'version_created',
    {
      version_number: versionNumber,
      version_type: versionType,
    },
    versionId
  );
}

/**
 * Log master version change
 */
export async function logMasterChanged(
  trackId: string,
  oldVersionId: string | null,
  newVersionId: string,
  reason?: string
) {
  return createChangelogEntry(
    trackId,
    'master_changed',
    {
      old_value: { version_id: oldVersionId },
      new_value: { version_id: newVersionId },
      reason,
    },
    newVersionId
  );
}

/**
 * Log metadata update
 */
export async function logMetadataUpdated(
  trackId: string,
  oldMetadata: Record<string, unknown>,
  newMetadata: Record<string, unknown>,
  versionId?: string | null
) {
  return createChangelogEntry(
    trackId,
    'metadata_updated',
    {
      old_value: oldMetadata,
      new_value: newMetadata,
    },
    versionId
  );
}

/**
 * Log stem generation
 */
export async function logStemGenerated(
  trackId: string,
  stemType: string,
  stemUrl: string,
  versionId?: string | null
) {
  return createChangelogEntry(
    trackId,
    'stem_generated',
    {
      stem_type: stemType,
      stem_url: stemUrl,
    },
    versionId
  );
}

/**
 * Log cover update
 */
export async function logCoverUpdated(
  trackId: string,
  oldCoverUrl: string | null,
  newCoverUrl: string | null,
  versionId?: string | null
) {
  return createChangelogEntry(
    trackId,
    'cover_updated',
    {
      old_value: { cover_url: oldCoverUrl },
      new_value: { cover_url: newCoverUrl },
    },
    versionId
  );
}

/**
 * Log lyrics update
 */
export async function logLyricsUpdated(
  trackId: string,
  oldLyrics: string | null,
  newLyrics: string | null,
  versionId?: string | null
) {
  return createChangelogEntry(
    trackId,
    'lyrics_updated',
    {
      old_value: { lyrics: oldLyrics },
      new_value: { lyrics: newLyrics },
    },
    versionId
  );
}

/**
 * Get changelog count for a track
 */
export async function getChangelogCount(trackId: string) {
  const { count, error } = await supabase
    .from('track_changelog')
    .select('id', { count: 'exact', head: true })
    .eq('track_id', trackId);

  if (error) throw error;
  return count || 0;
}

/**
 * Fetch recent changes across all user's tracks
 */
export async function fetchUserRecentChanges(userId: string, limit: number = 20) {
  const { data, error } = await supabase
    .from('track_changelog')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as TrackChangelog[];
}

/**
 * Fetch changes by type
 */
export async function fetchChangesByType(
  trackId: string,
  changeType: ChangeType,
  limit: number = 20
) {
  const { data, error } = await supabase
    .from('track_changelog')
    .select('*')
    .eq('track_id', trackId)
    .eq('change_type', changeType)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as TrackChangelog[];
}
