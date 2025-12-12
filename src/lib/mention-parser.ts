// Mention Parser - Sprint 011 Task T018
// Extract @mentions from text and validate users

import type { Mention } from '@/types/comment';

/**
 * Extract @mentions from comment text
 * Matches @username patterns
 */
export function extractMentions(content: string): Mention[] {
  const mentions: Mention[] = [];
  // Match @username (alphanumeric and underscore, 3-30 chars)
  const mentionRegex = /@(\w{3,30})/g;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    const username = match[1];
    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;

    mentions.push({
      userId: '', // Will be populated after validation
      username,
      startIndex,
      endIndex,
    });
  }

  return mentions;
}

/**
 * Validate and populate user IDs for mentions
 * Should be called with actual user lookup
 */
export async function validateMentions(
  mentions: Mention[],
  getUserByUsername: (username: string) => Promise<{ userId: string; displayName?: string } | null>
): Promise<Mention[]> {
  const validatedMentions: Mention[] = [];

  for (const mention of mentions) {
    const user = await getUserByUsername(mention.username);
    if (user) {
      validatedMentions.push({
        ...mention,
        userId: user.userId,
        displayName: user.displayName,
      });
    }
  }

  return validatedMentions;
}

/**
 * Generate notification data for mentions
 */
export function generateMentionNotifications(
  mentions: Mention[],
  commentId: string,
  commentContent: string,
  authorId: string
): Array<{
  userId: string;
  actorId: string;
  entityId: string;
  content: string;
}> {
  return mentions.map(mention => ({
    userId: mention.userId,
    actorId: authorId,
    entityId: commentId,
    content: `mentioned you in a comment: "${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}"`,
  }));
}

/**
 * Get unique user IDs from mentions
 */
export function getUniqueMentionedUserIds(mentions: Mention[]): string[] {
  const userIds = mentions.map(m => m.userId).filter(Boolean);
  return Array.from(new Set(userIds));
}

/**
 * Check if user is mentioned in content
 */
export function isUserMentioned(
  content: string,
  username: string
): boolean {
  const mentionPattern = new RegExp(`@${username}\\b`, 'i');
  return mentionPattern.test(content);
}

/**
 * Replace mentions with links in formatted text
 */
export function formatMentionsAsLinks(
  content: string,
  mentions: Mention[]
): string {
  if (!mentions || mentions.length === 0) return content;

  let formatted = content;
  // Sort by start index in reverse to avoid index shifting
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
    
    const displayName = mention.displayName || mention.username;
    formatted = `${before}<a href="/profile/${mention.userId}" class="mention" data-user-id="${mention.userId}" data-username="${mention.username}">${mentionText}</a>${after}`;
  });

  return formatted;
}

/**
 * Count mentions in content
 */
export function countMentions(content: string): number {
  const mentionRegex = /@(\w{3,30})/g;
  const matches = content.match(mentionRegex);
  return matches ? matches.length : 0;
}

/**
 * Limit mentions per comment (max 10)
 */
export function validateMentionLimit(mentions: Mention[]): {
  valid: boolean;
  reason?: string;
} {
  const maxMentions = 10;
  const uniqueUserIds = getUniqueMentionedUserIds(mentions);

  if (uniqueUserIds.length > maxMentions) {
    return {
      valid: false,
      reason: `Too many mentions (max ${maxMentions} users per comment)`,
    };
  }

  return { valid: true };
}

/**
 * Get mention autocomplete suggestions
 * Should be used with user search functionality
 */
export function getMentionSuggestions(
  content: string,
  cursorPosition: number
): { query: string; startIndex: number } | null {
  // Find @ symbol before cursor
  const beforeCursor = content.substring(0, cursorPosition);
  const lastAtIndex = beforeCursor.lastIndexOf('@');

  if (lastAtIndex === -1) return null;

  // Check if there's a space after @ (invalid mention)
  const afterAt = beforeCursor.substring(lastAtIndex + 1);
  if (afterAt.includes(' ')) return null;

  return {
    query: afterAt,
    startIndex: lastAtIndex,
  };
}
