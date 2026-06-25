/**
 * Lyrics Service - Main Entry Point
 *
 * This file provides backward compatibility by re-exporting all functions
 * from the modularized lyrics service components.
 *
 * Architecture:
 * - lyrics-types.ts - Shared type definitions
 * - lyrics-validation.service.ts - Validation utilities
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

// Import functions for deprecated re-exports
import { getLyricsStatistics as _getLyricsStatistics } from './lyrics-validation.service';
import {
  formatLyricsForDisplay as _formatLyricsForDisplay,
  extractLyricsSections as _extractLyricsSections,
} from './lyrics-formatting.service';

/**
 * @deprecated Use getLyricsStatistics from lyrics-validation.service instead
 */
export const computeLyricsStats = _getLyricsStatistics;

/**
 * @deprecated Use formatLyricsForDisplay from lyrics-formatting.service instead
 */
export const formatLyrics = _formatLyricsForDisplay;

/**
 * @deprecated Use extractLyricsSections from lyrics-formatting.service instead
 */
export const parseLyricsStructure = _extractLyricsSections;
