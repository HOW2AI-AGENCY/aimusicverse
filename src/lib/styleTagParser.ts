/**
 * Advanced style/tag parser for music tracks
 * 
 * Handles multiple separators: , / . ; | •
 * Extracts tags from square brackets [Tag] and [Key: Value]
 * Categorizes tags by type (genre, mood, vocal, tempo, instrument)
 */

export type TagCategory = 'genre' | 'mood' | 'vocal' | 'tempo' | 'instrument' | 'structure';

export interface ParsedStyleTag {
  value: string;           // Original value (display)
  normalized: string;      // Normalized (lowercase, trimmed) for matching
  category: TagCategory;
}

// Keywords for category detection
const MOOD_PATTERNS = /\b(melanchol|happy|sad|dark|bright|aggressive|calm|dreamy|atmospheric|energetic|chill|upbeat|mellow|intense|romantic|nostalgic|epic|ethereal|groovy|funky|angry|peaceful|mysterious|playful|somber|triumphant)\b/i;
const VOCAL_PATTERNS = /\b(vocal|rap|sing|voice|female|male|choir|acapella|harmony|soprano|tenor|bass|alto|falsetto|whisper|scream|growl)\b/i;
const TEMPO_PATTERNS = /\b(slow|fast|medium|tempo|bpm|uptempo|downtempo|moderate|quick|rapid|leisurely)\b/i;
const INSTRUMENT_PATTERNS = /\b(piano|guitar|drum|bass|synth|string|orchestra|violin|cello|brass|horn|flute|sax|organ|harp|percussion|808|beat|pad|arpeggio|lead|pluck)\b/i;
const STRUCTURE_PATTERNS = /\b(intro|verse|chorus|bridge|outro|drop|breakdown|build|hook|pre-chorus|interlude|solo|refrain)\b/i;

/**
 * Detects the category of a tag based on keywords
 */
function detectCategory(tag: string): TagCategory {
  const lower = tag.toLowerCase();
  
  if (STRUCTURE_PATTERNS.test(lower)) return 'structure';
  if (MOOD_PATTERNS.test(lower)) return 'mood';
  if (VOCAL_PATTERNS.test(lower)) return 'vocal';
  if (TEMPO_PATTERNS.test(lower)) return 'tempo';
  if (INSTRUMENT_PATTERNS.test(lower)) return 'instrument';
  
  return 'genre';
}

/**
 * Cleans and normalizes a tag string
 */
function cleanTag(tag: string): string {
  return tag
    .trim()
    .replace(/^[-–—•·]+/, '') // Remove leading dashes/bullets
    .replace(/[-–—•·]+$/, '') // Remove trailing dashes/bullets
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim();
}

/**
 * Checks if a tag is valid (not empty, not too short/long, not garbage)
 */
function isValidTag(tag: string): boolean {
  const cleaned = cleanTag(tag);
  
  // Length check
  if (cleaned.length < 2 || cleaned.length > 50) return false;
  
  // Skip pure numbers
  if (/^\d+$/.test(cleaned)) return false;
  
  // Skip common garbage
  const garbage = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  if (garbage.includes(cleaned.toLowerCase())) return false;
  
  return true;
}

/**
 * Parses tags from style and tags fields
 * 
 * @param input - Style string, tags array/string, or combined input
 * @returns Array of parsed and categorized tags
 */
export function parseStyleTags(input: string | string[] | null | undefined): ParsedStyleTag[] {
  if (!input) return [];
  
  // Convert array to string
  const inputStr = Array.isArray(input) ? input.join(', ') : input;
  
  if (!inputStr.trim()) return [];
  
  const tags: ParsedStyleTag[] = [];
  const seenNormalized = new Set<string>();
  
  const addTag = (value: string) => {
    const cleaned = cleanTag(value);
    if (!isValidTag(cleaned)) return;
    
    const normalized = cleaned.toLowerCase();
    if (seenNormalized.has(normalized)) return;
    
    seenNormalized.add(normalized);
    tags.push({
      value: cleaned,
      normalized,
      category: detectCategory(cleaned)
    });
  };
  
  let remainingInput = inputStr;
  
  // 1. Extract tags from square brackets [Tag] or [Key: Value]
  const bracketMatches = remainingInput.match(/\[([^\]]+)\]/g);
  if (bracketMatches) {
    for (const match of bracketMatches) {
      const inner = match.slice(1, -1).trim();
      
      // Handle [Key: Value] format
      if (inner.includes(':')) {
        const colonIndex = inner.indexOf(':');
        const value = inner.slice(colonIndex + 1).trim();
        if (value) addTag(value);
      } else {
        addTag(inner);
      }
    }
    // Remove brackets from input for further parsing
    remainingInput = remainingInput.replace(/\[([^\]]+)\]/g, ' ');
  }
  
  // 2. Split by common separators: , / . ; | • – —
  const parts = remainingInput
    .split(/[,\/\.;|•–—]+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  for (const part of parts) {
    // Handle multiple words that might be separate tags
    // E.g., "Hip Hop Trap 808" should be parsed carefully
    
    // First, try the whole part as a tag
    addTag(part);
    
    // If it's a known multi-word genre, don't split further
    const knownMultiWord = [
      'hip hop', 'trip hop', 'lo-fi', 'lo fi', 'hi-fi', 'r&b', 'rnb',
      'drum and bass', 'drum & bass', 'dnb', 'd&b',
      'deep house', 'tech house', 'future bass', 'future house',
      'hard rock', 'soft rock', 'alt rock', 'indie rock',
      'death metal', 'black metal', 'heavy metal', 'thrash metal',
      'neo soul', 'nu metal', 'new wave', 'new age',
      'big room', 'big beat', 'trap soul', 'dark trap',
      'boom bap', 'old school', 'new school'
    ];
    
    const lowerPart = part.toLowerCase();
    const isKnownMultiWord = knownMultiWord.some(m => lowerPart.includes(m));
    
    // For longer strings that aren't known multi-word, try splitting by space
    if (!isKnownMultiWord && part.includes(' ') && part.length > 20) {
      const words = part.split(/\s+/);
      for (const word of words) {
        if (word.length >= 3) addTag(word);
      }
    }
  }
  
  return tags.slice(0, 10); // Max 10 tags
}

/**
 * Combines style and tags fields and parses them
 */
export function parseTrackTags(style?: string | null, tags?: string | string[] | null): ParsedStyleTag[] {
  const inputs: string[] = [];
  
  if (style) inputs.push(style);
  if (tags) {
    if (Array.isArray(tags)) {
      inputs.push(...tags);
    } else {
      inputs.push(tags);
    }
  }
  
  return parseStyleTags(inputs.join(', '));
}

/**
 * Gets display-ready tags for a track
 * Limits to specified count and adds "+N" indicator
 */
export function getDisplayTags(
  style?: string | null, 
  tags?: string | string[] | null, 
  maxCount: number = 3
): { visible: ParsedStyleTag[]; hiddenCount: number } {
  const allTags = parseTrackTags(style, tags);
  
  return {
    visible: allTags.slice(0, maxCount),
    hiddenCount: Math.max(0, allTags.length - maxCount)
  };
}
