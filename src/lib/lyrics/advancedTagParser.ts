/**
 * Advanced Tag Parser for Lyrics
 * 
 * Handles edge cases:
 * - [TAG]Word (tag immediately followed by content)
 * - Nested tags [[tag]]
 * - Russian and English tags mixed
 * - Compound tags [Tag1, Tag2]
 * - Timed tags [Solo: 8s]
 */

export interface ParsedTag {
  raw: string;           // Original text including brackets
  value: string;         // Content inside brackets
  type: 'structural' | 'vocal' | 'dynamic' | 'instrumental' | 'emotional' | 'timing' | 'unknown';
  format: 'bracket' | 'parenthesis';
  startIndex: number;    // Position in original text
  endIndex: number;
  isCompound: boolean;   // Has multiple values like [Tag1, Tag2]
  values?: string[];     // If compound
  durationMs?: number;   // For timed tags like [Solo: 8s]
}

export interface ParsedLine {
  original: string;
  cleanText: string;         // Text without any tags
  structuralTag?: ParsedTag; // Section tag at start of line
  inlineTags: ParsedTag[];   // Tags within content
  contentAfterTag: string;   // For cases like [Verse]Word
}

// Structural section tags in English and Russian
const STRUCTURAL_PATTERNS = [
  // English
  'verse', 'chorus', 'bridge', 'outro', 'intro', 'hook',
  'pre-chorus', 'prechorus', 'pre chorus',
  'post-chorus', 'postchorus', 'post chorus',
  'refrain', 'interlude', 'break', 'solo', 'instrumental',
  'ad-lib', 'adlib', 'coda', 'drop', 'build', 'breakdown',
  
  // Russian
  'куплет', 'припев', 'бридж', 'аутро', 'интро', 'хук',
  'пре-припев', 'препрпев', 'пре припев',
  'пост-припев', 'постприпев',
  'рефрен', 'интерлюдия', 'брейк', 'соло', 'инструментал',
  'вставка', 'кода', 'дроп', 'билд', 'брейкдаун',
];

const VOCAL_PATTERNS = [
  'whisper', 'powerful', 'falsetto', 'raspy', 'breathy', 'belting',
  'harmony', 'spoken', 'ad-lib', 'gentle', 'soulful', 'smooth', 'raw',
  'шёпот', 'мощный', 'фальцет', 'хриплый', 'нежный',
];

const DYNAMIC_PATTERNS = [
  'build', 'drop', 'breakdown', 'crescendo', 'fade', 'climax',
  'soft', 'explosive', 'atmospheric', 'нарастание', 'спад',
];

const INSTRUMENT_PATTERNS = [
  'piano', 'guitar', 'drums', 'bass', 'synth', 'strings',
  'violin', 'orchestra', 'a cappella', 'acoustic', 'electric',
  'пианино', 'гитара', 'барабаны', 'бас', 'синт', 'струнные',
];

// Regex for extracting timed durations
const TIMED_PATTERN = /(\d+(?:\.\d+)?)\s*s(?:ec(?:onds?)?)?/i;

/**
 * Check if a tag value is structural
 */
export function isStructuralTagValue(value: string): boolean {
  const lower = value.toLowerCase().trim();
  // Remove number suffixes: "Verse 1" -> "Verse"
  const base = lower.replace(/\s*\d+\s*$/, '').trim();
  
  return STRUCTURAL_PATTERNS.some(p => 
    base === p.toLowerCase() ||
    base.replace(/[^a-zа-яё]/gi, '') === p.replace(/[^a-zа-яё]/gi, '')
  );
}

/**
 * Detect tag type from content
 */
export function detectTagType(value: string, format: 'bracket' | 'parenthesis'): ParsedTag['type'] {
  const lower = value.toLowerCase().trim();
  
  // Check for timing first
  if (TIMED_PATTERN.test(value)) {
    return 'timing';
  }
  
  // Check structural
  if (isStructuralTagValue(value)) {
    return 'structural';
  }
  
  // Check vocal
  if (VOCAL_PATTERNS.some(p => lower.includes(p.toLowerCase()))) {
    return 'vocal';
  }
  
  // Check dynamic
  if (DYNAMIC_PATTERNS.some(p => lower.includes(p.toLowerCase()))) {
    return 'dynamic';
  }
  
  // Check instrumental
  if (INSTRUMENT_PATTERNS.some(p => lower.includes(p.toLowerCase()))) {
    return 'instrumental';
  }
  
  // Parenthesis tags default to emotional
  if (format === 'parenthesis') {
    return 'emotional';
  }
  
  return 'unknown';
}

/**
 * Extract duration from timed tag
 */
export function extractTimingDuration(value: string): number | undefined {
  const match = value.match(TIMED_PATTERN);
  if (match) {
    return parseFloat(match[1]) * 1000; // Convert to ms
  }
  return undefined;
}

/**
 * Parse a single tag string
 */
export function parseTag(
  raw: string, 
  format: 'bracket' | 'parenthesis',
  startIndex: number
): ParsedTag {
  // Extract inner content
  const inner = format === 'bracket' 
    ? raw.slice(1, -1) 
    : raw.slice(1, -1);
  
  // Check for compound tags [Tag1, Tag2]
  const parts = inner.split(/,\s*/).map(p => p.trim()).filter(Boolean);
  const isCompound = parts.length > 1;
  
  // First part might be structural, rest are modifiers
  const primaryValue = parts[0];
  const type = detectTagType(primaryValue, format);
  
  return {
    raw,
    value: inner,
    type,
    format,
    startIndex,
    endIndex: startIndex + raw.length,
    isCompound,
    values: isCompound ? parts : undefined,
    durationMs: extractTimingDuration(inner),
  };
}

/**
 * Parse all tags from a line
 */
export function parseLine(line: string): ParsedLine {
  const result: ParsedLine = {
    original: line,
    cleanText: line,
    inlineTags: [],
    contentAfterTag: '',
  };
  
  if (!line.trim()) return result;
  
  // Pattern to match tags at start: [Tag] or [Tag, Modifier]
  // Also captures content immediately after: [Tag]Word
  const startTagPattern = /^\s*\[([^\]]+)\]/;
  const startMatch = line.match(startTagPattern);
  
  if (startMatch) {
    const tagRaw = startMatch[0].trim();
    const tagContent = startMatch[1];
    const tagEndIndex = startMatch.index! + startMatch[0].length;
    
    // Check if this is a structural tag
    // For compound tags like [Verse, Powerful], check first part
    const firstPart = tagContent.split(',')[0].trim();
    
    if (isStructuralTagValue(firstPart)) {
      result.structuralTag = parseTag(`[${tagContent}]`, 'bracket', startMatch.index!);
      
      // Get content after the tag
      const afterTag = line.slice(tagEndIndex).trim();
      if (afterTag) {
        result.contentAfterTag = afterTag;
        result.cleanText = afterTag;
      } else {
        result.cleanText = '';
      }
    }
  }
  
  // Find all inline bracket tags [tag]
  const bracketPattern = /\[([^\]]+)\]/g;
  let match;
  let cleanParts: string[] = [];
  let lastIndex = 0;
  
  // If we have a structural tag, start after it
  if (result.structuralTag) {
    lastIndex = result.structuralTag.endIndex;
  }
  
  while ((match = bracketPattern.exec(line)) !== null) {
    // Skip if this is the structural tag we already processed
    if (result.structuralTag && match.index === result.structuralTag.startIndex) {
      continue;
    }
    
    // Add text before this tag
    if (match.index > lastIndex) {
      cleanParts.push(line.slice(lastIndex, match.index));
    }
    
    const tag = parseTag(match[0], 'bracket', match.index);
    if (tag.type !== 'structural') {
      result.inlineTags.push(tag);
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Find all inline parenthesis tags (tag)
  const parenPattern = /\(([^)]+)\)/g;
  while ((match = parenPattern.exec(line)) !== null) {
    const tag = parseTag(match[0], 'parenthesis', match.index);
    result.inlineTags.push(tag);
  }
  
  // Add remaining text
  if (lastIndex < line.length) {
    cleanParts.push(line.slice(lastIndex));
  }
  
  // Build clean text (without inline tags)
  if (!result.structuralTag) {
    // Remove all tags from the line
    result.cleanText = line
      .replace(/\[([^\]]+)\]/g, '')
      .replace(/\(([^)]+)\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  } else if (result.contentAfterTag) {
    // Clean the content after structural tag
    result.cleanText = result.contentAfterTag
      .replace(/\[([^\]]+)\]/g, '')
      .replace(/\(([^)]+)\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  return result;
}

/**
 * Parse complete lyrics into structured sections with precise tag handling
 */
export interface ParsedSection {
  name: string;
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'pre-chorus' | 'hook' | 'other';
  rawContent: string;
  cleanContent: string;
  tags: ParsedTag[];
  startLine: number;
  endLine: number;
}

export function parseFullLyrics(lyrics: string): {
  sections: ParsedSection[];
  globalTags: ParsedTag[];
} {
  if (!lyrics?.trim()) {
    return { sections: [], globalTags: [] };
  }
  
  const lines = lyrics.split('\n');
  const sections: ParsedSection[] = [];
  const globalTags: ParsedTag[] = [];
  let currentSection: ParsedSection | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const parsedLine = parseLine(lines[i]);
    
    if (parsedLine.structuralTag) {
      // Save previous section
      if (currentSection) {
        currentSection.endLine = i;
        sections.push(currentSection);
      }
      
      // Extract section type from tag value
      const tagValue = parsedLine.structuralTag.values?.[0] || parsedLine.structuralTag.value;
      const sectionType = getSectionType(tagValue);
      
      currentSection = {
        name: tagValue,
        type: sectionType,
        rawContent: parsedLine.contentAfterTag,
        cleanContent: parsedLine.cleanText,
        tags: [...parsedLine.inlineTags],
        startLine: i + 1,
        endLine: i + 1,
      };
      
      // Add compound modifiers as tags
      if (parsedLine.structuralTag.isCompound && parsedLine.structuralTag.values) {
        for (let j = 1; j < parsedLine.structuralTag.values.length; j++) {
          globalTags.push({
            raw: `[${parsedLine.structuralTag.values[j]}]`,
            value: parsedLine.structuralTag.values[j],
            type: detectTagType(parsedLine.structuralTag.values[j], 'bracket'),
            format: 'bracket',
            startIndex: 0,
            endIndex: 0,
            isCompound: false,
          });
        }
      }
    } else if (currentSection) {
      // Add to current section
      if (lines[i].trim()) {
        currentSection.rawContent += (currentSection.rawContent ? '\n' : '') + lines[i];
        currentSection.cleanContent += (currentSection.cleanContent ? '\n' : '') + parsedLine.cleanText;
        currentSection.tags.push(...parsedLine.inlineTags);
      }
    } else {
      // Content before any section - treat as global
      parsedLine.inlineTags.forEach(t => globalTags.push(t));
    }
  }
  
  // Save last section
  if (currentSection) {
    currentSection.endLine = lines.length;
    sections.push(currentSection);
  }
  
  return { sections, globalTags };
}

function getSectionType(name: string): ParsedSection['type'] {
  const lower = name.toLowerCase().trim();
  
  if (/verse|куплет/i.test(lower)) return 'verse';
  if (/chorus|припев|refrain|рефрен/i.test(lower)) return 'chorus';
  if (/bridge|бридж/i.test(lower)) return 'bridge';
  if (/intro|интро/i.test(lower)) return 'intro';
  if (/outro|аутро|концовка/i.test(lower)) return 'outro';
  if (/pre-?chorus|пре-?припев/i.test(lower)) return 'pre-chorus';
  if (/hook|хук/i.test(lower)) return 'hook';
  
  return 'other';
}

/**
 * Check if a word from aligned words is a structural tag
 * Handles cases where tag is joined with content
 */
export function extractTagFromWord(word: string): {
  isTag: boolean;
  tag?: string;
  remainingText?: string;
} {
  const trimmed = word.trim();
  
  // Full tag: [Verse] or (Verse)
  const fullTagMatch = trimmed.match(/^[\[\(]([^\]\)]+)[\]\)]$/);
  if (fullTagMatch && isStructuralTagValue(fullTagMatch[1])) {
    return { isTag: true, tag: fullTagMatch[1] };
  }
  
  // Tag at start with content: [Verse]Hello
  const startTagMatch = trimmed.match(/^[\[\(]([^\]\)]+)[\]\)](.+)$/);
  if (startTagMatch && isStructuralTagValue(startTagMatch[1])) {
    return { 
      isTag: true, 
      tag: startTagMatch[1], 
      remainingText: startTagMatch[2].trim() 
    };
  }
  
  // Tag at end with content: Hello[Tag]
  const endTagMatch = trimmed.match(/^(.+)[\[\(]([^\]\)]+)[\]\)]$/);
  if (endTagMatch) {
    return { 
      isTag: false, 
      remainingText: endTagMatch[1].trim() 
    };
  }
  
  return { isTag: false };
}
