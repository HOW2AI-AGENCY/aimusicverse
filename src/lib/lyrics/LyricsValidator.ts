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

    // Calculate character count (excluding tags)
    const charCount = LyricsFormatter.calculateCharCount(lyrics, true);
    const totalCharCount = lyrics.length;

    // Check character limits
    if (totalCharCount > LYRICS_MAX_LENGTH) {
      warnings.push(`Текст слишком длинный (${totalCharCount}/${LYRICS_MAX_LENGTH} символов)`);
    }
    if (charCount < LYRICS_MIN_LENGTH) {
      warnings.push(`Текст слишком короткий (${charCount}/${LYRICS_MIN_LENGTH} символов без тегов)`);
    }

    // Check for structure tags
    const structure = LyricsFormatter.validateStructure(lyrics);
    if (!structure.hasStructure) {
      suggestions.push('Рекомендуется добавить структурные теги [Verse], [Chorus]');
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
    };
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

    return { isValid: true };
  }
}
