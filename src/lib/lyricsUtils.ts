/**
 * Lyrics Utility Functions
 * 
 * Common utilities for processing lyrics text, detecting structural tags,
 * and cleaning lyrics content.
 */

/**
 * List of structural tag patterns in various languages
 * These are section markers like [Verse 1], [Chorus], [Припев], etc.
 */
const STRUCTURAL_TAG_PATTERNS = [
  // English tags
  'verse', 'chorus', 'bridge', 'outro', 'intro', 'hook',
  'pre-chorus', 'prechorus', 'pre chorus',
  'post-chorus', 'postchorus', 'post chorus',
  'refrain', 'interlude', 'break', 'solo', 'instrumental',
  'ad-lib', 'adlib', 'coda', 'drop', 'build', 'breakdown',
  
  // Russian tags
  'куплет', 'припев', 'бридж', 'аутро', 'интро', 'хук',
  'пре-припев', 'препрпев', 'пре припев',
  'пост-припев', 'постприпев',
  'рефрен', 'интерлюдия', 'брейк', 'соло', 'инструментал',
  'вставка', 'кода', 'дроп', 'билд', 'брейкдаун',
];

/**
 * Check if a text is a structural tag (e.g., [Verse 1], [Chorus], etc.)
 * Handles tags with or without brackets and optional numbers
 */
export function isStructuralTag(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  const trimmed = text.trim();
  if (!trimmed) return false;
  
  // Remove brackets if present: [Tag] or (Tag) -> Tag
  let tagContent = trimmed;
  
  // Check for [Tag] or (Tag) format
  const bracketMatch = trimmed.match(/^[\[\(](.+?)[\]\)]$/);
  if (bracketMatch) {
    tagContent = bracketMatch[1].trim();
  }
  
  // Check for Tag: format (e.g., "Verse 1:")
  tagContent = tagContent.replace(/:$/, '').trim();
  
  // Remove optional number suffix (e.g., "Verse 1" -> "Verse")
  const tagBase = tagContent.replace(/\s*\d+\s*$/, '').trim().toLowerCase();
  
  // Check if it matches any known tag
  return STRUCTURAL_TAG_PATTERNS.some(pattern => 
    tagBase === pattern.toLowerCase() ||
    tagBase.replace(/[^a-zа-яё]/gi, '') === pattern.replace(/[^a-zа-яё]/gi, '')
  );
}

/**
 * Remove structural tags from lyrics text
 */
export function cleanLyricsText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  // Remove bracketed tags: [Verse 1], [Chorus], etc.
  let cleaned = text.replace(/\[([^\]]+)\]/g, (match, content) => {
    return isStructuralTag(`[${content}]`) ? '' : match;
  });
  
  // Remove parenthesized tags: (Verse 1), (Chorus), etc.
  cleaned = cleaned.replace(/\(([^)]+)\)/g, (match, content) => {
    return isStructuralTag(`(${content})`) ? '' : match;
  });
  
  // Clean up extra whitespace
  cleaned = cleaned
    .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
    .replace(/^\s+|\s+$/gm, '')   // Trim each line
    .trim();
  
  return cleaned;
}

/**
 * Filter out structural tag words from an array of aligned words
 */
export function filterStructuralTagWords<T extends { word: string }>(words: T[]): T[] {
  return words.filter(w => {
    const cleanWord = w.word.replace(/\n/g, '').trim();
    return cleanWord && !isStructuralTag(cleanWord);
  });
}

/**
 * Check if a word contains a line break
 */
export function hasLineBreak(word: string): boolean {
  return word.includes('\n');
}

/**
 * Split a word by line breaks and return parts with timing adjustment
 */
export function splitWordByLineBreaks<T extends { word: string; startS: number; endS: number }>(
  word: T
): T[] {
  const parts = word.word.split('\n');
  const duration = word.endS - word.startS;
  const partDuration = duration / parts.length;
  
  return parts.map((part, index) => ({
    ...word,
    word: part,
    startS: word.startS + index * partDuration,
    endS: word.startS + (index + 1) * partDuration,
  }));
}
