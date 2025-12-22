/**
 * Lyrics validation utilities for AI Lyrics Wizard
 * Enhanced with Suno AI best practices validation
 */

import type { LyricSection } from '@/stores/lyricsWizardStore';
import { LYRICS_MAX_LENGTH, LYRICS_MIN_LENGTH } from '@/constants/generationConstants';
import { LyricsFormatter } from './LyricsFormatter';
import { CONFLICTING_TAGS, ANTI_PATTERNS } from '@/constants/sunoMetaTags';

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
  characterCount: number;
  characterCountWithTags: number;
}

export interface SunoValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  canAutoFix: boolean;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  line?: number;
  fix?: string;
  autoFixable?: boolean;
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
  'Post-Chorus', 'Drop', 'Build', 'Breakdown',
  'End', 'Fade Out', 'Solo',
] as const;

export type ValidSectionTag = typeof VALID_SECTION_TAGS[number];

// Russian tags that should be translated
const RUSSIAN_TAGS = [
  'Куплет', 'Куплет 1', 'Куплет 2', 'Куплет 3',
  'Припев', 'Припев 1', 'Припев 2',
  'Пре-припев', 'Бридж', 'Аутро', 'Интро',
  'Хук', 'Брейк', 'Соло',
];

const RUSSIAN_TO_ENGLISH_MAP: Record<string, string> = {
  'Куплет': 'Verse',
  'Куплет 1': 'Verse 1',
  'Куплет 2': 'Verse 2',
  'Куплет 3': 'Verse 3',
  'Припев': 'Chorus',
  'Припев 1': 'Chorus 1',
  'Припев 2': 'Chorus 2',
  'Пре-припев': 'Pre-Chorus',
  'Бридж': 'Bridge',
  'Аутро': 'Outro',
  'Интро': 'Intro',
  'Хук': 'Hook',
  'Брейк': 'Break',
  'Соло': 'Solo',
  'Конец': 'End',
};

/**
 * Type guard to check if a string is a valid section tag
 */
export function isValidSectionTag(tag: string): tag is ValidSectionTag {
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

    const charCount = LyricsFormatter.calculateCharCount(lyrics, true);
    const totalCharCount = lyrics.length;

    if (totalCharCount > LYRICS_MAX_LENGTH) {
      warnings.push(`Общая длина слишком большая (${totalCharCount}/${LYRICS_MAX_LENGTH} символов)`);
    }
    if (charCount < LYRICS_MIN_LENGTH) {
      warnings.push(`Текст слишком короткий (${charCount}/${LYRICS_MIN_LENGTH} символов без тегов)`);
    }

    const structure = LyricsFormatter.validateStructure(lyrics);
    if (!structure.hasStructure) {
      suggestions.push('Рекомендуется добавить структурные теги [Verse], [Chorus]');
    }

    const invalidTags = this.findInvalidSectionTags(lyrics);
    if (invalidTags.length > 0) {
      warnings.push(`Нераспознанные теги: ${invalidTags.join(', ')}`);
    }

    const emptySections = sections.filter(s => !s.content.trim());
    if (emptySections.length > 0) {
      warnings.push(`${emptySections.length} секций без текста`);
    }

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
   * Full Suno-specific validation
   */
  static validateForSuno(lyrics: string): SunoValidationResult {
    const issues: ValidationIssue[] = [];
    
    // Check missing [End] tag
    const endIssue = this.checkMissingEndTag(lyrics);
    if (endIssue) issues.push(endIssue);

    // Check for Russian tags
    const russianIssues = this.checkRussianTags(lyrics);
    issues.push(...russianIssues);

    // Check for conflicting tags
    const conflictIssues = this.checkConflictingTags(lyrics);
    issues.push(...conflictIssues);

    // Check for tag overload
    const overloadIssues = this.checkTagOverload(lyrics);
    issues.push(...overloadIssues);

    // Check for wrong brackets
    const bracketIssues = this.checkWrongBrackets(lyrics);
    issues.push(...bracketIssues);

    // Check for structure tags
    const structureIssues = this.checkStructureTags(lyrics);
    issues.push(...structureIssues);

    // Calculate score
    const score = this.calculateValidationScore(issues);
    const canAutoFix = issues.some(i => i.autoFixable);

    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      score,
      issues,
      canAutoFix,
    };
  }

  /**
   * Check for missing [End] tag
   */
  static checkMissingEndTag(lyrics: string): ValidationIssue | null {
    const hasEndTag = /\[End\]/i.test(lyrics);
    if (!hasEndTag) {
      return {
        type: 'warning',
        code: 'MISSING_END',
        message: 'Отсутствует тег [End] в конце песни',
        fix: 'Добавьте [End] в конце текста для корректного завершения',
        autoFixable: true,
      };
    }
    return null;
  }

  /**
   * Check for Russian tags
   */
  static checkRussianTags(lyrics: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const tagRegex = /\[([^\]]+)\]/g;
    let match;
    let lineNum = 1;

    const lines = lyrics.split('\n');
    lines.forEach((line, idx) => {
      const lineMatch = line.matchAll(/\[([^\]]+)\]/g);
      for (const m of lineMatch) {
        const tag = m[1];
        if (RUSSIAN_TAGS.some(rt => tag.toLowerCase().includes(rt.toLowerCase()) || rt.toLowerCase().includes(tag.toLowerCase()))) {
          const englishTag = RUSSIAN_TO_ENGLISH_MAP[tag] || 'English equivalent';
          issues.push({
            type: 'error',
            code: 'RUSSIAN_TAG',
            message: `Русский тег [${tag}] на строке ${idx + 1}`,
            line: idx + 1,
            fix: `Замените на [${englishTag}]`,
            autoFixable: true,
          });
        }
      }
    });

    return issues;
  }

  /**
   * Check for conflicting tags
   */
  static checkConflictingTags(lyrics: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const allTags: string[] = [];
    const tagRegex = /\[([^\]]+)\]/g;
    let match;

    while ((match = tagRegex.exec(lyrics)) !== null) {
      allTags.push(match[1].toLowerCase());
    }

    for (const [tag1, tag2, reason] of CONFLICTING_TAGS) {
      const hasTag1 = allTags.some(t => t.includes(tag1.toLowerCase()));
      const hasTag2 = allTags.some(t => t.includes(tag2.toLowerCase()));
      
      if (hasTag1 && hasTag2) {
        issues.push({
          type: 'warning',
          code: 'CONFLICTING_TAGS',
          message: `Конфликтующие теги: [${tag1}] и [${tag2}]`,
          fix: reason,
          autoFixable: false,
        });
      }
    }

    return issues;
  }

  /**
   * Check for tag overload (>3 tags per section)
   */
  static checkTagOverload(lyrics: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const lines = lyrics.split('\n');

    lines.forEach((line, idx) => {
      const tags = line.match(/\[[^\]]+\]/g) || [];
      if (tags.length > 3) {
        issues.push({
          type: 'warning',
          code: 'TAG_OVERLOAD',
          message: `Слишком много тегов (${tags.length}) на строке ${idx + 1}`,
          line: idx + 1,
          fix: 'Рекомендуется 1-2 тега на секцию',
          autoFixable: false,
        });
      }
    });

    return issues;
  }

  /**
   * Check for wrong brackets usage
   */
  static checkWrongBrackets(lyrics: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const lines = lyrics.split('\n');
    
    const structureTags = ['verse', 'chorus', 'bridge', 'intro', 'outro', 'pre-chorus', 'hook', 'break', 'end'];

    lines.forEach((line, idx) => {
      // Check for structure tags in parentheses instead of brackets
      const parenMatches = line.matchAll(/\(([^)]+)\)/g);
      for (const m of parenMatches) {
        const content = m[1].toLowerCase();
        if (structureTags.some(st => content.includes(st))) {
          issues.push({
            type: 'error',
            code: 'WRONG_BRACKETS',
            message: `Структурный тег в круглых скобках: (${m[1]}) на строке ${idx + 1}`,
            line: idx + 1,
            fix: 'Структурные теги должны быть в квадратных скобках [...]',
            autoFixable: true,
          });
        }
      }
    });

    return issues;
  }

  /**
   * Check for proper structure tags
   */
  static checkStructureTags(lyrics: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const structureRegex = /\[(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Hook|Break|End|Drop|Build|Interlude|Post-Chorus|Solo)(\s*\d*)?\]/gi;
    
    const hasStructure = structureRegex.test(lyrics);
    if (!hasStructure) {
      issues.push({
        type: 'warning',
        code: 'NO_STRUCTURE',
        message: 'Отсутствуют структурные теги',
        fix: 'Добавьте [Verse], [Chorus], [Bridge] для структурирования',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Calculate validation score 0-100
   */
  static calculateValidationScore(issues: ValidationIssue[]): number {
    let score = 100;
    
    for (const issue of issues) {
      switch (issue.type) {
        case 'error':
          score -= 15;
          break;
        case 'warning':
          score -= 8;
          break;
        case 'info':
          score -= 2;
          break;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Auto-fix common issues
   */
  static autoFixIssues(lyrics: string): { 
    fixed: string; 
    appliedFixes: string[];
  } {
    let fixed = lyrics;
    const appliedFixes: string[] = [];

    // Fix Russian tags
    for (const [ru, en] of Object.entries(RUSSIAN_TO_ENGLISH_MAP)) {
      const regex = new RegExp(`\\[${ru}\\]`, 'gi');
      if (regex.test(fixed)) {
        fixed = fixed.replace(regex, `[${en}]`);
        appliedFixes.push(`[${ru}] → [${en}]`);
      }
    }

    // Fix structure tags in parentheses
    const structureTags = ['Verse', 'Chorus', 'Bridge', 'Intro', 'Outro', 'Pre-Chorus', 'Hook', 'Break', 'End'];
    for (const tag of structureTags) {
      const regex = new RegExp(`\\(${tag}(\\s*\\d*)?\\)`, 'gi');
      if (regex.test(fixed)) {
        fixed = fixed.replace(regex, (match, num) => `[${tag}${num || ''}]`);
        appliedFixes.push(`(${tag}) → [${tag}]`);
      }
    }

    // Add [End] if missing
    if (!/\[End\]/i.test(fixed)) {
      fixed = fixed.trim() + '\n\n[End]';
      appliedFixes.push('Добавлен [End]');
    }

    return { fixed, appliedFixes };
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
      'Male Singer', 'Female Singer', 'Duet', 'Choir', 'Acapella',
      'Guitar Solo', 'Piano Solo', 'Drum Solo', 'Bass Drop', 'Sax Solo',
      'Fade Out', 'Fade In', 'Build Up', 'Drop', 'Soft', 'Loud',
      '!reverb', '!delay', '!distortion', '!filter', '!crescendo', '!diminuendo',
      'Powerful', 'Gentle', 'Emotional', 'Intense', 'Calm', 'Atmospheric',
      'Lo-fi', 'Hi-fi', 'Vintage', 'Full band', 'Acoustic',
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

    const openBrackets = (section.content.match(/\[/g) || []).length;
    const closeBrackets = (section.content.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push('Незакрытые теги []');
    }

    const openParens = (section.content.match(/\(/g) || []).length;
    const closeParens = (section.content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push('Незакрытые скобки ()');
    }

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
   * Validate tag insertion
   */
  static validateTagInsertion(tag: string): {
    isValid: boolean;
    error?: string;
    normalized?: string;
  } {
    if (!tag.trim()) {
      return { isValid: false, error: 'Тег не может быть пустым' };
    }

    if (tag.includes('[') || tag.includes(']')) {
      return { isValid: false, error: 'Тег не может содержать вложенные скобки' };
    }

    if (tag.length > 50) {
      return { isValid: false, error: 'Тег слишком длинный (максимум 50 символов)' };
    }

    if (isValidSectionTag(tag)) {
      return { isValid: true, normalized: normalizeSectionTag(tag) };
    }

    return { isValid: true, normalized: tag.trim() };
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