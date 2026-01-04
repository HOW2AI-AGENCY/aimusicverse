/**
 * Advanced lyrics parser for AI-generated lyrics with Suno V5 tags
 * Extracts metadata, sections, and tags from formatted lyrics
 * 
 * V5 Syntax Support:
 * - Compound tags: [A | B | C]
 * - Transformations: A -> B
 * - Solo descriptors: [Instrumental Solo: Guitar | Shredding | High Gain]
 * - Dynamic effects: [!crescendo], [!build_up]
 * - Silence tags: [Stop], [Silence]
 */

export interface ParsedLyrics {
  raw: string;
  title?: string;
  style?: string;
  sections: LyricsSection[];
  tags: {
    structural: string[];
    vocal: string[];
    dynamic: string[];
    instrumental: string[];
    emotional: string[];
    compound: string[];
    transform: string[];
    effect: string[];
  };
  isValid: boolean;
  warnings: string[];
  syllableAnalysis?: SyllableAnalysis[];
  tagValidation?: TagValidationResult;
}

export interface LyricsSection {
  id: string;
  name: string;
  type: 'intro' | 'verse' | 'pre-chorus' | 'chorus' | 'bridge' | 'outro' | 'instrumental' | 'solo' | 'other';
  content: string;
  tags: SectionTag[];
  startLine: number;
  endLine: number;
}

export interface SectionTag {
  type: 'structural' | 'vocal' | 'dynamic' | 'instrumental' | 'emotional' | 'compound' | 'transform' | 'effect';
  value: string;
  format: 'bracket' | 'parenthesis' | 'compound';
  parts?: string[]; // For compound tags
}

export interface SyllableAnalysis {
  line: string;
  lineNumber: number;
  syllableCount: number;
  isOptimal: boolean; // 6-12 syllables
  suggestion?: string;
}

export interface TagValidationResult {
  isValid: boolean;
  conflicts: [string, string, string][]; // [tag1, tag2, reason]
  russianTags: string[];
  missingEnd: boolean;
  overloadedLines: number[];
  duplicateSections: string[];
}

// V5 Syntax Patterns
const COMPOUND_TAG_REGEX = /\[([^\]]+\s*\|\s*[^\]]+)\]/g;
const TRANSFORM_REGEX = /\[([A-Za-z\s]+)\s*->\s*([A-Za-z\s]+)\]/g;
const SOLO_DESCRIPTOR_REGEX = /\[Instrumental Solo:\s*([^\]]+)\]/gi;
const DYNAMIC_EFFECT_REGEX = /\[!([a-z_]+)\]/gi;
const SILENCE_TAGS = ['Stop', 'Silence', 'End'];
const RUSSIAN_TAG_REGEX = /\[(Куплет|Припев|Бридж|Интро|Аутро|Пре-припев|Финал|Соло)[^\]]*\]/gi;

// Conflicting tag pairs
const CONFLICTING_TAGS: [string, string, string][] = [
  ['Acapella', 'Full band', 'Акапелла исключает инструменты'],
  ['Whisper', 'Shout', 'Шёпот и крик несовместимы'],
  ['Soft', 'Loud', 'Выберите одну громкость'],
  ['Soft', 'Explosive', 'Мягкое и взрывное несовместимы'],
  ['Calm', 'Intense', 'Спокойное и интенсивное несовместимы'],
  ['Fade Out', 'Fade In', 'Используйте один эффект'],
  ['Lo-fi', 'Hi-fi', 'Выберите один тип качества'],
  ['Clean', 'Distortion', 'Чистый и перегруженный звук несовместимы'],
  ['Whisper', 'Belting', 'Шёпот и белтинг несовместимы'],
  ['Acapella', 'Guitar Solo', 'Акапелла исключает инструментальные соло'],
];

/**
 * Parse lyrics with Suno V5 tags into structured format
 */
export class LyricsParser {
  /**
   * Parse complete lyrics string with V5 support
   */
  static parse(lyrics: string): ParsedLyrics {
    const sections = this.extractSections(lyrics);
    const tags = this.extractAllTags(lyrics);
    const tagValidation = this.validateTags(lyrics);
    const syllableAnalysis = this.analyzeSyllables(lyrics);
    const warnings = this.validateStructure(lyrics, sections, tagValidation);
    
    return {
      raw: lyrics,
      sections,
      tags,
      isValid: warnings.length === 0 && tagValidation.isValid,
      warnings,
      syllableAnalysis,
      tagValidation,
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
      
      // Check for section header [Section Name] - with possible compound tags
      const sectionMatch = line.match(/^\[([^\]|]+)(?:\s*\|[^\]]+)?\]/);
      
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
        
        // Extract all tags from the header line
        const lineTags = this.extractInlineTags(line);
        currentSection.tags.push(...lineTags);
      } else if (currentSection) {
        // Add content to current section
        if (line.trim()) {
          // Extract inline tags
          const lineTags = this.extractInlineTags(line);
          currentSection.tags.push(...lineTags);
          
          // Add line to content
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
    if (lowerName.includes('instrumental') || lowerName.includes('interlude')) return 'instrumental';
    if (lowerName.includes('solo')) return 'solo';
    
    return 'other';
  }
  
  /**
   * Extract inline tags from a line (V5 enhanced)
   */
  private static extractInlineTags(line: string): SectionTag[] {
    const tags: SectionTag[] = [];
    
    // Extract compound tags [A | B | C]
    const compoundMatches = Array.from(line.matchAll(COMPOUND_TAG_REGEX));
    for (const match of compoundMatches) {
      const parts = match[1].split('|').map(p => p.trim());
      tags.push({
        type: 'compound',
        value: match[1].trim(),
        format: 'compound',
        parts,
      });
    }
    
    // Extract transform tags [A -> B]
    const transformMatches = Array.from(line.matchAll(TRANSFORM_REGEX));
    for (const match of transformMatches) {
      tags.push({
        type: 'transform',
        value: `${match[1].trim()} -> ${match[2].trim()}`,
        format: 'bracket',
        parts: [match[1].trim(), match[2].trim()],
      });
    }
    
    // Extract solo descriptors [Instrumental Solo: Guitar | Shredding]
    const soloMatches = Array.from(line.matchAll(SOLO_DESCRIPTOR_REGEX));
    for (const match of soloMatches) {
      const parts = match[1].split('|').map(p => p.trim());
      tags.push({
        type: 'instrumental',
        value: `Instrumental Solo: ${match[1].trim()}`,
        format: 'compound',
        parts,
      });
    }
    
    // Extract dynamic effects [!effect]
    const effectMatches = Array.from(line.matchAll(DYNAMIC_EFFECT_REGEX));
    for (const match of effectMatches) {
      tags.push({
        type: 'effect',
        value: `!${match[1]}`,
        format: 'bracket',
      });
    }
    
    // Extract regular bracket tags [tag] (excluding already matched patterns)
    const bracketMatches = Array.from(line.matchAll(/\[([^\]|]+)\]/g));
    for (const match of bracketMatches) {
      const tagValue = match[1].trim();
      // Skip if already captured as compound, transform, solo, or effect
      if (tagValue.includes('|') || tagValue.includes('->') || 
          tagValue.toLowerCase().includes('instrumental solo:') || tagValue.startsWith('!')) {
        continue;
      }
      const tagType = this.detectTagType(tagValue, 'bracket');
      tags.push({
        type: tagType,
        value: tagValue,
        format: 'bracket',
      });
    }
    
    // Extract parenthesis tags (tag) - back vocals, ad-libs
    const parenMatches = Array.from(line.matchAll(/\(([^)]+)\)/g));
    for (const match of parenMatches) {
      const tagValue = match[1].trim();
      tags.push({
        type: 'emotional',
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
    
    // Effect tags (starts with !)
    if (lowerValue.startsWith('!')) {
      return 'effect';
    }
    
    // Structural tags
    const structuralKeywords = ['verse', 'chorus', 'bridge', 'intro', 'outro', 'pre-chorus', 'hook', 
                                'interlude', 'break', 'drop', 'breakdown', 'build', 'end', 'stop', 'silence'];
    if (format === 'bracket' && structuralKeywords.some(k => lowerValue.includes(k))) {
      return 'structural';
    }
    
    // Dynamic tags
    const dynamicKeywords = ['build', 'drop', 'breakdown', 'crescendo', 'climax', 'fade', 'soft', 
                            'loud', 'intense', 'calm', 'explosive', 'diminuendo'];
    if (dynamicKeywords.some(k => lowerValue.includes(k))) {
      return 'dynamic';
    }
    
    // Instrumental tags
    const instrumentKeywords = ['guitar', 'piano', 'drum', 'bass', 'synth', 'violin', 'strings', 
                                'horn', 'sax', 'orchestra', 'solo', '808', 'hi-hat'];
    if (instrumentKeywords.some(k => lowerValue.includes(k))) {
      return 'instrumental';
    }
    
    // Vocal tags
    const vocalKeywords = ['vocal', 'voice', 'sing', 'falsetto', 'whisper', 'belt', 'rap', 
                          'choir', 'harmony', 'male', 'female', 'tenor', 'alto', 'soprano'];
    if (vocalKeywords.some(k => lowerValue.includes(k))) {
      return 'vocal';
    }
    
    // Emotional/parenthesis tags
    if (format === 'parenthesis') {
      return 'emotional';
    }
    
    return 'vocal';
  }
  
  /**
   * Extract all tags summary (V5 enhanced)
   */
  private static extractAllTags(lyrics: string): ParsedLyrics['tags'] {
    const tags: ParsedLyrics['tags'] = {
      structural: [],
      vocal: [],
      dynamic: [],
      instrumental: [],
      emotional: [],
      compound: [],
      transform: [],
      effect: [],
    };
    
    const lines = lyrics.split('\n');
    for (const line of lines) {
      const lineTags = this.extractInlineTags(line);
      for (const tag of lineTags) {
        const category = tag.type as keyof ParsedLyrics['tags'];
        if (tags[category] && !tags[category].includes(tag.value)) {
          tags[category].push(tag.value);
        }
      }
    }
    
    return tags;
  }
  
  /**
   * Validate tags for conflicts and issues
   */
  private static validateTags(lyrics: string): TagValidationResult {
    const result: TagValidationResult = {
      isValid: true,
      conflicts: [],
      russianTags: [],
      missingEnd: false,
      overloadedLines: [],
      duplicateSections: [],
    };
    
    // Check for [End] tag
    if (!/\[End\]/i.test(lyrics)) {
      result.missingEnd = true;
      result.isValid = false;
    }
    
    // Check for Russian tags
    const russianMatches = lyrics.match(RUSSIAN_TAG_REGEX);
    if (russianMatches) {
      result.russianTags = russianMatches;
      result.isValid = false;
    }
    
    // Check for conflicting tags
    const allBracketTags = (lyrics.match(/\[([^\]]+)\]/g) || []).map(t => t.slice(1, -1).toLowerCase());
    for (const [tag1, tag2, reason] of CONFLICTING_TAGS) {
      const hasTag1 = allBracketTags.some(t => t.includes(tag1.toLowerCase()));
      const hasTag2 = allBracketTags.some(t => t.includes(tag2.toLowerCase()));
      if (hasTag1 && hasTag2) {
        result.conflicts.push([tag1, tag2, reason]);
        result.isValid = false;
      }
    }
    
    // Check for overloaded lines (>3 bracket tags)
    const lines = lyrics.split('\n');
    lines.forEach((line, i) => {
      const tagCount = (line.match(/\[[^\]]+\]/g) || []).length;
      if (tagCount > 3) {
        result.overloadedLines.push(i + 1);
      }
    });
    
    // Check for duplicate section names
    const sectionNames: string[] = [];
    const sectionMatches = lyrics.matchAll(/^\[(Verse|Chorus|Bridge|Pre-Chorus|Intro|Outro)(?:\s*\d+)?\]/gim);
    for (const match of sectionMatches) {
      const name = match[0].toLowerCase();
      if (sectionNames.includes(name)) {
        // Duplicate is ok for verses/choruses, but flag it
      }
      sectionNames.push(name);
    }
    
    return result;
  }
  
  /**
   * Analyze syllables per line
   */
  private static analyzeSyllables(lyrics: string): SyllableAnalysis[] {
    const analysis: SyllableAnalysis[] = [];
    const lines = lyrics.split('\n');
    
    lines.forEach((line, i) => {
      const cleanLine = this.extractCleanLine(line);
      if (!cleanLine || cleanLine.length < 2) return;
      
      const syllableCount = this.countSyllables(cleanLine);
      const isOptimal = syllableCount >= 6 && syllableCount <= 12;
      
      let suggestion: string | undefined;
      if (syllableCount > 16) {
        suggestion = `Слишком длинная (${syllableCount} слогов) — разбей на 2 строки или сократи`;
      } else if (syllableCount > 12) {
        suggestion = `Длинновата (${syllableCount} слогов) — рассмотри сокращение`;
      } else if (syllableCount < 4 && cleanLine.length > 5) {
        suggestion = `Очень короткая (${syllableCount} слогов) — можно объединить со следующей`;
      }
      
      analysis.push({
        line: cleanLine,
        lineNumber: i + 1,
        syllableCount,
        isOptimal,
        suggestion,
      });
    });
    
    return analysis;
  }
  
  /**
   * Count syllables in a line (Cyrillic + Latin support)
   */
  private static countSyllables(text: string): number {
    // Vowels in Cyrillic and Latin
    const vowels = /[аеёиоуыэюяaeiouAEIOUАЕЁИОУЫЭЮЯ]/g;
    const matches = text.match(vowels);
    return matches ? matches.length : 0;
  }
  
  /**
   * Extract clean line without tags
   */
  private static extractCleanLine(line: string): string {
    return line
      .replace(/\[([^\]]+)\]/g, '')   // Remove [tags]
      .replace(/\(([^)]+)\)/g, '')    // Remove (tags)
      .replace(/^\s*[-–—]\s*/, '')    // Remove list markers
      .trim();
  }
  
  /**
   * Validate structure and return warnings (enhanced)
   */
  private static validateStructure(
    lyrics: string, 
    sections: LyricsSection[],
    tagValidation: TagValidationResult
  ): string[] {
    const warnings: string[] = [];
    
    // Check if has sections
    if (sections.length === 0) {
      warnings.push('❌ Текст не содержит структурных секций ([Verse], [Chorus] и т.д.)');
    }
    
    // Check for common sections
    const hasChorus = sections.some(s => s.type === 'chorus');
    const hasVerse = sections.some(s => s.type === 'verse');
    
    if (!hasChorus && sections.length > 0) {
      warnings.push('💡 Рекомендуется добавить секцию [Chorus] (припев)');
    }
    
    if (!hasVerse && sections.length > 0) {
      warnings.push('💡 Рекомендуется добавить секцию [Verse] (куплет)');
    }
    
    // Check for unclosed tags
    const openBrackets = (lyrics.match(/\[/g) || []).length;
    const closeBrackets = (lyrics.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      warnings.push('❌ Обнаружены незакрытые квадратные скобки [');
    }
    
    const openParens = (lyrics.match(/\(/g) || []).length;
    const closeParens = (lyrics.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      warnings.push('❌ Обнаружены незакрытые круглые скобки (');
    }
    
    // Add tag validation warnings
    if (tagValidation.missingEnd) {
      warnings.push('❌ КРИТИЧНО: Отсутствует [End] — песня может зациклиться!');
    }
    
    if (tagValidation.russianTags.length > 0) {
      warnings.push(`❌ Русские теги запрещены: ${tagValidation.russianTags.join(', ')}. Используй [Verse], [Chorus], [Bridge]`);
    }
    
    for (const [tag1, tag2, reason] of tagValidation.conflicts) {
      warnings.push(`⚠️ Конфликт тегов: [${tag1}] + [${tag2}] — ${reason}`);
    }
    
    for (const lineNum of tagValidation.overloadedLines) {
      warnings.push(`⚠️ Строка ${lineNum}: слишком много тегов (>3) — рекомендуется 1-2`);
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
      .replace(/\n{3,}/g, '\n\n')      // Clean excessive newlines
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
      .map(t => {
        if (t.format === 'compound') return `[${t.value}]`;
        return `${t.format === 'bracket' ? '[' : '('}${t.value}${t.format === 'bracket' ? ']' : ')'}`;
      })
      .join(' ');
    
    return {
      name: section.name,
      content: section.content,
      tagSummary,
    };
  }
  
  /**
   * Parse compound tag into parts
   */
  static parseCompoundTag(tag: string): string[] {
    const match = tag.match(/\[([^\]]+)\]/);
    if (!match) return [tag];
    
    return match[1].split('|').map(p => p.trim());
  }
  
  /**
   * Build compound tag from parts
   */
  static buildCompoundTag(parts: string[]): string {
    if (parts.length === 1) return `[${parts[0]}]`;
    return `[${parts.join(' | ')}]`;
  }
  
  /**
   * Validate a single line for Suno V5 compliance
   */
  static validateLine(line: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for Russian tags
    if (RUSSIAN_TAG_REGEX.test(line)) {
      issues.push('Используются русские теги — замени на английские');
    }
    
    // Check tag count
    const tagCount = (line.match(/\[[^\]]+\]/g) || []).length;
    if (tagCount > 3) {
      issues.push(`Слишком много тегов (${tagCount}) — максимум 2-3`);
    }
    
    // Check for conflicting patterns in same line
    const tags = (line.match(/\[([^\]]+)\]/g) || []).map(t => t.toLowerCase());
    for (const [t1, t2] of CONFLICTING_TAGS) {
      if (tags.some(t => t.includes(t1.toLowerCase())) && 
          tags.some(t => t.includes(t2.toLowerCase()))) {
        issues.push(`Конфликт: [${t1}] и [${t2}] несовместимы`);
      }
    }
    
    return { isValid: issues.length === 0, issues };
  }
}
