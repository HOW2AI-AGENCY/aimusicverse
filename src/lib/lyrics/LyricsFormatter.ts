/**
 * Lyrics formatting utilities for AI Lyrics Wizard
 * Extracted from lyricsWizardStore for better testability (IMP028)
 */

import type { LyricSection } from '@/stores/lyricsWizardStore';

export interface EnrichmentTags {
  vocalTags: string[];
  instrumentTags: string[];
  dynamicTags: string[];
  emotionalCues: string[];
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
    
    // Add global vocal tags at the beginning
    if (enrichment.vocalTags.length > 0) {
      lyrics += enrichment.vocalTags.map(t => `[${t}]`).join(' ') + '\n\n';
    }
    
    // Add each section with its tags
    sections.forEach((section, index) => {
      if (section.content.trim()) {
        // Add section header
        lyrics += `[${section.name}]\n`;
        
        // Add dynamic tags if applicable
        if (index === 0 && enrichment.dynamicTags.includes('Soft Start')) {
          lyrics += '(softly)\n';
        }
        
        // Add section-specific tags
        if (section.tags.length > 0) {
          lyrics += section.tags.map(t => `(${t})`).join(' ') + '\n';
        }
        
        // Add section content
        lyrics += section.content.trim() + '\n\n';
        
        // Add emotional cues if applicable
        if (enrichment.emotionalCues.length > 0 && index < sections.length - 1) {
          const cue = enrichment.emotionalCues[index % enrichment.emotionalCues.length];
          if (cue) {
            lyrics += `(${cue})\n\n`;
          }
        }
      }
    });
    
    // Add instrument tags at the end if present
    if (enrichment.instrumentTags.length > 0) {
      lyrics += '\n' + enrichment.instrumentTags.map(t => `[${t}]`).join(' ');
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
      const lyricsWithoutTags = lyrics
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '');
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
