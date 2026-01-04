// Content Moderation Utilities - Sprint 011 Task T017
// Profanity filter, spam detection, and rate limiting

import type { Mention } from '@/types/comment';

// Common profanity words (basic list - should be expanded in production)
const PROFANITY_LIST = [
  'spam', 'scam', 'porn', 'xxx', 'drugs', 'viagra',
  // Add more as needed - this is just a basic example
];

// Spam patterns
const SPAM_PATTERNS = [
  /http[s]?:\/\/[^\s]+/gi, // Multiple URLs
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
  /[A-Z]{10,}/g, // Excessive caps
  /(.)\1{5,}/g, // Repeated characters
];

interface RateLimitConfig {
  maxCommentsPerMinute: number;
  maxFollowsPerHour: number;
  maxLikesPerMinute: number;
}

const RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxCommentsPerMinute: 10,
  maxFollowsPerHour: 30,
  maxLikesPerMinute: 20,
};

/**
 * Check if content contains profanity
 */
export function containsProfanity(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return PROFANITY_LIST.some(word => lowerContent.includes(word));
}

/**
 * Check if content appears to be spam
 */
export function isSpam(content: string): boolean {
  // Check for spam patterns
  let spamScore = 0;

  // Multiple URLs
  const urlMatches = content.match(SPAM_PATTERNS[0]);
  if (urlMatches && urlMatches.length > 2) spamScore += 2;

  // Phone numbers
  if (SPAM_PATTERNS[1].test(content)) spamScore += 2;

  // Excessive caps (>50% of text)
  const capsCount = (content.match(/[A-Z]/g) || []).length;
  const totalLetters = (content.match(/[A-Za-z]/g) || []).length;
  if (totalLetters > 10 && capsCount / totalLetters > 0.5) spamScore += 1;

  // Repeated characters
  if (SPAM_PATTERNS[3].test(content)) spamScore += 1;

  // Very short comments with URLs
  if (content.length < 20 && urlMatches && urlMatches.length > 0) spamScore += 2;

  return spamScore >= 3;
}

/**
 * Validate comment content
 */
export function validateCommentContent(content: string): {
  valid: boolean;
  reason?: string;
} {
  // Check length
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return { valid: false, reason: 'Comment cannot be empty' };
  }

  if (trimmed.length > 2000) {
    return { valid: false, reason: 'Comment is too long (max 2000 characters)' };
  }

  // Check for profanity
  if (containsProfanity(trimmed)) {
    return { valid: false, reason: 'Comment contains inappropriate language' };
  }

  // Check for spam
  if (isSpam(trimmed)) {
    return { valid: false, reason: 'Comment appears to be spam' };
  }

  return { valid: true };
}

/**
 * Rate limit checker for comments
 * Returns true if rate limit is exceeded
 */
export function isCommentRateLimitExceeded(
  recentCommentTimestamps: Date[]
): boolean {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const recentComments = recentCommentTimestamps.filter(
    ts => ts > oneMinuteAgo
  );
  return recentComments.length >= RATE_LIMIT_CONFIG.maxCommentsPerMinute;
}

/**
 * Rate limit checker for follows
 * Returns true if rate limit is exceeded
 */
export function isFollowRateLimitExceeded(
  recentFollowTimestamps: Date[]
): boolean {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentFollows = recentFollowTimestamps.filter(ts => ts > oneHourAgo);
  return recentFollows.length >= RATE_LIMIT_CONFIG.maxFollowsPerHour;
}

/**
 * Rate limit checker for likes
 * Returns true if rate limit is exceeded
 */
export function isLikeRateLimitExceeded(
  recentLikeTimestamps: Date[]
): boolean {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const recentLikes = recentLikeTimestamps.filter(ts => ts > oneMinuteAgo);
  return recentLikes.length >= RATE_LIMIT_CONFIG.maxLikesPerMinute;
}

/**
 * Sanitize user-generated content
 * Removes/escapes potentially harmful content
 */
export function sanitizeContent(content: string): string {
  return content
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

/**
 * Format content with mentions highlighted
 */
export function formatContentWithMentions(
  content: string,
  mentions: Mention[]
): string {
  if (!mentions || mentions.length === 0) return content;

  let formatted = content;
  // Sort mentions by start index in reverse to avoid index shifting
  const sortedMentions = [...mentions].sort(
    (a, b) => b.startIndex - a.startIndex
  );

  sortedMentions.forEach(mention => {
    const before = formatted.substring(0, mention.startIndex);
    const mentionText = formatted.substring(
      mention.startIndex,
      mention.endIndex
    );
    const after = formatted.substring(mention.endIndex);
    formatted = `${before}<span class="mention" data-user-id="${mention.userId}">${mentionText}</span>${after}`;
  });

  return formatted;
}

export { RATE_LIMIT_CONFIG };
