/**
 * Lyrics Types
 * Type definitions for lyrics service modules
 *
 * This file contains all shared type definitions used across
 * the lyrics service modules to avoid circular dependencies.
 */

import * as lyricsApi from "@/api/lyrics.api";

// ============================================================================
// LYRICS VERSION TYPES
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
    type: "addition" | "deletion" | "modification";
    content: string;
    position: number;
  }>;
  similarityScore: number; // 0-1
}

// ============================================================================
// SECTION NOTES TYPES
// ============================================================================

/**
 * Enriched section note with computed properties
 */
export interface EnrichedSectionNote extends lyricsApi.SectionNoteWithAuthor {
  age: number; // minutes since creation
  isEditable: boolean;
}

/**
 * Batch operation result for section notes
 */
export interface SectionNotesBatchOperation {
  trackId: string;
  notes: Array<{
    sectionStartIndex: number;
    sectionEndIndex: number;
    content: string;
  }>;
}

// ============================================================================
// FORMATTING TYPES
// ============================================================================

/**
 * Lyrics section structure
 */
export interface LyricsSection {
  type: "verse" | "chorus" | "bridge" | "pre-chorus" | "outro" | "intro" | "other";
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
 * Lyrics statistics
 */
export interface LyricsStatistics {
  wordCount: number;
  lineCount: number;
  characterCount: number;
  estimatedDuration: number; // in seconds
  hasStructuredSections: boolean;
  sectionsCount: number;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Save lyrics request with validation
 */
export interface SaveLyricsRequest {
  trackId: string;
  content: string;
  authorId: string;
  metadata?: Record<string, any>;
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
