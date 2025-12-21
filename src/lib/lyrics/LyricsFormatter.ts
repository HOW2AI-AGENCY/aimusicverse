/**
 * Lyrics formatting utilities for AI Lyrics Wizard
 * Extracted from lyricsWizardStore for better testability (IMP028)
 * IMP014: Added type guards for section tag validation
 */

import type { LyricSection } from '@/stores/lyricsWizardStore';

export interface EnrichmentTags {
  vocalTags: string[];
  instrumentTags: string[];
  dynamicTags: string[];
  emotionalCues: string[];
}

/**
 * Valid section tag types for Suno format
 * IMP014: Explicit type for valid tags
 */
export type ValidSectionTag = 
  | 'Verse' | 'Verse 1' | 'Verse 2' | 'Verse 3' | 'Verse 4'
  | 'Chorus' | 'Pre-Chorus' | 'Post-Chorus'
  | 'Bridge' | 'Intro' | 'Outro'
  | 'Hook' | 'Drop' | 'Break' | 'Interlude'
  | string; // Allow custom tags but with validation

/**
 * Type guard to check if a string is a valid bracket-enclosed tag
 * IMP014: Ensures proper bracket formatting
 */
export function isValidBracketTag(tag: string): boolean {
  // Tags should not contain nested brackets or unbalanced brackets
  const openCount = (tag.match(/\[/g) || []).length;
  const closeCount = (tag.match(/\]/g) || []).length;
  
  if (openCount !== closeCount) return false;
  if (openCount > 0) return false; // Tag content shouldn't have brackets
  
  // Tags should not be empty or only whitespace
  if (!tag.trim()) return false;
  
  // Tags should not exceed reasonable length
  if (tag.length > 50) return false;
  
  return true;
}

/**
 * Sanitize a tag to ensure it's properly formatted
 * IMP014: Fix malformed tags
 */
export function sanitizeTag(tag: string): string {
  // Remove any existing brackets
  let sanitized = tag.replace(/[\[\]]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > 50) {
    sanitized = sanitized.substring(0, 50);
  }
  
  return sanitized;
}

/**
 * Wrap a tag in brackets safely
 * IMP014: Ensures proper bracket wrapping
 */
export function wrapInBrackets(tag: string): string {
  const sanitized = sanitizeTag(tag);
  if (!sanitized) return '';
  return `[${sanitized}]`;
}

/**
 * Wrap a tag in parentheses safely
 * IMP014: Ensures proper parentheses wrapping
 */
export function wrapInParentheses(tag: string): string {
  const sanitized = tag.replace(/[()]/g, '').trim();
  if (!sanitized) return '';
  return `(${sanitized})`;
}

/**
 * Format lyrics sections with enrichment tags into final Suno-compatible format
 */
export class LyricsFormatter {
  /**
   * Format final lyrics with all sections and enrichment tags
   */
  static formatFinal(sections: LyricSection[], enrichment: EnrichmentTags): string {
    let lyrics = '';
    
    // Add global vocal tags at the beginning (IMP014: Use sanitized wrapping)
    if (enrichment.vocalTags.length > 0) {
      const validTags = enrichment.vocalTags
        .map(t => wrapInBrackets(t))
        .filter(t => t.length > 0);
      if (validTags.length > 0) {
        lyrics += validTags.join(' ') + '\n\n';
      }
    }
    
    // Add each section with its tags
    sections.forEach((section, index) => {
      if (section.content.trim()) {
        // Add section header (IMP014: Validate and sanitize section name)
        const sectionHeader = wrapInBrackets(section.name);
        if (sectionHeader) {
          lyrics += sectionHeader + '\n';
        }
        
        // Add dynamic tags if applicable
        if (index === 0 && enrichment.dynamicTags.includes('Soft Start')) {
          lyrics += '(softly)\n';
        }
        
        // Add section-specific tags (IMP014: Use sanitized wrapping)
        if (section.tags.length > 0) {
          const validSectionTags = section.tags
            .map(t => wrapInParentheses(t))
            .filter(t => t.length > 0);
          if (validSectionTags.length > 0) {
            lyrics += validSectionTags.join(' ') + '\n';
          }
        }
        
        // Add section content
        lyrics += section.content.trim() + '\n\n';
        
        // Add emotional cues if applicable (IMP014: Use sanitized wrapping)
        if (enrichment.emotionalCues.length > 0 && index < sections.length - 1) {
          const cue = enrichment.emotionalCues[index % enrichment.emotionalCues.length];
          if (cue) {
            const wrappedCue = wrapInParentheses(cue);
            if (wrappedCue) {
              lyrics += wrappedCue + '\n\n';
            }
          }
        }
      }
    });
    
    // Add instrument tags at the end if present (IMP014: Use sanitized wrapping)
    if (enrichment.instrumentTags.length > 0) {
      const validInstrumentTags = enrichment.instrumentTags
        .map(t => wrapInBrackets(t))
        .filter(t => t.length > 0);
      if (validInstrumentTags.length > 0) {
        lyrics += '\n' + validInstrumentTags.join(' ');
      }
    }
    
    return lyrics.trim();
  }

  /**
   * Calculate character count excluding structural tags
   * Provides accurate count for Suno's character limit
   */
  static calculateCharCount(lyrics: string, excludeTags: boolean = true): number {
    if (excludeTags) {
      // Remove structural tags [tag] and dynamic tags (tag)
      let lyricsWithoutTags = lyrics
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '');

      // Clean up extra whitespace left after tag removal
      // Replace multiple consecutive newlines with double newline
      lyricsWithoutTags = lyricsWithoutTags
        .replace(/\n{3,}/g, '\n\n')  // max 2 consecutive newlines
        .replace(/[ \t]+\n/g, '\n')   // remove trailing spaces before newlines
        .replace(/\n[ \t]+/g, '\n');  // remove leading spaces after newlines

      return lyricsWithoutTags.trim().length;
    }
    return lyrics.length;
  }

  /**
   * Extract sections from formatted lyrics
   * Useful for parsing existing lyrics back into sections
   */
  static extractSections(lyrics: string): LyricSection[] {
    const sections: LyricSection[] = [];
    const sectionRegex = /\[([^\]]+)\]\n([\s\S]*?)(?=\n\[|$)/g;
    let match;
    let index = 0;

    while ((match = sectionRegex.exec(lyrics)) !== null) {
      const name = match[1];
      const content = match[2].trim();
      
      // Extract tags from content
      const tags: string[] = [];
      const tagRegex = /\(([^)]+)\)/g;
      let tagMatch;
      
      while ((tagMatch = tagRegex.exec(content)) !== null) {
        tags.push(tagMatch[1]);
      }
      
      sections.push({
        id: `section-${index++}`,
        type: name.toLowerCase().includes('verse') ? 'verse' : 
              name.toLowerCase().includes('chorus') ? 'chorus' : 'other',
        name,
        content: content.replace(/\([^)]+\)/g, '').trim(),
        tags,
      });
    }

    return sections;
  }

  /**
   * Validate lyrics structure
   */
  static validateStructure(lyrics: string): {
    hasStructure: boolean;
    sectionCount: number;
    hasTags: boolean;
  } {
    const hasBrackets = lyrics.includes('[');
    const hasParentheses = lyrics.includes('(');
    const sectionMatches = lyrics.match(/\[([^\]]+)\]/g);
    const sectionCount = sectionMatches ? sectionMatches.length : 0;

    return {
      hasStructure: hasBrackets,
      sectionCount,
      hasTags: hasParentheses,
    };
  }
}
