// @ts-nocheck
/**
 * Lyrics API Layer
 * Raw Supabase database operations for lyrics versioning and section notes
 *
 * Implements endpoints from specs/031-mobile-studio-v2/contracts/api-contracts.md
 */

import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

// ============= Type Definitions =============

export type LyricVersion = Tables<'lyrics_versions'>;
export type LyricsSectionNote = Tables<'lyrics_section_notes'>;

/**
 * Author information for lyric versions and notes
 */
export interface Author {
  id: string;
  username: string;
}

/**
 * Lyric version with author details
 */
export interface LyricVersionWithAuthor {
  id: string;
  versionNumber: number;
  content: string;
  author: Author;
  createdAt: string;
  isCurrent: boolean;
  changeSummary: string | null;
  versionName: string | null;
  changeType: string;
  sectionsData: unknown;
  tags: string[] | null;
  aiModelUsed: string | null;
  aiPromptUsed: string | null;
}

/**
 * Section note with author details
 */
export interface SectionNoteWithAuthor {
  id: string;
  content: string;
  noteType: string;
  author: Author;
  createdAt: string;
  isResolved: boolean;
  sectionId: string;
  sectionType: string | null;
  position: number | null;
  tags: string[] | null;
  audioNoteUrl: string | null;
  referenceAudioUrl: string | null;
  referenceAnalysis: unknown;
}

/**
 * Response for get lyric versions endpoint
 */
export interface GetLyricVersionsResponse {
  versions: LyricVersionWithAuthor[];
}

/**
 * Request for create lyric version
 */
export interface CreateLyricVersionRequest {
  content: string;
  changeSummary?: string;
  changeType: string;
  versionName?: string;
  sectionsData?: unknown;
  tags?: string[];
}

/**
 * Response for create lyric version endpoint
 */
export interface CreateLyricVersionResponse {
  id: string;
  versionNumber: number;
  content: string;
  author: Author;
  createdAt: string;
  isCurrent: boolean;
  changeSummary: string | null;
  changeType: string;
}

/**
 * Response for restore lyric version endpoint
 */
export interface RestoreLyricVersionResponse {
  success: boolean;
  restoredVersion: {
    id: string;
    versionNumber: number;
    content: string;
    isCurrent: boolean;
  };
}

/**
 * Response for get section notes endpoint
 */
export interface GetSectionNotesResponse {
  notes: SectionNoteWithAuthor[];
}

/**
 * Request for create section note
 */
export interface CreateSectionNoteRequest {
  content: string;
  noteType: string;
  sectionType?: string;
  position?: number;
  tags?: string[];
  audioNoteUrl?: string;
  referenceAudioUrl?: string;
  referenceAnalysis?: unknown;
}

/**
 * Response for create section note endpoint
 */
export interface CreateSectionNoteResponse {
  id: string;
  content: string;
  noteType: string;
  createdAt: string;
  isResolved: boolean;
  sectionId: string;
}

// ============= Lyric Versions =============

/**
 * Get all lyric versions for a track
 *
 * GET /tracks/{trackId}/lyrics/versions
 *
 * @param trackId - The track ID to fetch lyrics versions for
 * @returns Promise with array of lyric versions with author details
 * @throws Error if database query fails
 *
 * @example
 * const versions = await getLyricVersions('track-uuid');
 * console.log(versions.versions);
 */
export async function getLyricVersions(
  trackId: string
): Promise<GetLyricVersionsResponse> {
  const { data, error } = await supabase
    .from('lyrics_versions')
    .select(`
      *,
      profiles!lyrics_versions_user_id_fkey (
        id,
        username
      )
    `)
    .eq('project_track_id', trackId)
    .order('version_number', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch lyric versions: ${error.message}`);
  }

  // Transform the data to match API contract
  const versions: LyricVersionWithAuthor[] = (data || []).map((version: any) => ({
    id: version.id,
    versionNumber: version.version_number,
    content: version.lyrics,
    author: {
      id: version.profiles.id,
      username: version.profiles.username,
    },
    createdAt: version.created_at,
    isCurrent: version.is_current ?? false,
    changeSummary: version.change_description,
    versionName: version.version_name,
    changeType: version.change_type,
    sectionsData: version.sections_data,
    tags: version.tags,
    aiModelUsed: version.ai_model_used,
    aiPromptUsed: version.ai_prompt_used,
  }));

  return { versions };
}

/**
 * Create a new lyric version for a track
 *
 * POST /tracks/{trackId}/lyrics/versions
 *
 * @param trackId - The track ID to create the lyric version for
 * @param userId - The user ID creating the version
 * @param request - The lyric version data
 * @returns Promise with created lyric version
 * @throws Error if database operation fails
 *
 * @example
 * const newVersion = await createLyricVersion('track-uuid', 'user-uuid', {
 *   content: 'New lyrics...',
 *   changeSummary: 'Revised chorus',
 *   changeType: 'manual_edit'
 * });
 */
export async function createLyricVersion(
  trackId: string,
  userId: string,
  request: CreateLyricVersionRequest
): Promise<CreateLyricVersionResponse> {
  // First, get the next version number
  const { data: existingVersions, error: fetchError } = await supabase
    .from('lyrics_versions')
    .select('version_number')
    .eq('project_track_id', trackId)
    .order('version_number', { ascending: false })
    .limit(1);

  if (fetchError) {
    throw new Error(`Failed to fetch existing versions: ${fetchError.message}`);
  }

  const nextVersionNumber = (existingVersions?.[0]?.version_number ?? 0) + 1;

  // Set is_current to false for all existing versions
  await supabase
    .from('lyrics_versions')
    .update({ is_current: false })
    .eq('project_track_id', trackId)
    .eq('is_current', true);

  // Create the new version
  const { data, error } = await supabase
    .from('lyrics_versions')
    .insert({
      project_track_id: trackId,
      user_id: userId,
      lyrics: request.content,
      change_description: request.changeSummary || null,
      change_type: request.changeType,
      version_name: request.versionName || null,
      version_number: nextVersionNumber,
      is_current: true,
      sections_data: request.sectionsData || null,
      tags: request.tags || null,
    })
    .select(`
      *,
      profiles!lyrics_versions_user_id_fkey (
        id,
        username
      )
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create lyric version: ${error.message}`);
  }

  return {
    id: data.id,
    versionNumber: data.version_number,
    content: data.lyrics,
    author: {
      id: data.profiles.id,
      username: data.profiles.username,
    },
    createdAt: data.created_at,
    isCurrent: data.is_current ?? false,
    changeSummary: data.change_description,
    changeType: data.change_type,
  };
}

/**
 * Restore a previous lyric version as current
 *
 * POST /lyric-versions/{versionId}/restore
 *
 * This creates a new version based on the content of a previous version,
 * marking it as the current version.
 *
 * @param versionId - The version ID to restore
 * @returns Promise with restored version data
 * @throws Error if database operation fails
 *
 * @example
 * const result = await restoreLyricVersion('version-uuid');
 * console.log(result.restoredVersion);
 */
export async function restoreLyricVersion(
  versionId: string
): Promise<RestoreLyricVersionResponse> {
  // First, fetch the version to restore
  const { data: versionToRestore, error: fetchError } = await supabase
    .from('lyrics_versions')
    .select('*')
    .eq('id', versionId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch version to restore: ${fetchError.message}`);
  }

  if (!versionToRestore) {
    throw new Error('Version not found');
  }

  // Get the next version number
  const { data: existingVersions, error: versionError } = await supabase
    .from('lyrics_versions')
    .select('version_number')
    .eq('project_track_id', versionToRestore.project_track_id)
    .order('version_number', { ascending: false })
    .limit(1);

  if (versionError) {
    throw new Error(`Failed to fetch existing versions: ${versionError.message}`);
  }

  const nextVersionNumber = (existingVersions?.[0]?.version_number ?? 0) + 1;

  // Set is_current to false for all existing versions
  await supabase
    .from('lyrics_versions')
    .update({ is_current: false })
    .eq('project_track_id', versionToRestore.project_track_id)
    .eq('is_current', true);

  // Create a new version with the restored content
  const { data, error } = await supabase
    .from('lyrics_versions')
    .insert({
      project_track_id: versionToRestore.project_track_id,
      user_id: versionToRestore.user_id,
      lyrics: versionToRestore.lyrics,
      change_description: `Restored from version ${versionToRestore.version_number}`,
      change_type: 'restore',
      version_name: `v${nextVersionNumber} (restored)`,
      version_number: nextVersionNumber,
      is_current: true,
      sections_data: versionToRestore.sections_data,
      tags: versionToRestore.tags,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to restore lyric version: ${error.message}`);
  }

  return {
    success: true,
    restoredVersion: {
      id: data.id,
      versionNumber: data.version_number,
      content: data.lyrics,
      isCurrent: data.is_current ?? false,
    },
  };
}

// ============= Section Notes =============

/**
 * Get all notes for a lyrics section
 *
 * GET /sections/{sectionId}/notes
 *
 * @param sectionId - The section ID to fetch notes for
 * @returns Promise with array of section notes with author details
 * @throws Error if database query fails
 *
 * @example
 * const notes = await getSectionNotes('section-uuid');
 * console.log(notes.notes);
 */
export async function getSectionNotes(
  sectionId: string
): Promise<GetSectionNotesResponse> {
  const { data, error } = await supabase
    .from('lyrics_section_notes')
    .select(`
      *,
      profiles!lyrics_section_notes_user_id_fkey (
        id,
        username
      )
    `)
    .eq('section_id', sectionId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch section notes: ${error.message}`);
  }

  // Transform the data to match API contract
  const notes: SectionNoteWithAuthor[] = (data || []).map((note: any) => ({
    id: note.id,
    content: note.notes || '',
    noteType: note.section_type || 'general',
    author: {
      id: note.profiles.id,
      username: note.profiles.username,
    },
    createdAt: note.created_at || new Date().toISOString(),
    isResolved: false, // This field may need to be added to the schema
    sectionId: note.section_id,
    sectionType: note.section_type,
    position: note.position,
    tags: note.tags,
    audioNoteUrl: note.audio_note_url,
    referenceAudioUrl: note.reference_audio_url,
    referenceAnalysis: note.reference_analysis,
  }));

  return { notes };
}

/**
 * Create a new section note
 *
 * POST /sections/{sectionId}/notes
 *
 * @param sectionId - The section ID to create the note for
 * @param userId - The user ID creating the note
 * @param request - The section note data
 * @returns Promise with created section note
 * @throws Error if database operation fails
 *
 * @example
 * const newNote = await createSectionNote('section-uuid', 'user-uuid', {
 *   content: 'Add harmony here',
 *   noteType: 'production'
 * });
 */
export async function createSectionNote(
  sectionId: string,
  userId: string,
  request: CreateSectionNoteRequest
): Promise<CreateSectionNoteResponse> {
  const { data, error } = await supabase
    .from('lyrics_section_notes')
    .insert({
      section_id: sectionId,
      user_id: userId,
      notes: request.content,
      section_type: request.noteType,
      position: request.position || null,
      tags: request.tags || null,
      audio_note_url: request.audioNoteUrl || null,
      reference_audio_url: request.referenceAudioUrl || null,
      reference_analysis: request.referenceAnalysis || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create section note: ${error.message}`);
  }

  return {
    id: data.id,
    content: data.notes || '',
    noteType: data.section_type || 'general',
    createdAt: data.created_at || new Date().toISOString(),
    isResolved: false, // This field may need to be added to the schema
    sectionId: data.section_id,
  };
}

/**
 * Update an existing section note
 *
 * @param noteId - The note ID to update
 * @param updates - The fields to update
 * @returns Promise with updated note
 * @throws Error if database operation fails
 *
 * @example
 * const updated = await updateSectionNote('note-uuid', {
 *   content: 'Updated note content',
 *   isResolved: true
 * });
 */
export async function updateSectionNote(
  noteId: string,
  updates: Partial<{
    content: string;
    noteType: string;
    position: number;
    tags: string[];
    audioNoteUrl: string;
    referenceAudioUrl: string;
    referenceAnalysis: unknown;
  }>
): Promise<LyricsSectionNote> {
  const { data, error } = await supabase
    .from('lyrics_section_notes')
    .update({
      notes: updates.content,
      section_type: updates.noteType,
      position: updates.position,
      tags: updates.tags,
      audio_note_url: updates.audioNoteUrl,
      reference_audio_url: updates.referenceAudioUrl,
      reference_analysis: updates.referenceAnalysis,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update section note: ${error.message}`);
  }

  return data;
}

/**
 * Delete a section note
 *
 * @param noteId - The note ID to delete
 * @throws Error if database operation fails
 *
 * @example
 * await deleteSectionNote('note-uuid');
 */
export async function deleteSectionNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('lyrics_section_notes')
    .delete()
    .eq('id', noteId);

  if (error) {
    throw new Error(`Failed to delete section note: ${error.message}`);
  }
}

// ============= Batch Operations =============

/**
 * Get all lyric versions for multiple tracks (batch operation)
 *
 * @param trackIds - Array of track IDs
 * @returns Promise with map of track ID to lyric versions
 * @throws Error if database query fails
 *
 * @example
 * const versions = await getLyricVersionsBatch(['track-1', 'track-2']);
 * console.log(versions['track-1']);
 */
export async function getLyricVersionsBatch(
  trackIds: string[]
): Promise<Record<string, LyricVersionWithAuthor[]>> {
  if (trackIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from('lyrics_versions')
    .select(`
      *,
      profiles!lyrics_versions_user_id_fkey (
        id,
        username
      )
    `)
    .in('project_track_id', trackIds)
    .order('version_number', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch lyric versions batch: ${error.message}`);
  }

  // Group by track ID
  const grouped: Record<string, LyricVersionWithAuthor[]> = {};
  for (const version of data || []) {
    const trackId = (version as any).project_track_id;
    if (!grouped[trackId]) {
      grouped[trackId] = [];
    }
    grouped[trackId].push({
      id: version.id,
      versionNumber: version.version_number,
      content: version.lyrics,
      author: {
        id: (version as any).profiles.id,
        username: (version as any).profiles.username,
      },
      createdAt: version.created_at,
      isCurrent: version.is_current ?? false,
      changeSummary: version.change_description,
      versionName: version.version_name,
      changeType: version.change_type,
      sectionsData: version.sections_data,
      tags: version.tags,
      aiModelUsed: version.ai_model_used,
      aiPromptUsed: version.ai_prompt_used,
    });
  }

  return grouped;
}
