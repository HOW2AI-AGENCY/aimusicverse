/**
 * Advanced Text Processing for Telegram Bot
 * Handles MarkdownV2, HTML parsing, validation, and sanitization
 */

// ============================================================================
// MarkdownV2 Processing
// ============================================================================

/**
 * Enhanced MarkdownV2 escaping with comprehensive edge case handling
 */
export function escapeMarkdownV2(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  // Remove null bytes and control characters
  text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Escape backslashes first to prevent double escaping
  text = text.replace(/\\/g, '\\\\');
  
  // Escape all MarkdownV2 special characters
  // Order matters: do backslash first, then others
  const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  
  specialChars.forEach(char => {
    // Use a function to avoid issues with special regex characters
    const regex = new RegExp('\\' + char, 'g');
    text = text.replace(regex, '\\' + char);
  });
  
  return text;
}

/**
 * Escape text for use in pre-formatted code blocks
 */
export function escapeCodeBlock(text: string): string {
  if (!text) return '';
  
  // In code blocks, only backticks and backslashes need escaping
  return text
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`');
}

/**
 * Escape text for inline code
 */
export function escapeInlineCode(text: string): string {
  if (!text) return '';
  
  // For inline code, escape backticks and backslashes
  return text
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`');
}

/**
 * Strip all MarkdownV2 formatting
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\\([_*[\]()~`>#+\-=|{}.!\\])/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1');
}

/**
 * Check if text contains valid MarkdownV2
 */
export function isValidMarkdown(text: string): boolean {
  try {
    // Check for unescaped special characters
    const unescapedPattern = /(?<!\\)([_*[\]()~`>#+\-=|{}.!])/g;
    const matches = text.match(unescapedPattern);
    
    // If no unescaped chars, it's valid
    if (!matches) return true;
    
    // Check for balanced formatting
    const boldCount = (text.match(/(?<!\\)\*/g) || []).length;
    const italicCount = (text.match(/(?<!\\)_/g) || []).length;
    const codeCount = (text.match(/(?<!\\)`/g) || []).length;
    
    return boldCount % 2 === 0 && italicCount % 2 === 0 && codeCount % 2 === 0;
  } catch {
    return false;
  }
}

/**
 * Sanitize MarkdownV2 by fixing common issues
 */
export function sanitizeMarkdown(text: string): string {
  if (!text) return '';
  
  // Remove invalid Unicode
  text = text.replace(/[\uFFFD\uFFFE\uFFFF]/g, '');
  
  // Fix unbalanced bold markers
  const boldMatches = text.match(/\*\*/g);
  if (boldMatches && boldMatches.length % 2 !== 0) {
    text = text + '**'; // Close unclosed bold
  }
  
  // Fix unbalanced italic markers
  const italicMatches = text.match(/(?<!\\)_/g);
  if (italicMatches && italicMatches.length % 2 !== 0) {
    text = text + '_'; // Close unclosed italic
  }
  
  // Fix unbalanced code markers
  const codeMatches = text.match(/(?<!\\)`/g);
  if (codeMatches && codeMatches.length % 2 !== 0) {
    text = text + '`'; // Close unclosed code
  }
  
  return text;
}

// ============================================================================
// HTML Processing
// ============================================================================

/**
 * Convert HTML to MarkdownV2
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  
  let text = html;
  
  // Convert HTML tags to Markdown
  text = text.replace(/<b>(.+?)<\/b>/g, '*$1*');
  text = text.replace(/<strong>(.+?)<\/strong>/g, '*$1*');
  text = text.replace(/<i>(.+?)<\/i>/g, '_$1_');
  text = text.replace(/<em>(.+?)<\/em>/g, '_$1_');
  text = text.replace(/<code>(.+?)<\/code>/g, '`$1`');
  text = text.replace(/<pre>(.+?)<\/pre>/g, '```\n$1\n```');
  text = text.replace(/<s>(.+?)<\/s>/g, '~$1~');
  text = text.replace(/<u>(.+?)<\/u>/g, '__$1__');
  text = text.replace(/<a href="(.+?)">(.+?)<\/a>/g, '[$2]($1)');
  
  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  text = decodeHtmlEntities(text);
  
  // Escape for MarkdownV2
  return escapeMarkdownV2(text);
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™'
  };
  
  Object.entries(entities).forEach(([entity, char]) => {
    text = text.replace(new RegExp(entity, 'g'), char);
  });
  
  // Decode numeric entities
  text = text.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)));
  text = text.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  return text;
}

/**
 * Strip HTML tags
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/gi, ' ')
    .trim();
}

// ============================================================================
// Text Validation
// ============================================================================

/**
 * Check if text is safe (no malicious content)
 */
export function isSafeText(text: string): boolean {
  if (!text) return true;
  
  // Check for script injection
  if (/<script/i.test(text)) return false;
  
  // Check for excessive special characters (potential injection)
  const specialCharRatio = (text.match(/[<>{}[\]]/g) || []).length / text.length;
  if (specialCharRatio > 0.3) return false;
  
  // Check for null bytes
  if (/\x00/.test(text)) return false;
  
  return true;
}

/**
 * Validate text length for Telegram
 */
export function isValidLength(text: string, maxLength: number = 4096): boolean {
  return text.length <= maxLength;
}

/**
 * Check if text contains only allowed characters
 */
export function hasValidCharacters(text: string): boolean {
  // Allow most Unicode characters except control chars
  return !/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/.test(text);
}

// ============================================================================
// Text Transformation
// ============================================================================

/**
 * Truncate text intelligently
 */
export function smartTruncate(
  text: string,
  maxLength: number,
  options?: {
    ellipsis?: string;
    breakWords?: boolean;
    preserveMarkdown?: boolean;
  }
): string {
  const {
    ellipsis = '...',
    breakWords = false,
    preserveMarkdown = false
  } = options || {};
  
  if (text.length <= maxLength) {
    return text;
  }
  
  const cutLength = maxLength - ellipsis.length;
  
  if (breakWords) {
    return text.substring(0, cutLength) + ellipsis;
  }
  
  // Find last space, newline, or punctuation
  const breakChars = [' ', '\n', '.', ',', '!', '?', ';', ':'];
  let cutPoint = cutLength;
  
  for (let i = cutLength; i > cutLength / 2; i--) {
    if (breakChars.includes(text[i])) {
      cutPoint = i;
      break;
    }
  }
  
  let truncated = text.substring(0, cutPoint).trim() + ellipsis;
  
  // If preserving markdown, make sure tags are balanced
  if (preserveMarkdown) {
    truncated = sanitizeMarkdown(truncated);
  }
  
  return truncated;
}

/**
 * Split text into chunks for Telegram message limit
 */
export function splitIntoChunks(
  text: string,
  maxLength: number = 4000,
  options?: {
    preserveLines?: boolean;
    addContinuation?: boolean;
  }
): string[] {
  const { preserveLines = true, addContinuation = true } = options || {};
  
  const chunks: string[] = [];
  let remaining = text;
  let chunkIndex = 0;
  
  while (remaining.length > 0) {
    let chunkSize = maxLength;
    
    // Reserve space for continuation marker
    if (addContinuation && remaining.length > maxLength) {
      chunkSize -= 20; // " (продолжение...)"
    }
    
    if (remaining.length <= chunkSize) {
      chunks.push(remaining);
      break;
    }
    
    let splitPoint = chunkSize;
    
    if (preserveLines) {
      // Find last newline within limit
      const lastNewline = remaining.lastIndexOf('\n', chunkSize);
      if (lastNewline > chunkSize / 2) {
        splitPoint = lastNewline;
      } else {
        // Find last space
        const lastSpace = remaining.lastIndexOf(' ', chunkSize);
        if (lastSpace > chunkSize / 2) {
          splitPoint = lastSpace;
        }
      }
    }
    
    let chunk = remaining.substring(0, splitPoint).trim();
    
    if (addContinuation && remaining.length > splitPoint + 1) {
      chunk += '\n\n_(продолжение\\.\\.\\.    )_';
    }
    
    chunks.push(chunk);
    remaining = remaining.substring(splitPoint).trim();
    chunkIndex++;
    
    // Safety limit
    if (chunkIndex > 10) {
      chunks.push('...[текст слишком длинный]');
      break;
    }
  }
  
  return chunks;
}

/**
 * Add line numbers to text
 */
export function addLineNumbers(text: string, startFrom: number = 1): string {
  const lines = text.split('\n');
  return lines
    .map((line, index) => {
      const lineNum = (startFrom + index).toString().padStart(3, ' ');
      return `${lineNum} │ ${line}`;
    })
    .join('\n');
}

/**
 * Highlight text with MarkdownV2
 */
export function highlightText(
  text: string,
  query: string,
  style: 'bold' | 'italic' | 'code' = 'bold'
): string {
  if (!query) return text;
  
  const escaped = escapeMarkdownV2(text);
  const queryEscaped = escapeMarkdownV2(query);
  
  const markers = {
    bold: ['*', '*'],
    italic: ['_', '_'],
    code: ['`', '`']
  };
  
  const [start, end] = markers[style];
  
  // Case-insensitive highlight
  const regex = new RegExp(`(${queryEscaped})`, 'gi');
  return escaped.replace(regex, `${start}$1${end}`);
}

/**
 * Clean up whitespace
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\t/g, '  ') // Convert tabs to spaces
    .replace(/ +/g, ' ') // Multiple spaces to single
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .trim();
}

/**
 * Remove Suno-style tags from lyrics
 */
export function cleanSunoTags(text: string): string {
  return text
    .replace(/\[(?:Verse|Chorus|Bridge|Outro|Intro|Hook|Pre-Chorus|Post-Chorus|Instrumental|Break|Interlude|Refrain|End|Fade|Solo|Tag)[^\]]*\]/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Format list items
 */
export function formatList(
  items: string[],
  style: 'bullet' | 'numbered' | 'checkmark' = 'bullet'
): string {
  return items
    .map((item, index) => {
      let prefix = '';
      switch (style) {
        case 'numbered':
          prefix = `${index + 1}\\. `;
          break;
        case 'checkmark':
          prefix = '✓ ';
          break;
        default:
          prefix = '• ';
      }
      return `${prefix}${escapeMarkdownV2(item)}`;
    })
    .join('\n');
}

/**
 * Create a text table
 */
export function createTable(
  headers: string[],
  rows: string[][],
  options?: { alignNumbers?: boolean }
): string {
  const { alignNumbers = true } = options || {};
  
  // Calculate column widths
  const colWidths = headers.map((header, i) => {
    const maxRowWidth = Math.max(...rows.map(row => (row[i] || '').length));
    return Math.max(header.length, maxRowWidth);
  });
  
  // Create header
  const headerRow = headers
    .map((header, i) => header.padEnd(colWidths[i]))
    .join(' │ ');
  
  const separator = colWidths
    .map(width => '─'.repeat(width))
    .join('─┼─');
  
  // Create rows
  const dataRows = rows.map(row => 
    row
      .map((cell, i) => {
        const content = cell || '';
        // Right-align numbers if option is enabled
        if (alignNumbers && /^\d+$/.test(content)) {
          return content.padStart(colWidths[i]);
        }
        return content.padEnd(colWidths[i]);
      })
      .join(' │ ')
  );
  
  return `\`\`\`\n${headerRow}\n${separator}\n${dataRows.join('\n')}\n\`\`\``;
}
