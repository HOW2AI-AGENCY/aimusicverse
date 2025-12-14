/**
 * Input Sanitization and Validation
 * Prevents XSS, injection attacks, and validates user input
 */

export interface ValidationResult {
  valid: boolean;
  sanitized?: string;
  error?: string;
}

/**
 * Maximum lengths for different input types
 */
export const MAX_LENGTHS = {
  prompt: 500,
  title: 100,
  description: 1000,
  message: 4000, // Telegram max message length
  username: 50,
  tag: 30,
} as const;

/**
 * Sanitize text by removing dangerous HTML/JS patterns
 * @param text Input text
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  return text
    // Remove script tags
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    // Remove iframe tags
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove data: URIs (except images)
    .replace(/data:(?!image\/)/gi, '')
    // Trim whitespace
    .trim();
}

/**
 * Validate and sanitize a prompt for music generation
 * @param prompt User prompt
 * @returns Validation result
 */
export function validatePrompt(prompt: string): ValidationResult {
  if (!prompt || typeof prompt !== 'string') {
    return {
      valid: false,
      error: 'Промпт должен быть текстовой строкой',
    };
  }

  const sanitized = sanitizeText(prompt);

  if (sanitized.length === 0) {
    return {
      valid: false,
      error: 'Промпт не может быть пустым',
    };
  }

  if (sanitized.length < 3) {
    return {
      valid: false,
      error: 'Промпт слишком короткий (минимум 3 символа)',
    };
  }

  if (sanitized.length > MAX_LENGTHS.prompt) {
    return {
      valid: false,
      error: `Промпт слишком длинный (максимум ${MAX_LENGTHS.prompt} символов)`,
    };
  }

  // Check for spam patterns
  if (isSpamPattern(sanitized)) {
    return {
      valid: false,
      error: 'Обнаружен спам-паттерн',
    };
  }

  return {
    valid: true,
    sanitized,
  };
}

/**
 * Validate and sanitize a track title
 * @param title Track title
 * @returns Validation result
 */
export function validateTitle(title: string): ValidationResult {
  if (!title || typeof title !== 'string') {
    return {
      valid: false,
      error: 'Название должно быть текстовой строкой',
    };
  }

  const sanitized = sanitizeText(title);

  if (sanitized.length === 0) {
    return {
      valid: false,
      error: 'Название не может быть пустым',
    };
  }

  if (sanitized.length > MAX_LENGTHS.title) {
    return {
      valid: false,
      error: `Название слишком длинное (максимум ${MAX_LENGTHS.title} символов)`,
    };
  }

  return {
    valid: true,
    sanitized,
  };
}

/**
 * Validate and sanitize a description
 * @param description Description text
 * @returns Validation result
 */
export function validateDescription(description: string): ValidationResult {
  if (!description || typeof description !== 'string') {
    return {
      valid: false,
      error: 'Описание должно быть текстовой строкой',
    };
  }

  const sanitized = sanitizeText(description);

  if (sanitized.length > MAX_LENGTHS.description) {
    return {
      valid: false,
      error: `Описание слишком длинное (максимум ${MAX_LENGTHS.description} символов)`,
    };
  }

  return {
    valid: true,
    sanitized,
  };
}

/**
 * Validate and sanitize a message text
 * @param message Message text
 * @returns Validation result
 */
export function validateMessage(message: string): ValidationResult {
  if (!message || typeof message !== 'string') {
    return {
      valid: false,
      error: 'Сообщение должно быть текстовой строкой',
    };
  }

  const sanitized = sanitizeText(message);

  if (sanitized.length === 0) {
    return {
      valid: false,
      error: 'Сообщение не может быть пустым',
    };
  }

  if (sanitized.length > MAX_LENGTHS.message) {
    // Telegram max message length
    const truncated = sanitized.substring(0, MAX_LENGTHS.message);
    return {
      valid: true,
      sanitized: truncated,
    };
  }

  return {
    valid: true,
    sanitized,
  };
}

/**
 * Check if text contains spam patterns
 * @param text Text to check
 * @returns True if spam detected
 */
function isSpamPattern(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Repeated characters (e.g., "aaaaaaa")
  if (/(.)\1{10,}/.test(text)) {
    return true;
  }

  // Too many URLs
  const urlCount = (text.match(/https?:\/\//gi) || []).length;
  if (urlCount > 3) {
    return true;
  }

  // Common spam keywords
  const spamKeywords = [
    'click here',
    'buy now',
    'limited time',
    'act now',
    'free money',
    'make money fast',
  ];

  const hasSpamKeyword = spamKeywords.some(keyword =>
    lowerText.includes(keyword)
  );

  if (hasSpamKeyword) {
    return true;
  }

  return false;
}

/**
 * Sanitize HTML tags from text (allow only safe tags)
 * @param html HTML text
 * @returns Sanitized HTML
 */
export function sanitizeHTML(html: string): string {
  // Allowed tags for Telegram HTML mode
  const allowedTags = ['b', 'i', 'u', 's', 'code', 'pre', 'a'];

  // Remove all tags except allowed ones
  let sanitized = html;

  // Remove dangerous tags first
  sanitized = sanitized
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<applet[^>]*>.*?<\/applet>/gi, '');

  // Remove onclick and other event handlers from all tags
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: from href
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');

  return sanitized;
}

/**
 * Mask sensitive data for logging
 * @param text Text containing sensitive data
 * @returns Masked text
 */
export function maskSensitiveData(text: string): string {
  return text
    // Mask email addresses
    .replace(/([a-zA-Z0-9._%+-]+@)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '$1***')
    // Mask phone numbers
    .replace(/\+?[\d\s()-]{10,}/g, '+***')
    // Mask credit card numbers
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '****-****-****-****')
    // Mask tokens (long alphanumeric strings)
    .replace(/\b[A-Za-z0-9]{32,}\b/g, '***TOKEN***');
}

/**
 * Validate Telegram user ID
 * @param userId User ID
 * @returns True if valid
 */
export function isValidTelegramUserId(userId: number): boolean {
  return userId > 0 && userId < 9223372036854775807; // Max bigint
}

/**
 * Validate URL
 * @param url URL to validate
 * @returns True if valid
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Escape special characters for SQL LIKE queries
 * @param text Text to escape
 * @returns Escaped text
 */
export function escapeSQLLike(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}
