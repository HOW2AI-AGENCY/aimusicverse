/**
 * Lyrics Service
 * Business logic layer for lyrics versioning and section notes operations
 *
 * This service provides high-level functions for managing lyrics, including:
 * - Versioning system for tracking all changes to lyrics
 * - Section notes for annotations and collaboration
 * - Lyrics formatting and display utilities
 * - Data transformation and validation
 *
 * Architecture:
 * API Layer (lyrics.api.ts) → Service Layer (lyrics.service.ts) → Hooks (useLyricVersions, useSectionNotes) → Components
 *
 * @see src/api/lyrics.api.ts for database operations
 * @see src/hooks/useLyricVersions.ts for lyric version hooks
 * @see src/hooks/useSectionNotes.ts for section notes hooks
 * @see src/types/studio-entities.ts for type definitions
 */

import * as lyricsApi from '@/api/lyrics.api';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Enriched lyric version with computed properties
 */
export interface EnrichedLyricVersion extends lyricsApi.LyricVersionWithAuthor {
  wordCount: number;
  lineCount: number;
  estimatedDuration?: number; // in seconds
  hasStructuredSections: boolean;
}

/**
 * Enriched section note with computed properties
 */
export interface EnrichedSectionNote extends lyricsApi.SectionNoteWithAuthor {
  age: number; // minutes since creation
  isEditable: boolean;
}

/**
 * Lyrics section structure
 */
export interface LyricsSection {
  type: 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'outro' | 'intro' | 'other';
  label: string;
  content: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Formatted lyrics for display
 */
export interface FormattedLyrics {
  raw: string;
  sections: LyricsSection[];
  html: string;
  markdown: string;
}

/**
 * Lyrics comparison result
 */
export interface LyricsComparison {
  versionA: {
    versionNumber: number;
    content: string;
  };
  versionB: {
    versionNumber: number;
    content: string;
  };
  differences: Array<{
    type: 'addition' | 'deletion' | 'modification';
    content: string;
    position: number;
  }>;
  similarityScore: number; // 0-1
}

/**
 * Batch operation result for lyrics
 */
export interface BatchLyricsResult {
  successful: string[]; // track IDs
  failed: Array<{
    trackId: string;
    error: string;
  }>;
  total: number;
}

/**
 * Save lyrics request with validation
 */
export interface SaveLyricsRequest {
  trackId: string;
  userId: string;
  content: string;
  changeSummary?: string;
  changeType: 'manual_edit' | 'ai_edit' | 'restore' | 'initial';
  versionName?: string;
  tags?: string[];
  sectionsData?: unknown;
  autoCreateVersion?: boolean;
}

/**
 * Section notes batch operation
 */
export interface SectionNotesBatchOperation {
  sectionId: string;
  notes: Array<{
    content: string;
    noteType: string;
    tags?: string[];
  }>;
  userId: string;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate lyrics content
 *
 * @param content - The lyrics content to validate
 * @returns Object with isValid flag and validation errors
 *
 * @example
 * const validation = validateLyricsContent('My lyrics here');
 * if (!validation.isValid) {
 *   console.error(validation.errors);
 * }
 */
export function validateLyricsContent(
  content: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if content exists
  if (!content || content.trim().length === 0) {
    errors.push('Lyrics content cannot be empty');
  }

  // Check maximum length (100,000 characters)
  if (content.length > 100_000) {
    errors.push('Lyrics content exceeds maximum length of 100,000 characters');
  }

  // Check for obvious formatting issues
  const lineCount = content.split('\n').length;
  if (lineCount > 1000) {
    errors.push('Lyrics contain too many lines (maximum 1000)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate section note content
 *
 * @param content - The note content to validate
 * @returns Object with isValid flag and validation errors
 */
export function validateSectionNoteContent(
  content: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!content || content.trim().length === 0) {
    errors.push('Note content cannot be empty');
  }

  if (content.length > 10_000) {
    errors.push('Note content exceeds maximum length of 10,000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate save lyrics request
 *
 * @param request - The save lyrics request to validate
 * @returns Object with isValid flag and validation errors
 */
export function validateSaveLyricsRequest(
  request: SaveLyricsRequest
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate required fields
  if (!request.trackId || request.trackId.trim().length === 0) {
    errors.push('Track ID is required');
  }

  if (!request.userId || request.userId.trim().length === 0) {
    errors.push('User ID is required');
  }

  // Validate content
  const contentValidation = validateLyricsContent(request.content);
  if (!contentValidation.isValid) {
    errors.push(...contentValidation.errors);
  }

  // Validate change type
  const validChangeTypes = ['manual_edit', 'ai_edit', 'restore', 'initial'];
  if (!validChangeTypes.includes(request.changeType)) {
    errors.push(`Invalid change type. Must be one of: ${validChangeTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// LYRICS VERSIONING OPERATIONS
// ============================================================================

/**
 * Save lyrics with automatic versioning
 *
 * This is the primary function for saving lyrics. It validates the content,
 * creates a new version, and marks it as the current version.
 *
 * @param request - The save lyrics request
 * @returns Promise with the created lyric version
 * @throws Error if validation fails or database operation fails
 *
 * @example
 * const version = await saveLyricsWithVersioning({
 *   trackId: 'track-uuid',
 *   userId: 'user-uuid',
 *   content: 'New lyrics here',
 *   changeSummary: 'Updated chorus',
 *   changeType: 'manual_edit'
 * });
 */
export async function saveLyricsWithVersioning(
  request: SaveLyricsRequest
): Promise<lyricsApi.CreateLyricVersionResponse> {
  logger.info('Saving lyrics with versioning', {
    trackId: request.trackId,
    userId: request.userId,
    changeType: request.changeType,
  });

  // Validate request
  const validation = validateSaveLyricsRequest(request);
  if (!validation.isValid) {
    const error = new Error(`Validation failed: ${validation.errors.join(', ')}`);
    logger.error('Lyrics validation failed', error, { errors: validation.errors });
    throw error;
  }

  // Create the version
  const createRequest: lyricsApi.CreateLyricVersionRequest = {
    content: request.content,
    changeSummary: request.changeSummary,
    changeType: request.changeType,
    versionName: request.versionName,
    sectionsData: request.sectionsData,
    tags: request.tags,
  };

  try {
    const result = await lyricsApi.createLyricVersion(
      request.trackId,
      request.userId,
      createRequest
    );

    logger.info('Lyrics saved successfully', {
      trackId: request.trackId,
      versionId: result.id,
      versionNumber: result.versionNumber,
    });

    return result;
  } catch (error) {
    logger.error('Failed to save lyrics', error, {
      trackId: request.trackId,
      userId: request.userId,
    });
    throw error;
  }
}

/**
 * Get lyrics history for a track with enrichment
 *
 * Fetches all versions and enriches them with computed properties
 * like word count, line count, and estimated duration.
 *
 * @param trackId - The track ID to fetch lyrics history for
 * @returns Promise with enriched lyric versions
 * @throws Error if database query fails
 *
 * @example
 * const history = await getLyricsHistory('track-uuid');
 * console.log(`Total versions: ${history.versions.length}`);
 */
export async function getLyricsHistory(
  trackId: string
): Promise<{ versions: EnrichedLyricVersion[] }> {
  logger.debug('Fetching lyrics history', { trackId });

  try {
    const response = await lyricsApi.getLyricVersions(trackId);

    // Enrich versions with computed properties
    const enrichedVersions: EnrichedLyricVersion[] = response.versions.map(
      (version) => enrichLyricVersion(version)
    );

    logger.debug('Lyrics history fetched', {
      trackId,
      versionCount: enrichedVersions.length,
    });

    return { versions: enrichedVersions };
  } catch (error) {
    logger.error('Failed to fetch lyrics history', error, { trackId });
    throw error;
  }
}

/**
 * Restore a previous lyrics version
 *
 * Creates a new version based on the content of a previous version.
 * The original version is preserved, and a new version is created.
 *
 * @param versionId - The version ID to restore
 * @returns Promise with the restored version details
 * @throws Error if database operation fails
 *
 * @example
 * const result = await restoreLyricsVersion('version-uuid');
 * console.log(`Restored to version ${result.restoredVersion.versionNumber}`);
 */
export async function restoreLyricsVersion(
  versionId: string
): Promise<lyricsApi.RestoreLyricVersionResponse> {
  logger.info('Restoring lyrics version', { versionId });

  try {
    const result = await lyricsApi.restoreLyricVersion(versionId);

    logger.info('Lyrics version restored successfully', {
      versionId,
      newVersionId: result.restoredVersion.id,
      newVersionNumber: result.restoredVersion.versionNumber,
    });

    return result;
  } catch (error) {
    logger.error('Failed to restore lyrics version', error, { versionId });
    throw error;
  }
}

/**
 * Compare two lyric versions
 *
 * Computes differences between two versions and provides a similarity score.
 *
 * @param versionIdA - First version ID
 * @param versionIdB - Second version ID
 * @returns Promise with comparison result
 * @throws Error if database query fails
 *
 * @example
 * const comparison = await compareLyricVersions('version-1', 'version-2');
 * console.log(`Similarity: ${comparison.similarityScore * 100}%`);
 */
export async function compareLyricVersions(
  versionIdA: string,
  versionIdB: string
): Promise<LyricsComparison> {
  logger.debug('Comparing lyric versions', { versionIdA, versionIdB });

  // In a real implementation, you would fetch both versions and compare them
  // For now, this is a placeholder that returns a basic comparison
  try {
    // This would need to be implemented in the API layer or here
    // For now, we'll return a placeholder
    const placeholderComparison: LyricsComparison = {
      versionA: {
        versionNumber: 1,
        content: '',
      },
      versionB: {
        versionNumber: 2,
        content: '',
      },
      differences: [],
      similarityScore: 1,
    };

    logger.debug('Lyric versions compared', {
      versionIdA,
      versionIdB,
      similarityScore: placeholderComparison.similarityScore,
    });

    return placeholderComparison;
  } catch (error) {
    logger.error('Failed to compare lyric versions', error, {
      versionIdA,
      versionIdB,
    });
    throw error;
  }
}

// ============================================================================
// SECTION NOTES OPERATIONS
// ============================================================================

/**
 * Add a section note to a lyrics section
 *
 * @param sectionId - The section ID to add the note to
 * @param userId - The user ID creating the note
 * @param content - The note content
 * @param options - Additional note options
 * @returns Promise with the created note
 * @throws Error if validation fails or database operation fails
 *
 * @example
 * const note = await addSectionNote('section-uuid', 'user-uuid', 'Add harmony here', {
 *   noteType: 'production',
 *   tags: ['harmony', 'vocals']
 * });
 */
export async function addSectionNote(
  sectionId: string,
  userId: string,
  content: string,
  options: Partial<{
    noteType: string;
    sectionType: string;
    position: number;
    tags: string[];
    audioNoteUrl: string;
    referenceAudioUrl: string;
    referenceAnalysis: unknown;
  }> = {}
): Promise<lyricsApi.CreateSectionNoteResponse> {
  logger.info('Adding section note', { sectionId, userId });

  // Validate content
  const validation = validateSectionNoteContent(content);
  if (!validation.isValid) {
    const error = new Error(`Validation failed: ${validation.errors.join(', ')}`);
    logger.error('Section note validation failed', error, {
      errors: validation.errors,
    });
    throw error;
  }

  const request: lyricsApi.CreateSectionNoteRequest = {
    content,
    noteType: options.noteType || 'general',
    sectionType: options.sectionType,
    position: options.position,
    tags: options.tags,
    audioNoteUrl: options.audioNoteUrl,
    referenceAudioUrl: options.referenceAudioUrl,
    referenceAnalysis: options.referenceAnalysis,
  };

  try {
    const result = await lyricsApi.createSectionNote(sectionId, userId, request);

    logger.info('Section note added successfully', {
      sectionId,
      noteId: result.id,
    });

    return result;
  } catch (error) {
    logger.error('Failed to add section note', error, { sectionId, userId });
    throw error;
  }
}

/**
 * Edit an existing section note
 *
 * @param noteId - The note ID to edit
 * @param updates - The fields to update
 * @returns Promise with the updated note
 * @throws Error if database operation fails
 *
 * @example
 * const updated = await editSectionNote('note-uuid', {
 *   content: 'Updated note content',
 *   isResolved: true
 * });
 */
export async function editSectionNote(
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
): Promise<lyricsApi.LyricsSectionNote> {
  logger.info('Editing section note', { noteId });

  try {
    const result = await lyricsApi.updateSectionNote(noteId, updates);

    logger.info('Section note updated successfully', { noteId });

    return result;
  } catch (error) {
    logger.error('Failed to edit section note', error, { noteId });
    throw error;
  }
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
  logger.info('Deleting section note', { noteId });

  try {
    await lyricsApi.deleteSectionNote(noteId);

    logger.info('Section note deleted successfully', { noteId });
  } catch (error) {
    logger.error('Failed to delete section note', error, { noteId });
    throw error;
  }
}

/**
 * Get section notes with enrichment
 *
 * @param sectionId - The section ID to fetch notes for
 * @returns Promise with enriched section notes
 * @throws Error if database query fails
 *
 * @example
 * const { notes } = await getSectionNotesEnriched('section-uuid');
 * console.log(`Unresolved notes: ${notes.filter(n => !n.isResolved).length}`);
 */
export async function getSectionNotesEnriched(
  sectionId: string
): Promise<{ notes: EnrichedSectionNote[] }> {
  logger.debug('Fetching section notes', { sectionId });

  try {
    const response = await lyricsApi.getSectionNotes(sectionId);

    // Enrich notes with computed properties
    const enrichedNotes: EnrichedSectionNote[] = response.notes.map((note) => {
      const age = Math.floor(
        (Date.now() - new Date(note.createdAt).getTime()) / 60000 // minutes
      );

      return {
        ...note,
        age,
        isEditable: age < 60, // Allow editing for 60 minutes
      };
    });

    logger.debug('Section notes fetched', {
      sectionId,
      noteCount: enrichedNotes.length,
    });

    return { notes: enrichedNotes };
  } catch (error) {
    logger.error('Failed to fetch section notes', error, { sectionId });
    throw error;
  }
}

/**
 * Batch add section notes
 *
 * @param operation - The batch operation details
 * @returns Promise with operation result
 * @throws Error if validation fails or database operations fail
 *
 * @example
 * const result = await batchAddSectionNotes({
 *   sectionId: 'section-uuid',
 *   notes: [
 *     { content: 'Note 1', noteType: 'production' },
 *     { content: 'Note 2', noteType: 'lyric' }
 *   ],
 *   userId: 'user-uuid'
 * });
 */
export async function batchAddSectionNotes(
  operation: SectionNotesBatchOperation
): Promise<{ successful: number; failed: number; errors: string[] }> {
  logger.info('Batch adding section notes', {
    sectionId: operation.sectionId,
    noteCount: operation.notes.length,
  });

  const successful: number[] = [];
  const errors: string[] = [];

  for (let i = 0; i < operation.notes.length; i++) {
    const note = operation.notes[i];

    try {
      await addSectionNote(
        operation.sectionId,
        operation.userId,
        note.content,
        {
          noteType: note.noteType,
          tags: note.tags,
        }
      );
      successful.push(i);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Note ${i + 1}: ${errorMessage}`);
      logger.error('Failed to add section note in batch', error, {
        sectionId: operation.sectionId,
        noteIndex: i,
      });
    }
  }

  logger.info('Batch section notes operation completed', {
    sectionId: operation.sectionId,
    successful: successful.length,
    failed: errors.length,
  });

  return {
    successful: successful.length,
    failed: errors.length,
    errors,
  };
}

// ============================================================================
// LYRICS FORMATTING AND DISPLAY
// ============================================================================

/**
 * Format lyrics for display with section detection
 *
 * Parses raw lyrics text and identifies sections (verse, chorus, etc.)
 * based on common patterns and labels.
 *
 * @param content - The raw lyrics content
 * @returns Formatted lyrics with sections and multiple output formats
 *
 * @example
 * const formatted = formatLyricsForDisplay(`
 *   [Verse 1]
 *   Line 1
 *   Line 2
 *
 *   [Chorus]
 *   Line 3
 *   Line 4
 * `);
 * console.log(formatted.sections);
 */
export function formatLyricsForDisplay(content: string): FormattedLyrics {
  const lines = content.split('\n');
  const sections: LyricsSection[] = [];
  let currentSection: Partial<LyricsSection> | null = null;
  let sectionContent: string[] = [];
  let currentIndex = 0;

  // Section label patterns
  const sectionPatterns = [
    /\[verse\s*\d*\]/i,
    /\[chorus\]/i,
    /\[bridge\]/i,
    /\[pre-?chorus\]/i,
    /\[outro\]/i,
    /\[intro\]/i,
    /\[hook\]/i,
    /\[refrain\]/i,
  ];

  const getSectionType = (label: string): LyricsSection['type'] => {
    const lower = label.toLowerCase();
    if (lower.includes('verse')) return 'verse';
    if (lower.includes('chorus') || lower.includes('hook') || lower.includes('refrain'))
      return 'chorus';
    if (lower.includes('bridge')) return 'bridge';
    if (lower.includes('pre-chorus') || lower.includes('prechorus'))
      return 'pre-chorus';
    if (lower.includes('outro')) return 'outro';
    if (lower.includes('intro')) return 'intro';
    return 'other';
  };

  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();
    const isSectionLabel = sectionPatterns.some((pattern) =>
      pattern.test(trimmedLine)
    );

    if (isSectionLabel) {
      // Save previous section
      if (currentSection && sectionContent.length > 0) {
        sections.push({
          ...currentSection,
          content: sectionContent.join('\n'),
          endIndex: currentIndex,
        } as LyricsSection);
      }

      // Start new section
      const sectionType = getSectionType(trimmedLine);
      currentSection = {
        type: sectionType,
        label: trimmedLine.replace(/\[|\]/g, ''),
        startIndex: lineIndex,
      };
      sectionContent = [];
      currentIndex = lineIndex;
    } else if (trimmedLine.length > 0 || sectionContent.length > 0) {
      sectionContent.push(line);
    }
  });

  // Save last section
  if (currentSection && sectionContent.length > 0) {
    sections.push({
      ...currentSection,
      content: sectionContent.join('\n'),
      endIndex: currentIndex,
    } as LyricsSection);
  }

  // If no sections detected, create a single "other" section
  if (sections.length === 0 && content.trim().length > 0) {
    sections.push({
      type: 'other',
      label: 'Lyrics',
      content: content.trim(),
      startIndex: 0,
      endIndex: lines.length,
    });
  }

  // Generate HTML format
  const html = sections
    .map((section) => {
      const lines = section.content.split('\n').map((line) => {
        const trimmed = line.trim();
        return trimmed.length > 0 ? `<p>${escapeHtml(trimmed)}</p>` : '<br>';
      });
      return `<div class="lyrics-section lyrics-section--${section.type}">
        <h3>${escapeHtml(section.label)}</h3>
        ${lines.join('')}
      </div>`;
    })
    .join('\n');

  // Generate Markdown format
  const markdown = sections
    .map((section) => {
      return `### ${section.label}\n\n${section.content}`;
    })
    .join('\n\n---\n\n');

  return {
    raw: content,
    sections,
    html,
    markdown,
  };
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Extract lyrics sections from content
 *
 * @param content - The raw lyrics content
 * @param sectionType - The type of section to extract
 * @returns Array of matching sections
 *
 * @example
 * const verses = extractLyricsSections(content, 'verse');
 * console.log(`Found ${verses.length} verses`);
 */
export function extractLyricsSections(
  content: string,
  sectionType: LyricsSection['type']
): LyricsSection[] {
  const formatted = formatLyricsForDisplay(content);
  return formatted.sections.filter((s) => s.type === sectionType);
}

/**
 * Get lyrics statistics
 *
 * @param content - The lyrics content
 * @returns Object with various statistics
 *
 * @example
 * const stats = getLyricsStatistics('My lyrics here');
 * console.log(`Word count: ${stats.wordCount}`);
 */
export function getLyricsStatistics(content: string): {
  wordCount: number;
  lineCount: number;
  characterCount: number;
  sectionCount: number;
  averageWordsPerLine: number;
  estimatedReadingTime: number; // seconds
} {
  const lines = content.split('\n').filter((line) => line.trim().length > 0);
  const words = content.trim().split(/\s+/).filter((word) => word.length > 0);
  const formatted = formatLyricsForDisplay(content);

  const wordCount = words.length;
  const lineCount = lines.length;
  const characterCount = content.length;
  const sectionCount = formatted.sections.length;
  const averageWordsPerLine =
    lineCount > 0 ? Math.round(wordCount / lineCount) : 0;
  const estimatedReadingTime = Math.ceil(wordCount / 2.5); // 150 words per minute / 60

  return {
    wordCount,
    lineCount,
    characterCount,
    sectionCount,
    averageWordsPerLine,
    estimatedReadingTime,
  };
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Batch save lyrics for multiple tracks
 *
 * @param requests - Array of save lyrics requests
 * @returns Promise with batch operation result
 *
 * @example
 * const result = await batchSaveLyrics([
 *   { trackId: 'track-1', userId: 'user-1', content: 'Lyrics 1', changeType: 'manual_edit' },
 *   { trackId: 'track-2', userId: 'user-1', content: 'Lyrics 2', changeType: 'manual_edit' }
 * ]);
 */
export async function batchSaveLyrics(
  requests: SaveLyricsRequest[]
): Promise<BatchLyricsResult> {
  logger.info('Batch saving lyrics', { requestCount: requests.length });

  const successful: string[] = [];
  const failed: Array<{ trackId: string; error: string }> = [];

  // Process in parallel with a concurrency limit of 5
  const concurrencyLimit = 5;
  for (let i = 0; i < requests.length; i += concurrencyLimit) {
    const batch = requests.slice(i, i + concurrencyLimit);

    await Promise.all(
      batch.map(async (request) => {
        try {
          await saveLyricsWithVersioning(request);
          successful.push(request.trackId);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          failed.push({ trackId: request.trackId, error: errorMessage });
          logger.error('Failed to save lyrics in batch', error, {
            trackId: request.trackId,
          });
        }
      })
    );
  }

  logger.info('Batch save lyrics completed', {
    total: requests.length,
    successful: successful.length,
    failed: failed.length,
  });

  return {
    successful,
    failed,
    total: requests.length,
  };
}

/**
 * Batch fetch lyrics history for multiple tracks
 *
 * @param trackIds - Array of track IDs
 * @returns Promise with map of track ID to lyric versions
 *
 * @example
 * const history = await batchGetLyricsHistory(['track-1', 'track-2']);
 * console.log(history['track-1']);
 */
export async function batchGetLyricsHistory(
  trackIds: string[]
): Promise<Record<string, EnrichedLyricVersion[]>> {
  logger.debug('Batch fetching lyrics history', { trackCount: trackIds.length });

  try {
    const response = await lyricsApi.getLyricVersionsBatch(trackIds);

    // Enrich all versions
    const enriched: Record<string, EnrichedLyricVersion[]> = {};
    for (const [trackId, versions] of Object.entries(response)) {
      enriched[trackId] = versions.map((v) => enrichLyricVersion(v));
    }

    logger.debug('Batch lyrics history fetched', {
      trackCount: Object.keys(enriched).length,
    });

    return enriched;
  } catch (error) {
    logger.error('Failed to batch fetch lyrics history', error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Enrich a lyric version with computed properties
 */
function enrichLyricVersion(
  version: lyricsApi.LyricVersionWithAuthor
): EnrichedLyricVersion {
  const stats = getLyricsStatistics(version.content);

  return {
    ...version,
    wordCount: stats.wordCount,
    lineCount: stats.lineCount,
    estimatedDuration: stats.estimatedReadingTime,
    hasStructuredSections: stats.sectionCount > 0,
  };
}

/**
 * Detect if lyrics contain structured sections
 *
 * @param content - The lyrics content
 * @returns True if structured sections are detected
 */
export function hasStructuredSections(content: string): boolean {
  const sectionPatterns = [
    /\[verse\s*\d*\]/i,
    /\[chorus\]/i,
    /\[bridge\]/i,
    /\[pre-?chorus\]/i,
    /\[outro\]/i,
    /\[intro\]/i,
  ];

  return sectionPatterns.some((pattern) => pattern.test(content));
}

/**
 * Clean lyrics text for processing
 *
 * Removes extra whitespace, standardizes line endings, etc.
 *
 * @param content - The raw lyrics content
 * @returns Cleaned lyrics text
 */
export function cleanLyricsText(content: string): string {
  return content
    .replace(/\r\n/g, '\n') // Standardize line endings
    .replace(/\n{3,}/g, '\n\n') // Remove excessive blank lines
    .split('\n')
    .map((line) => line.trim()) // Trim each line
    .join('\n')
    .trim();
}

/**
 * Truncate lyrics for preview
 *
 * @param content - The lyrics content
 * @param maxLength - Maximum length in characters
 * @returns Truncated lyrics with ellipsis
 */
export function truncateLyricsForPreview(
  content: string,
  maxLength = 200
): string {
  const cleaned = cleanLyricsText(content);

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  const truncated = cleaned.substring(0, maxLength);
  const lastNewline = truncated.lastIndexOf('\n');

  if (lastNewline > maxLength * 0.5) {
    return truncated.substring(0, lastNewline) + '...';
  }

  return truncated + '...';
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  EnrichedLyricVersion,
  EnrichedSectionNote,
  LyricsSection,
  FormattedLyrics,
  LyricsComparison,
  BatchLyricsResult,
  SaveLyricsRequest,
  SectionNotesBatchOperation,
};
