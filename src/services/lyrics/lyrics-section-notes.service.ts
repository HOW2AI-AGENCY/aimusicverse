/**
 * Lyrics Section Notes Service
 * Operations for managing section notes and annotations
 *
 * This module handles:
 * - Adding section notes to lyrics
 * - Editing existing section notes
 * - Deleting section notes
 * - Retrieving enriched section notes with computed properties
 * - Batch operations on section notes
 *
 * @see src/api/lyrics.api.ts for database operations
 * @see src/services/lyrics/lyrics-validation.service.ts for validation utilities
 * @see src/services/lyrics/lyrics-types.ts for type definitions
 */

import * as lyricsApi from '@/api/lyrics.api';
import { logger } from '@/lib/logger';
import type {
  EnrichedSectionNote,
  SectionNotesBatchOperation
} from './lyrics-types';
import { validateSectionNoteContent } from './lyrics-validation.service';

// ============================================================================
// SECTION NOTES CONFIGURATION
// ============================================================================

const SECTION_NOTES_CONFIG = {
  EDIT_TIME_LIMIT_MINUTES: 30,
  MAX_NOTES_PER_SECTION: 10,
  MAX_NOTES_PER_TRACK: 100,
} as const;

// ============================================================================
// CORE SECTION NOTES OPERATIONS
// ============================================================================

/**
 * Adds a section note to lyrics
 *
 * Creates a new annotation for a specific section of lyrics,
 * enabling collaboration and feedback on specific parts.
 *
 * @param trackId - The ID of the track
 * @param sectionStartIndex - Starting character index of the section
 * @param sectionEndIndex - Ending character index of the section
 * @param content - The note content
 * @param authorId - The ID of the user creating the note
 * @returns The newly created section note
 */
export async function addSectionNote(
  trackId: string,
  sectionStartIndex: number,
  sectionEndIndex: number,
  content: string,
  authorId: string
): Promise<EnrichedSectionNote> {
  logger.info('Adding section note', {
    trackId,
    sectionStartIndex,
    sectionEndIndex,
    authorId,
    contentLength: content.length
  });

  // Validate section bounds
  if (sectionStartIndex < 0 || sectionEndIndex < sectionStartIndex) {
    throw new Error('Invalid section bounds');
  }

  // Validate content
  const validation = validateSectionNoteContent(content);
  if (!validation.isValid) {
    throw new Error(`Invalid section note content: ${validation.errors.join(', ')}`);
  }

  // Check limits
  const existingNotes = await lyricsApi.getSectionNotes(trackId);
  if (existingNotes.length >= SECTION_NOTES_CONFIG.MAX_NOTES_PER_TRACK) {
    throw new Error(`Maximum notes limit reached (${SECTION_NOTES_CONFIG.MAX_NOTES_PER_TRACK})`);
  }

  // Check notes in this section
  const notesInSection = existingNotes.filter(
    note => note.section_start_index === sectionStartIndex && note.section_end_index === sectionEndIndex
  );

  if (notesInSection.length >= SECTION_NOTES_CONFIG.MAX_NOTES_PER_SECTION) {
    throw new Error(`Maximum notes for this section reached (${SECTION_NOTES_CONFIG.MAX_NOTES_PER_SECTION})`);
  }

  // Create the note
  const noteData: lyricsApi.CreateSectionNoteParams = {
    track_id: trackId,
    section_start_index: sectionStartIndex,
    section_end_index: sectionEndIndex,
    content,
    author_id: authorId,
  };

  const result = await lyricsApi.createSectionNote(noteData);

  // Enrich with computed properties
  const enrichedNote = enrichSectionNote(result);

  logger.info('Section note added successfully', {
    trackId,
    noteId: result.id,
    sectionStartIndex,
    sectionEndIndex
  });

  return enrichedNote;
}

/**
 * Edits an existing section note
 *
 * Updates the content of a section note if the user is the author
 * and within the editable time limit.
 *
 * @param noteId - The ID of the note to edit
 * @param newContent - The new content for the note
 * @param authorId - The ID of the user attempting to edit
 * @returns The updated section note
 */
export async function editSectionNote(
  noteId: string,
  newContent: string,
  authorId: string
): Promise<EnrichedSectionNote> {
  logger.info('Editing section note', {
    noteId,
    authorId,
    newContentLength: newContent.length
  });

  // Get existing note
  const existingNotes = await lyricsApi.getSectionNoteById(noteId);
  if (!existingNotes) {
    throw new Error(`Section note ${noteId} not found`);
  }

  // Check ownership
  if (existingNotes.author_id !== authorId) {
    throw new Error('You can only edit your own notes');
  }

  // Check time limit
  const noteAge = Date.now() - new Date(existingNotes.created_at).getTime();
  const ageInMinutes = noteAge / (1000 * 60);

  if (ageInMinutes > SECTION_NOTES_CONFIG.EDIT_TIME_LIMIT_MINUTES) {
    throw new Error(`Cannot edit notes older than ${SECTION_NOTES_CONFIG.EDIT_TIME_LIMIT_MINUTES} minutes`);
  }

  // Validate new content
  const validation = validateSectionNoteContent(newContent);
  if (!validation.isValid) {
    throw new Error(`Invalid section note content: ${validation.errors.join(', ')}`);
  }

  // Update the note
  const updateData: lyricsApi.UpdateSectionNoteParams = {
    content: newContent,
    updated_at: new Date().toISOString(),
  };

  const result = await lyricsApi.updateSectionNote(noteId, updateData);
  const enrichedNote = enrichSectionNote(result);

  logger.info('Section note edited successfully', {
    noteId,
    age: Math.round(ageInMinutes)
  });

  return enrichedNote;
}

/**
 * Deletes a section note
 *
 * Permanently removes a section note. Only the note author can delete it.
 *
 * @param noteId - The ID of the note to delete
 * @param authorId - The ID of the user attempting to delete
 * @throws Error if note not found or user doesn't have permission
 */
export async function deleteSectionNote(noteId: string, authorId: string): Promise<void> {
  logger.info('Deleting section note', { noteId, authorId });

  // Get existing note
  const existingNote = await lyricsApi.getSectionNoteById(noteId);
  if (!existingNote) {
    throw new Error(`Section note ${noteId} not found`);
  }

  // Check ownership (optional - you might want admins to delete too)
  if (existingNote.author_id !== authorId) {
    throw new Error('You can only delete your own notes');
  }

  // Delete the note
  await lyricsApi.deleteSectionNote(noteId);

  logger.info('Section note deleted successfully', { noteId });
}

/**
 * Gets enriched section notes for a track
 *
 * Retrieves all section notes for a track with computed properties
 * like age and editability.
 *
 * @param trackId - The ID of the track
 * @param options - Optional filtering and sorting options
 * @returns Array of enriched section notes
 */
export async function getSectionNotesEnriched(
  trackId: string,
  options?: {
    sortBy?: 'created_at' | 'updated_at' | 'section_start';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
  }
): Promise<EnrichedSectionNote[]> {
  logger.info('Fetching enriched section notes', { trackId, options });

  try {
    const notes = await lyricsApi.getSectionNotes(trackId, {
      limit: options?.limit || 100,
    });

    // Enrich all notes
    const enrichedNotes = notes.map(note => enrichSectionNote(note));

    // Sort if requested
    if (options?.sortBy) {
      enrichedNotes.sort((a, b) => {
        const aValue = a[options.sortBy!];
        const bValue = b[options.sortBy!];

        if (options.sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });
    }

    logger.info('Section notes retrieved successfully', {
      trackId,
      noteCount: enrichedNotes.length
    });

    return enrichedNotes;
  } catch (error) {
    logger.error('Failed to fetch section notes', { trackId, error });
    throw new Error(`Failed to fetch section notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch adds section notes for multiple sections
 *
 * @param operations - Array of section note batch operations
 * @returns Results array indicating success/failure for each operation
 */
export async function batchAddSectionNotes(
  operations: SectionNotesBatchOperation[]
): Promise<Array<{ trackId: string; success: boolean; error?: string }>> {
  logger.info('Batch adding section notes', { operationCount: operations.length });

  const results = await Promise.allSettled(
    operations.map(async (operation) => {
      const { trackId, notes } = operation;

      // Process each note in the operation
      const noteResults = await Promise.allSettled(
        notes.map(note =>
          addSectionNote(
            trackId,
            note.sectionStartIndex,
            note.sectionEndIndex,
            note.content,
            'system' // Could be parameterized
          )
        )
      );

      // Check if all notes were added successfully
      const allSuccessful = noteResults.every(result => result.status === 'fulfilled');

      return {
        trackId,
        success: allSuccessful,
        error: allSuccessful ? undefined : 'Some notes failed to add'
      };
    })
  );

  const formattedResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        trackId: operations[index].trackId,
        success: false,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
      };
    }
  });

  logger.info('Batch section notes completed', {
    totalOperations: operations.length,
    successful: formattedResults.filter(r => r.success).length,
    failed: formattedResults.filter(r => !r.success).length
  });

  return formattedResults;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Enriches a section note with computed properties
 */
function enrichSectionNote(note: lyricsApi.SectionNoteWithAuthor): EnrichedSectionNote {
  const now = Date.now();
  const createdAt = new Date(note.created_at).getTime();
  const ageInMinutes = Math.floor((now - createdAt) / (1000 * 60));

  // Check if note is editable (within time limit and authored by user)
  const isEditable = ageInMinutes < SECTION_NOTES_CONFIG.EDIT_TIME_LIMIT_MINUTES;

  return {
    ...note,
    age: ageInMinutes,
    isEditable
  };
}

/**
 * Gets section notes for a specific section range
 *
 * @param trackId - The ID of the track
 * @param startIndex - Starting index of the section
 * @param endIndex - Ending index of the section
 * @returns Array of section notes in the specified range
 */
export async function getSectionNotesForRange(
  trackId: string,
  startIndex: number,
  endIndex: number
): Promise<EnrichedSectionNote[]> {
  logger.info('Fetching section notes for range', {
    trackId,
    startIndex,
    endIndex
  });

  try {
    const allNotes = await lyricsApi.getSectionNotes(trackId);

    // Filter notes within range
    const rangeNotes = allNotes.filter(
      note =>
        note.section_start_index >= startIndex &&
        note.section_end_index <= endIndex
    );

    // Enrich filtered notes
    const enrichedNotes = rangeNotes.map(note => enrichSectionNote(note));

    logger.info('Section notes for range retrieved', {
      trackId,
      rangeNotesCount: enrichedNotes.length,
      totalNotesCount: allNotes.length
    });

    return enrichedNotes;
  } catch (error) {
    logger.error('Failed to fetch section notes for range', {
      trackId,
      startIndex,
      endIndex,
      error
    });
    throw new Error(`Failed to fetch section notes for range: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}