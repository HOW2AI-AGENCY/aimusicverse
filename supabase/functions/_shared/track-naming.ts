/**
 * Track naming utilities for sanitizing and cleaning track titles
 * Removes noise words, tags, and patterns that shouldn't appear in titles
 */

// Noise words to remove from titles (case-insensitive)
const NOISE_WORDS_RU = [
  'трек', 'новый трек', 'мой трек',
  'кавер', 'новый кавер', 'мой кавер',
  'запись', 'новая запись', 'моя запись',
  'инструментал', 'запись инструментала',
  'вокал', 'запись вокала',
  'аудио', 'новое аудио', 'моё аудио',
  'песня', 'новая песня', 'моя песня',
  'музыка', 'новая музыка', 'моя музыка',
  'ремикс', 'новый ремикс',
  'расширение', 'продолжение',
];

const NOISE_WORDS_EN = [
  'track', 'new track', 'my track',
  'cover', 'new cover', 'my cover', 'covered audio',
  'recording', 'new recording', 'my recording',
  'instrumental', 'instrumental recording',
  'vocal', 'vocal recording',
  'audio', 'new audio', 'my audio',
  'song', 'new song', 'my song',
  'music', 'new music', 'my music',
  'remix', 'new remix',
  'extended', 'extended audio', 'audio extension',
  'extension', 'continuation',
];

const ALL_NOISE_WORDS = [...NOISE_WORDS_RU, ...NOISE_WORDS_EN];

// Patterns to remove from titles
const PATTERNS_TO_REMOVE = [
  /\[.*?\]/g,           // [Verse], [Chorus], [Intro], [Outro], etc.
  /\(.*?\)/g,           // (Upbeat), (Soft), (Energetic), etc.
  /\{.*?\}/g,           // {tag}, {marker}
  /<.*?>/g,             // <marker>, <section>
  /【.*?】/g,           // Japanese-style brackets
  /「.*?」/g,           // Japanese quotes
  /[-–—]\s*$/g,         // Trailing dashes
  /^\s*[-–—]/g,         // Leading dashes
  /\s*[-–—]\s*[-–—]\s*/g, // Double dashes
  /\s+/g,               // Multiple spaces -> single space
];

// Genre/style tags that shouldn't be in titles
const GENRE_TAGS = [
  'pop', 'rock', 'jazz', 'blues', 'hip-hop', 'rap', 'edm', 'electronic',
  'classical', 'ambient', 'lofi', 'lo-fi', 'chill', 'upbeat', 'energetic',
  'sad', 'happy', 'melancholic', 'aggressive', 'soft', 'loud',
  'поп', 'рок', 'джаз', 'блюз', 'хип-хоп', 'рэп', 'электроника',
  'классика', 'эмбиент', 'лофай', 'чилл', 'грустный', 'весёлый',
];

/**
 * Remove noise words from a title
 */
function removeNoiseWords(title: string): string {
  let result = title;
  
  // Sort by length descending to remove longer phrases first
  const sortedNoiseWords = [...ALL_NOISE_WORDS].sort((a, b) => b.length - a.length);
  
  for (const word of sortedNoiseWords) {
    // Create case-insensitive regex with word boundaries
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
    result = result.replace(regex, ' ');
  }
  
  return result;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Apply all cleanup patterns to a title
 */
function applyPatterns(title: string): string {
  let result = title;
  
  for (const pattern of PATTERNS_TO_REMOVE) {
    result = result.replace(pattern, ' ');
  }
  
  // Normalize whitespace
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}

/**
 * Remove standalone genre tags (only if they're the entire title)
 */
function cleanGenreTags(title: string): string {
  const normalized = title.toLowerCase().trim();
  
  for (const tag of GENRE_TAGS) {
    if (normalized === tag || normalized === `${tag} track` || normalized === `${tag} song`) {
      return '';
    }
  }
  
  return title;
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeTitle(title: string): string {
  return title
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Sanitize and clean a track title
 * Removes noise words, tags, and patterns
 * 
 * @param rawTitle - The raw title from Suno or user input
 * @param fallback - Fallback title if result is empty (default: undefined for builder to handle)
 * @returns Cleaned title
 */
export function sanitizeAndCleanTitle(rawTitle: string, fallback?: string): string {
  if (!rawTitle) return fallback || '';
  
  let result = rawTitle;
  
  // 1. Apply patterns (remove [Verse], (Upbeat), etc.)
  result = applyPatterns(result);
  
  // 2. Remove noise words
  result = removeNoiseWords(result);
  
  // 3. Clean genre tags if they're the entire title
  result = cleanGenreTags(result);
  
  // 4. Final cleanup
  result = result.replace(/\s+/g, ' ').trim();
  
  // 5. Remove leading/trailing punctuation
  result = result.replace(/^[,.\-–—:;'"!?]+\s*/, '');
  result = result.replace(/\s*[,.\-–—:;'"!?]+$/, '');
  
  // 6. Final trim
  result = result.trim();
  
  return result || (fallback || '');
}

/**
 * Extract a usable title from a filename
 * 
 * @param fileName - The original filename
 * @returns Extracted title
 */
export function extractTitleFromFileName(fileName: string): string {
  if (!fileName) return '';
  
  // Remove extension
  const withoutExt = fileName.replace(/\.(mp3|wav|m4a|ogg|flac|aac|wma|aiff)$/i, '');
  
  // Replace underscores and dashes with spaces
  let result = withoutExt.replace(/[-_]/g, ' ');
  
  // Remove common file naming patterns
  result = result.replace(/^\d+[\s._-]*/g, ''); // Leading track numbers
  result = result.replace(/\s*\(\d+\)\s*$/g, ''); // Trailing (1), (2), etc.
  result = result.replace(/\s*\[\d+\]\s*$/g, ''); // Trailing [1], [2], etc.
  result = result.replace(/\s*-\s*\d+\s*$/g, ''); // Trailing - 1, - 2, etc.
  
  // Clean up
  result = sanitizeAndCleanTitle(result);
  
  // Capitalize
  if (result) {
    result = capitalizeTitle(result);
  }
  
  return result;
}

/**
 * Sanitize a string for use as a filename
 * 
 * @param name - The string to sanitize
 * @returns Safe filename
 */
export function sanitizeForFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename chars
    .replace(/\s+/g, '_')         // Spaces to underscores
    .replace(/_+/g, '_')          // Multiple underscores to single
    .replace(/^_|_$/g, '')        // Remove leading/trailing underscores
    .substring(0, 60);            // Limit length
}

/**
 * Sanitize a string for Telegram display
 * Escapes Markdown special characters
 * 
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeForTelegram(text: string): string {
  if (!text) return '';
  
  // Escape Markdown special characters
  return text
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/`/g, '\\`')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

/**
 * Generate a smart fallback title based on context
 */
export function generateFallbackTitle(context: {
  mode?: 'generate' | 'cover' | 'extend' | 'stems' | 'remix';
  style?: string;
  hasVocals?: boolean;
  timestamp?: Date;
}): string {
  const { mode, style, hasVocals, timestamp } = context;
  const date = timestamp || new Date();
  const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  
  // Try to use style for title
  if (style) {
    const styleWords = style.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    if (styleWords.length > 0) {
      const firstStyle = capitalizeTitle(styleWords[0].slice(0, 30));
      if (firstStyle && !ALL_NOISE_WORDS.some(w => firstStyle.toLowerCase() === w)) {
        return firstStyle;
      }
    }
  }
  
  // Mode-based fallbacks
  const modeTitles: Record<string, string> = {
    generate: hasVocals ? 'Новая песня' : 'Новая мелодия',
    cover: 'Кавер-версия',
    extend: 'Продолжение',
    stems: 'Стемы',
    remix: 'Ремикс',
  };
  
  const modeTitle = mode ? modeTitles[mode] : 'Трек';
  
  return `${modeTitle} ${dateStr}`;
}
