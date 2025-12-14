/**
 * Advanced lyrics parser for AI-generated lyrics with Suno V5 tags
 * Extracts metadata, sections, and tags from formatted lyrics
 */

export interface ParsedLyrics {
  // Raw text
  raw: string;
  
  // Extracted metadata
  title?: string;
  style?: string;
  
  // Parsed sections
  sections: LyricsSection[];
  
  // Extracted tags summary
  tags: {
    structural: string[];
    vocal: string[];
    dynamic: string[];
    instrumental: string[];
    emotional: string[];
  };
  
  // Validation
  isValid: boolean;
  warnings: string[];
}

export interface LyricsSection {
  id: string;
  name: string;
  type: 'intro' | 'verse' | 'pre-chorus' | 'chorus' | 'bridge' | 'outro' | 'other';
  content: string;
  tags: SectionTag[];
  startLine: number;
  endLine: number;
}

export interface SectionTag {
  type: 'structural' | 'vocal' | 'dynamic' | 'instrumental' | 'emotional';
  value: string;
  format: 'bracket' | 'parenthesis'; // [tag] or (tag)
}

/**
 * Parse lyrics with Suno V5 tags into structured format
 */
export class LyricsParser {
  /**
   * Parse complete lyrics string
   */
  static parse(lyrics: string): ParsedLyrics {
    const sections = this.extractSections(lyrics);
    const tags = this.extractAllTags(lyrics);
    const warnings = this.validateStructure(lyrics, sections);
    
    return {
      raw: lyrics,
      sections,
      tags,
      isValid: warnings.length === 0,
      warnings,
    };
  }
  
  /**
   * Extract sections from lyrics
   */
  private static extractSections(lyrics: string): LyricsSection[] {
    const sections: LyricsSection[] = [];
    const lines = lyrics.split('\n');
    let currentSection: LyricsSection | null = null;
    let lineNumber = 0;
    
    for (const line of lines) {
      lineNumber++;
      
      // Check for section header [Section Name]
      const sectionMatch = line.match(/^\[([^\]]+)\]/);
      
      if (sectionMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.endLine = lineNumber - 1;
          sections.push(currentSection);
        }
        
        // Start new section
        const sectionName = sectionMatch[1].trim();
        const sectionType = this.detectSectionType(sectionName);
        
        currentSection = {
          id: `section-${sections.length}`,
          name: sectionName,
          type: sectionType,
          content: '',
          tags: [],
          startLine: lineNumber,
          endLine: lineNumber,
        };
      } else if (currentSection) {
        // Add content to current section
        if (line.trim()) {
          // Extract inline tags
          const lineTags = this.extractInlineTags(line);
          currentSection.tags.push(...lineTags);
          
          // Add line to content (without extracting tags for now, keep as-is)
          currentSection.content += (currentSection.content ? '\n' : '') + line;
        }
      }
    }
    
    // Save last section
    if (currentSection) {
      currentSection.endLine = lineNumber;
      sections.push(currentSection);
    }
    
    return sections;
  }
  
  /**
   * Detect section type from name
   */
  private static detectSectionType(name: string): LyricsSection['type'] {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('intro')) return 'intro';
    if (lowerName.includes('verse') || lowerName.includes('куплет')) return 'verse';
    if (lowerName.includes('pre') && lowerName.includes('chorus')) return 'pre-chorus';
    if (lowerName.includes('chorus') || lowerName.includes('припев')) return 'chorus';
    if (lowerName.includes('bridge') || lowerName.includes('бридж')) return 'bridge';
    if (lowerName.includes('outro')) return 'outro';
    
    return 'other';
  }
  
  /**
   * Extract inline tags from a line
   */
  private static extractInlineTags(line: string): SectionTag[] {
    const tags: SectionTag[] = [];
    
    // Extract bracket tags [tag]
    const bracketMatches = line.matchAll(/\[([^\]]+)\]/g);
    for (const match of bracketMatches) {
      const tagValue = match[1].trim();
      const tagType = this.detectTagType(tagValue, 'bracket');
      tags.push({
        type: tagType,
        value: tagValue,
        format: 'bracket',
      });
    }
    
    // Extract parenthesis tags (tag)
    const parenMatches = line.matchAll(/\(([^)]+)\)/g);
    for (const match of parenMatches) {
      const tagValue = match[1].trim();
      const tagType = this.detectTagType(tagValue, 'parenthesis');
      tags.push({
        type: tagType,
        value: tagValue,
        format: 'parenthesis',
      });
    }
    
    return tags;
  }
  
  /**
   * Detect tag type based on content and format
   */
  private static detectTagType(value: string, format: 'bracket' | 'parenthesis'): SectionTag['type'] {
    const lowerValue = value.toLowerCase();
    
    // Structural tags (usually in brackets)
    const structuralKeywords = ['verse', 'chorus', 'bridge', 'intro', 'outro', 'pre-chorus', 'hook'];
    if (format === 'bracket' && structuralKeywords.some(k => lowerValue.includes(k))) {
      return 'structural';
    }
    
    // Dynamic tags
    const dynamicKeywords = ['build', 'drop', 'breakdown', 'crescendo', 'climax', 'fade'];
    if (dynamicKeywords.some(k => lowerValue.includes(k))) {
      return 'dynamic';
    }
    
    // Instrumental tags
    const instrumentKeywords = ['guitar', 'piano', 'drum', 'bass', 'synth', 'violin', 'strings', 'horn'];
    if (instrumentKeywords.some(k => lowerValue.includes(k))) {
      return 'instrumental';
    }
    
    // Vocal tags
    const vocalKeywords = ['vocal', 'voice', 'sing', 'falsetto', 'whisper', 'belt', 'rap'];
    if (vocalKeywords.some(k => lowerValue.includes(k))) {
      return 'vocal';
    }
    
    // Emotional tags (usually in parenthesis)
    if (format === 'parenthesis') {
      return 'emotional';
    }
    
    return 'vocal'; // default for bracket tags
  }
  
  /**
   * Extract all tags summary
   */
  private static extractAllTags(lyrics: string): ParsedLyrics['tags'] {
    const tags: ParsedLyrics['tags'] = {
      structural: [],
      vocal: [],
      dynamic: [],
      instrumental: [],
      emotional: [],
    };
    
    const lines = lyrics.split('\n');
    for (const line of lines) {
      const lineTags = this.extractInlineTags(line);
      for (const tag of lineTags) {
        if (!tags[tag.type].includes(tag.value)) {
          tags[tag.type].push(tag.value);
        }
      }
    }
    
    return tags;
  }
  
  /**
   * Validate structure and return warnings
   */
  private static validateStructure(lyrics: string, sections: LyricsSection[]): string[] {
    const warnings: string[] = [];
    
    // Check if has sections
    if (sections.length === 0) {
      warnings.push('Текст не содержит структурных секций ([Verse], [Chorus] и т.д.)');
    }
    
    // Check for common sections
    const hasChorus = sections.some(s => s.type === 'chorus');
    const hasVerse = sections.some(s => s.type === 'verse');
    
    if (!hasChorus && sections.length > 0) {
      warnings.push('Рекомендуется добавить секцию [Chorus] (припев)');
    }
    
    if (!hasVerse && sections.length > 0) {
      warnings.push('Рекомендуется добавить секцию [Verse] (куплет)');
    }
    
    // Check for unclosed tags
    const openBrackets = (lyrics.match(/\[/g) || []).length;
    const closeBrackets = (lyrics.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      warnings.push('Обнаружены незакрытые квадратные скобки [');
    }
    
    const openParens = (lyrics.match(/\(/g) || []).length;
    const closeParens = (lyrics.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      warnings.push('Обнаружены незакрытые круглые скобки (');
    }
    
    return warnings;
  }
  
  /**
   * Extract clean text without tags
   */
  static extractCleanText(lyrics: string): string {
    return lyrics
      .replace(/\[([^\]]+)\]\s*/g, '') // Remove [tags]
      .replace(/\(([^)]+)\)\s*/g, '')  // Remove (tags)
      .replace(/\n{3,}/g, '\n\n')       // Clean excessive newlines
      .trim();
  }
  
  /**
   * Get section by type
   */
  static getSectionsByType(parsed: ParsedLyrics, type: LyricsSection['type']): LyricsSection[] {
    return parsed.sections.filter(s => s.type === type);
  }
  
  /**
   * Format section for display with colored tags
   */
  static formatSectionForDisplay(section: LyricsSection): {
    name: string;
    content: string;
    tagSummary: string;
  } {
    const tagSummary = section.tags
      .map(t => `${t.format === 'bracket' ? '[' : '('}${t.value}${t.format === 'bracket' ? ']' : ')'}`)
      .join(' ');
    
    return {
      name: section.name,
      content: section.content,
      tagSummary,
    };
  }
}
