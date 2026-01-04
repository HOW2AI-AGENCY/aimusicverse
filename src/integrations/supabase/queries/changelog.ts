/**
 * Changelog Query Functions
 * 
 * Supabase queries for track changelog and audit trail
 * Uses track_change_log table
 */

import { supabase } from '../client';
import type { Database, Json } from '../types';

type TrackChangeLog = Database['public']['Tables']['track_change_log']['Row'];

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
    .from('track_change_log')
    .select('*')
    .eq('track_id', trackId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as TrackChangeLog[];
}

/**
 * Fetch changelog for a specific version
 */
export async function fetchVersionChangelog(versionId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('track_change_log')
    .select('*')
    .eq('version_id', versionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as TrackChangeLog[];
}

/**
 * Create a changelog entry
 */
export async function createChangelogEntry(
  trackId: string,
  changeType: ChangeType,
  options: {
    versionId?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
    fieldName?: string | null;
    metadata?: Json;
    promptUsed?: string | null;
    aiModelUsed?: string | null;
  } = {}
) {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('track_change_log')
    .insert({
      track_id: trackId,
      version_id: options.versionId || null,
      change_type: changeType,
      changed_by: 'user',
      user_id: userData.user.id,
      old_value: options.oldValue || null,
      new_value: options.newValue || null,
      field_name: options.fieldName || null,
      metadata: options.metadata || null,
      prompt_used: options.promptUsed || null,
      ai_model_used: options.aiModelUsed || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as TrackChangeLog;
}

/**
 * Log version creation
 */
export async function logVersionCreated(
  trackId: string,
  versionId: string,
  versionType: string | null
) {
  return createChangelogEntry(trackId, 'version_created', {
    versionId,
    newValue: versionType,
    fieldName: 'version_type',
  });
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
  return createChangelogEntry(trackId, 'master_changed', {
    versionId: newVersionId,
    oldValue: oldVersionId,
    newValue: newVersionId,
    fieldName: 'primary_version',
  });
}

/**
 * Log metadata update
 */
export async function logMetadataUpdated(
  trackId: string,
  fieldName: string,
  oldValue: string | null,
  newValue: string | null,
  versionId?: string | null
) {
  return createChangelogEntry(trackId, 'metadata_updated', {
    versionId,
    oldValue,
    newValue,
    fieldName,
  });
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
  return createChangelogEntry(trackId, 'stem_generated', {
    versionId,
    newValue: stemUrl,
    fieldName: stemType,
  });
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
  return createChangelogEntry(trackId, 'cover_updated', {
    versionId,
    oldValue: oldCoverUrl,
    newValue: newCoverUrl,
    fieldName: 'cover_url',
  });
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
  return createChangelogEntry(trackId, 'lyrics_updated', {
    versionId,
    oldValue: oldLyrics,
    newValue: newLyrics,
    fieldName: 'lyrics',
  });
}

/**
 * Get changelog count for a track
 */
export async function getChangelogCount(trackId: string) {
  const { count, error } = await supabase
    .from('track_change_log')
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
    .from('track_change_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as TrackChangeLog[];
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
    .from('track_change_log')
    .select('*')
    .eq('track_id', trackId)
    .eq('change_type', changeType)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as TrackChangeLog[];
}
