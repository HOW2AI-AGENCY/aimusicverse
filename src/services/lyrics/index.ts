/**
 * Lyrics Service - Main Entry Point
 *
 * This file provides backward compatibility by re-exporting all functions
 * from the modularized lyrics service components.
 *
 * Architecture:
 * - lyrics-types.ts - Shared type definitions
 * - lyrics-validation.service.ts - Validation utilities
 * - lyrics-versioning.service.ts - Versioning operations
 * - lyrics-section-notes.service.ts - Section notes operations
 * - lyrics-formatting.service.ts - Formatting and display utilities
 *
 * Migration Guide:
 * Old: import { saveLyricsWithVersioning } from '@/services/lyrics.service'
 * New: import { saveLyricsWithVersioning } from '@/services/lyrics'
 *
 * @deprecated This file provides backward compatibility.
 * New code should import directly from specific modules.
 */

// ============================================================================
// TYPE EXPORTS
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
  ValidationResult,
  ContentQualityMetrics,
  LyricsStatistics
} from './lyrics-types';

// ============================================================================
// VALIDATION EXPORTS
// ============================================================================

export {
  validateLyricsContent,
  validateSectionNoteContent,
  validateSaveLyricsRequest,
  analyzeContentQuality,
  getLyricsStatistics,
  hasStructuredSections
} from './lyrics-validation.service';

export type {
  ValidationResult,
  ContentQualityMetrics
} from './lyrics-validation.service';

// ============================================================================
// VERSIONING EXPORTS
// ============================================================================

export {
  saveLyricsWithVersioning,
  getLyricsHistory,
  restoreLyricsVersion,
  compareLyricVersions,
  batchSaveLyrics,
  batchGetLyricsHistory
} from './lyrics-versioning.service';

// ============================================================================
// SECTION NOTES EXPORTS
// ============================================================================

export {
  addSectionNote,
  editSectionNote,
  deleteSectionNote,
  getSectionNotesEnriched,
  batchAddSectionNotes,
  getSectionNotesForRange
} from './lyrics-section-notes.service';

// ============================================================================
// FORMATTING EXPORTS
// ============================================================================

export {
  formatLyricsForDisplay,
  extractLyricsSections,
  getLyricsStatistics as getLyricsStats,
  hasStructuredSections as hasStructure,
  formatLyricsForKaraoke,
  formatLyricsForExport,
  compressLyrics,
  expandLyrics,
  generateLyricsStructureSummary
} from './lyrics-formatting.service';

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * @deprecated Use getLyricsStatistics from lyrics-validation.service instead
 */
export const computeLyricsStats = getLyricsStatistics;

/**
 * @deprecated Use formatLyricsForDisplay from lyrics-formatting.service instead
 */
export const formatLyrics = formatLyricsForDisplay;

/**
 * @deprecated Use extractLyricsSections from lyrics-formatting.service instead
 */
export const parseLyricsStructure = extractLyricsSections;