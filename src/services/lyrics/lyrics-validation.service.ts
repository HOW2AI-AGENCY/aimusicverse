/**
 * Lyrics Validation Service
 * Validation utilities for lyrics content and operations
 *
 * This module provides comprehensive validation for:
 * - Lyrics content quality and structure
 * - Section notes content
 * - Save lyrics requests
 * - Batch operations
 *
 * @see src/services/lyrics/lyrics-types.ts for type definitions
 */

import { logger } from "@/lib/logger";
import type { SaveLyricsRequest, LyricsStatistics } from "./lyrics-types";

// ============================================================================
// VALIDATION CONFIGURATION
// ============================================================================

const LYRICS_CONSTRAINTS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 10000,
  MIN_WORDS: 1,
  MAX_WORDS: 2000,
  MAX_LINE_LENGTH: 200,
  ALLOWED_SPECIAL_CHARS: /[^\p{L}\p{M}\p{N}\p{P}\p{Z}\n\r]/u,
} as const;

const SECTION_NOTE_CONSTRAINTS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 5000,
  MIN_WORDS: 1,
  MAX_WORDS: 1000,
} as const;

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ContentQualityMetrics {
  wordCount: number;
  lineCount: number;
  characterCount: number;
  hasStructure: boolean;
  averageLineLength: number;
  readabilityScore: number; // 0-100
}

// ============================================================================
// LYRICS CONTENT VALIDATION
// ============================================================================

/**
 * Validates lyrics content for quality and structure
 *
 * @param content - The lyrics content to validate
 * @returns ValidationResult with errors and warnings
 */
export function validateLyricsContent(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if content exists
  if (!content || content.trim().length === 0) {
    errors.push("Lyrics content cannot be empty");
    return { isValid: false, errors, warnings };
  }

  // Length validation
  if (content.length < LYRICS_CONSTRAINTS.MIN_LENGTH) {
    errors.push(`Lyrics content is too short (minimum ${LYRICS_CONSTRAINTS.MIN_LENGTH} characters)`);
  }

  if (content.length > LYRICS_CONSTRAINTS.MAX_LENGTH) {
    errors.push(`Lyrics content is too long (maximum ${LYRICS_CONSTRAINTS.MAX_LENGTH} characters)`);
  }

  // Word count validation
  const words = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const wordCount = words.length;

  if (wordCount < LYRICS_CONSTRAINTS.MIN_WORDS) {
    warnings.push(`Lyrics have very few words (${wordCount}), consider adding more content`);
  }

  if (wordCount > LYRICS_CONSTRAINTS.MAX_WORDS) {
    errors.push(`Lyrics have too many words (${wordCount} > ${LYRICS_CONSTRAINTS.MAX_WORDS})`);
  }

  // Line length validation
  const lines = content.split("\n");
  const longLines = lines.filter((line) => line.length > LYRICS_CONSTRAINTS.MAX_LINE_LENGTH);

  if (longLines.length > 0) {
    warnings.push(`Found ${longLines.length} lines longer than ${LYRICS_CONSTRAINTS.MAX_LINE_LENGTH} characters`);
  }

  // Check for suspicious patterns
  const hasRepetitiveContent = detectRepetitiveContent(content);
  if (hasRepetitiveContent) {
    warnings.push("Lyrics contain highly repetitive content, consider adding variety");
  }

  // Check for structure
  const hasStructure = detectLyricsStructure(content);
  if (!hasStructure) {
    warnings.push("Lyrics lack clear structure (verses, choruses, etc.)");
  }

  const isValid = errors.length === 0;

  if (!isValid) {
    logger.warn("Lyrics validation failed", { errors, wordCount, contentLength: content.length });
  }

  return { isValid, errors, warnings };
}

/**
 * Validates section note content
 *
 * @param content - The section note content to validate
 * @returns ValidationResult with errors and warnings
 */
export function validateSectionNoteContent(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if content exists
  if (!content || content.trim().length === 0) {
    errors.push("Section note content cannot be empty");
    return { isValid: false, errors, warnings };
  }

  // Length validation
  if (content.length < SECTION_NOTE_CONSTRAINTS.MIN_LENGTH) {
    errors.push(`Section note is too short (minimum ${SECTION_NOTE_CONSTRAINTS.MIN_LENGTH} characters)`);
  }

  if (content.length > SECTION_NOTE_CONSTRAINTS.MAX_LENGTH) {
    errors.push(`Section note is too long (maximum ${SECTION_NOTE_CONSTRAINTS.MAX_LENGTH} characters)`);
  }

  // Word count validation
  const words = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const wordCount = words.length;

  if (wordCount > SECTION_NOTE_CONSTRAINTS.MAX_WORDS) {
    warnings.push(`Section note has many words (${wordCount}), consider being concise`);
  }

  const isValid = errors.length === 0;

  if (!isValid) {
    logger.warn("Section note validation failed", { errors, wordCount });
  }

  return { isValid, errors, warnings };
}

/**
 * Validates complete save lyrics request
 *
 * @param request - The save lyrics request to validate
 * @returns ValidationResult with errors and warnings
 */
export function validateSaveLyricsRequest(request: SaveLyricsRequest): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!request.trackId || request.trackId.trim().length === 0) {
    errors.push("Track ID is required");
  }

  if (!request.authorId || request.authorId.trim().length === 0) {
    errors.push("Author ID is required");
  }

  if (!request.content) {
    errors.push("Lyrics content is required");
    return { isValid: false, errors, warnings };
  }

  // Validate content
  const contentValidation = validateLyricsContent(request.content);
  errors.push(...contentValidation.errors);
  warnings.push(...contentValidation.warnings);

  const isValid = errors.length === 0;

  if (!isValid) {
    logger.warn("Save lyrics request validation failed", {
      errors,
      trackId: request.trackId,
      authorId: request.authorId,
    });
  }

  return { isValid, errors, warnings };
}

// ============================================================================
// CONTENT ANALYSIS UTILITIES
// ============================================================================

/**
 * Analyzes content quality and provides metrics
 *
 * @param content - The lyrics content to analyze
 * @returns ContentQualityMetrics with various quality indicators
 */
export function analyzeContentQuality(content: string): ContentQualityMetrics {
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  const words = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const characterCount = content.length;
  const wordCount = words.length;
  const lineCount = lines.length;

  const averageLineLength = lines.length > 0 ? lines.reduce((sum, line) => sum + line.length, 0) / lines.length : 0;

  const hasStructure = detectLyricsStructure(content);

  // Simple readability score (based on average word length and sentence length)
  const avgWordLength = words.length > 0 ? words.reduce((sum, word) => sum + word.length, 0) / words.length : 0;

  const readabilityScore = calculateReadabilityScore(avgWordLength, averageLineLength, lineCount);

  return {
    wordCount,
    lineCount,
    characterCount,
    hasStructure,
    averageLineLength,
    readabilityScore,
  };
}

/**
 * Calculates lyrics statistics for display and analysis
 *
 * @param content - The lyrics content to analyze
 * @returns LyricsStatistics with comprehensive metrics
 */
export function getLyricsStatistics(content: string): LyricsStatistics {
  const quality = analyzeContentQuality(content);

  // Estimate duration (average: 2.5 seconds per line for medium tempo)
  const estimatedDuration = Math.round(quality.lineCount * 2.5);

  // Count structured sections
  const sectionsCount = countStructuredSections(content);

  return {
    wordCount: quality.wordCount,
    lineCount: quality.lineCount,
    characterCount: quality.characterCount,
    estimatedDuration,
    hasStructuredSections: quality.hasStructure,
    sectionsCount,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Detects if lyrics have repetitive content
 */
function detectRepetitiveContent(content: string): boolean {
  const lines = content.split("\n").filter((line) => line.trim().length > 0);

  if (lines.length < 4) return false;

  // Check for consecutive repeated lines
  let consecutiveRepeats = 0;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === lines[i - 1].trim()) {
      consecutiveRepeats++;
    }
  }

  // More than 30% consecutive repetition is suspicious
  return consecutiveRepeats > lines.length * 0.3;
}

/**
 * Detects if lyrics have clear structure (verses, choruses, etc.)
 */
function detectLyricsStructure(content: string): boolean {
  const structurePatterns = [
    /\[verse\]/i,
    /\[chorus\]/i,
    /\[bridge\]/i,
    /\[intro\]/i,
    /\[outro\]/i,
    /\[pre-chorus\]/i,
    /verse\s*\d+/i,
    /chorus\s*\d+/i,
    /\n\s*\n\s*\n/, // Multiple blank lines suggest structure
  ];

  return structurePatterns.some((pattern) => pattern.test(content));
}

/**
 * Counts structured sections in lyrics
 */
function countStructuredSections(content: string): number {
  const sectionMarkers = content.match(/\[(verse|chorus|bridge|intro|outro|pre-chorus)\]/gi);
  return sectionMarkers ? sectionMarkers.length : 0;
}

/**
 * Calculates readability score (0-100, higher is better)
 */
function calculateReadabilityScore(avgWordLength: number, avgLineLength: number, lineCount: number): number {
  // Simple readability formula (not Flesch, but suitable for lyrics)
  const wordLengthScore = Math.max(0, 100 - (avgWordLength - 4) * 10);
  const lineLengthScore = Math.max(0, 100 - (avgLineLength - 50) * 0.5);
  const structureBonus = lineCount > 8 ? 10 : 0;

  return Math.min(100, Math.round((wordLengthScore + lineLengthScore + structureBonus) / 3));
}

/**
 * Checks if content has structured sections
 * Exported for use in other modules
 */
export function hasStructuredSections(content: string): boolean {
  return detectLyricsStructure(content);
}
