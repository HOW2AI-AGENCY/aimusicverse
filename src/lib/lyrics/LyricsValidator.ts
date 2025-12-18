/**
 * Lyrics validation utilities for AI Lyrics Wizard
 * Centralized validation rules (IMP029)
 */

import type { LyricSection } from '@/stores/lyricsWizardStore';
import { LYRICS_MAX_LENGTH, LYRICS_MIN_LENGTH } from '@/constants/generationConstants';
import { LyricsFormatter } from './LyricsFormatter';

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
  characterCount: number;
  characterCountWithTags: number; // Added for transparency
}

/**
 * Valid section tag types for Suno lyrics
 */
export const VALID_SECTION_TAGS = [
  'Verse', 'Verse 1', 'Verse 2', 'Verse 3', 'Verse 4',
  'Chorus', 'Chorus 1', 'Chorus 2',
  'Pre-Chorus', 'Pre-Chorus 1', 'Pre-Chorus 2',
  'Bridge', 'Bridge 1', 'Bridge 2',
  'Outro', 'Intro',
  'Hook', 'Refrain',
  'Break', 'Instrumental', 'Interlude',
  'Куплет', 'Куплет 1', 'Куплет 2', 'Куплет 3',
  'Припев', 'Припев 1', 'Припев 2',
  'Пре-припев', 'Бридж', 'Аутро', 'Интро',
] as const;

export type ValidSectionTag = typeof VALID_SECTION_TAGS[number];

/**
 * Type guard to check if a string is a valid section tag
 */
export function isValidSectionTag(tag: string): tag is ValidSectionTag {
  // Normalize: trim and match case-insensitively
  const normalized = tag.trim();
  return VALID_SECTION_TAGS.some(
    validTag => validTag.toLowerCase() === normalized.toLowerCase()
  );
}

/**
 * Normalize section tag to standard format
 */
export function normalizeSectionTag(tag: string): string {
  const normalized = tag.trim();
  const match = VALID_SECTION_TAGS.find(
    validTag => validTag.toLowerCase() === normalized.toLowerCase()
  );
  return match || normalized;
}

/**
 * Centralized section content validation
 */
export class LyricsValidator {
  /**
   * Validate complete lyrics with sections
   */
  static validate(lyrics: string, sections: LyricSection[]): ValidationResult {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Calculate character count (excluding tags) - this is what matters for generation
    const charCount = LyricsFormatter.calculateCharCount(lyrics, true);
    // Also track total for transparency
    const totalCharCount = lyrics.length;

    // Check character limits - use charCount (without tags) for the actual limit
    if (totalCharCount > LYRICS_MAX_LENGTH) {
      warnings.push(`Общая длина слишком большая (${totalCharCount}/${LYRICS_MAX_LENGTH} символов)`);
    }
    if (charCount < LYRICS_MIN_LENGTH) {
      warnings.push(`Текст слишком короткий (${charCount}/${LYRICS_MIN_LENGTH} символов без тегов)`);
    }

    // Check for structure tags
    const structure = LyricsFormatter.validateStructure(lyrics);
    if (!structure.hasStructure) {
      suggestions.push('Рекомендуется добавить структурные теги [Verse], [Chorus]');
    }

    // Validate section tags
    const invalidTags = this.findInvalidSectionTags(lyrics);
    if (invalidTags.length > 0) {
      warnings.push(`Нераспознанные теги: ${invalidTags.join(', ')}. Используйте стандартные: Verse, Chorus, Bridge и т.д.`);
    }

    // Check for empty sections
    const emptySections = sections.filter(s => !s.content.trim());
    if (emptySections.length > 0) {
      warnings.push(`${emptySections.length} секций без текста`);
    }

    // Check section balance
    const balance = this.checkSectionBalance(sections);
    if (balance.warning) {
      suggestions.push(balance.warning);
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions,
      characterCount: charCount,
      characterCountWithTags: totalCharCount,
    };
  }

  /**
   * Find invalid section tags in lyrics
   */
  static findInvalidSectionTags(lyrics: string): string[] {
    const tagRegex = /\[([^\]]+)\]/g;
    const invalidTags: string[] = [];
    let match;

    while ((match = tagRegex.exec(lyrics)) !== null) {
      const tag = match[1];
      // Skip instrumental/dynamic tags that are valid
      if (!isValidSectionTag(tag) && !this.isDynamicTag(tag)) {
        invalidTags.push(tag);
      }
    }

    return invalidTags;
  }

  /**
   * Check if tag is a valid dynamic/vocal tag (not a section)
   */
  private static isDynamicTag(tag: string): boolean {
    const dynamicTags = [
      'Male Vocal', 'Female Vocal', 'Whisper', 'Shout', 'Spoken',
      'Мужской вокал', 'Женский вокал', 'Шёпот', 'Крик', 'Речитатив',
      'Guitar Solo', 'Piano Solo', 'Drum Solo', 'Bass Drop',
      'Fade Out', 'Fade In', 'Build Up', 'Drop',
    ];
    return dynamicTags.some(dt => dt.toLowerCase() === tag.toLowerCase());
  }

  /**
   * Validate individual section content
   */
  static validateSection(section: LyricSection): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!section.content.trim()) {
      errors.push('Секция не может быть пустой');
    }

    // Check for unclosed tags
    const openBrackets = (section.content.match(/\[/g) || []).length;
    const closeBrackets = (section.content.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push('Незакрытые теги []');
    }

    const openParens = (section.content.match(/\(/g) || []).length;
    const closeParens = (section.content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push('Незакрытые теги ()');
    }

    // Check line count if specified
    if (section.content.trim()) {
      const lines = section.content.trim().split('\n').filter(l => l.trim());
      if (lines.length > 20) {
        errors.push('Слишком много строк (рекомендуется до 20)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check section balance in song structure
   */
  private static checkSectionBalance(sections: LyricSection[]): {
    isBalanced: boolean;
    warning?: string;
  } {
    const sectionCounts: Record<string, number> = {};
    
    sections.forEach(section => {
      const type = section.type || 'other';
      sectionCounts[type] = (sectionCounts[type] || 0) + 1;
    });

    // Check for common structural issues
    if (sectionCounts.chorus && sectionCounts.chorus < 2) {
      return {
        isBalanced: false,
        warning: 'Рекомендуется повторить припев как минимум 2 раза',
      };
    }

    if (sectionCounts.verse && sectionCounts.verse < 2) {
      return {
        isBalanced: false,
        warning: 'Рекомендуется добавить как минимум 2 куплета',
      };
    }

    return { isBalanced: true };
  }

  /**
   * Validate tag insertion to prevent malformed brackets
   */
  static validateTagInsertion(tag: string): {
    isValid: boolean;
    error?: string;
    normalized?: string;
  } {
    // Check for basic tag format
    if (!tag.trim()) {
      return {
        isValid: false,
        error: 'Тег не может быть пустым',
      };
    }

    // Check for nested brackets
    if (tag.includes('[') || tag.includes(']')) {
      return {
        isValid: false,
        error: 'Тег не может содержать вложенные скобки',
      };
    }

    // Check for excessive length
    if (tag.length > 50) {
      return {
        isValid: false,
        error: 'Тег слишком длинный (максимум 50 символов)',
      };
    }

    // Validate and normalize section tag
    if (isValidSectionTag(tag)) {
      return { 
        isValid: true, 
        normalized: normalizeSectionTag(tag) 
      };
    }

    // Allow custom tags but warn
    return { 
      isValid: true,
      normalized: tag.trim(),
    };
  }

  /**
   * Sanitize lyrics by normalizing section tags
   */
  static sanitizeLyrics(lyrics: string): string {
    return lyrics.replace(/\[([^\]]+)\]/g, (match, tag) => {
      if (isValidSectionTag(tag)) {
        return `[${normalizeSectionTag(tag)}]`;
      }
      return match;
    });
  }
}
