/**
 * Notification Digest System
 * Groups similar notifications and sends summarized digests
 * Prevents notification spam while keeping users informed
 */

import { getSupabaseClient } from '../core/supabase-client.ts';
import { sendMessage } from '../telegram-api.ts';
import { escapeMarkdownV2 } from '../utils/text-processor.ts';
import { getTelegramConfig } from '../../_shared/telegram-config.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('notification-digest');
const supabase = getSupabaseClient();
const telegramConfig = getTelegramConfig();
const MINI_APP_URL = telegramConfig.miniAppUrl;

// In-memory pending digest cache
interface PendingDigestItem {
  type: 'like' | 'comment' | 'follow';
  data: Record<string, any>;
  timestamp: number;
}

const pendingDigests = new Map<string, PendingDigestItem[]>();

// Digest configuration
const DIGEST_CONFIG = {
  // Minimum items before sending digest (instead of individual)
  minItemsForDigest: 3,
  // Time window to collect items (ms)
  collectionWindow: 5 * 60 * 1000, // 5 minutes
  // Max items to include in digest message
  maxItemsInMessage: 5,
};

/**
 * Add item to pending digest
 */
export function addToPendingDigest(
  userId: string,
  type: 'like' | 'comment' | 'follow',
  data: Record<string, any>
): void {
  const key = `${userId}:${type}`;
  const items = pendingDigests.get(key) || [];
  
  items.push({
    type,
    data,
    timestamp: Date.now(),
  });
  
  pendingDigests.set(key, items);
  
  logger.debug('Added to pending digest', { userId, type, itemCount: items.length });
}

/**
 * Get pending digest items for user
 */
export function getPendingDigest(
  userId: string,
  type: 'like' | 'comment' | 'follow'
): PendingDigestItem[] {
  const key = `${userId}:${type}`;
  const items = pendingDigests.get(key) || [];
  
  // Filter out expired items
  const now = Date.now();
  const validItems = items.filter(
    item => now - item.timestamp < DIGEST_CONFIG.collectionWindow
  );
  
  pendingDigests.set(key, validItems);
  return validItems;
}

/**
 * Clear pending digest for user
 */
export function clearPendingDigest(
  userId: string,
  type: 'like' | 'comment' | 'follow'
): void {
  const key = `${userId}:${type}`;
  pendingDigests.delete(key);
}

/**
 * Check if should send digest now
 */
export function shouldSendDigest(
  userId: string,
  type: 'like' | 'comment' | 'follow'
): boolean {
  const items = getPendingDigest(userId, type);
  
  if (items.length === 0) return false;
  
  // If we have enough items, send digest
  if (items.length >= DIGEST_CONFIG.minItemsForDigest) {
    return true;
  }
  
  // If oldest item is past collection window, send what we have
  const oldestItem = items[0];
  if (Date.now() - oldestItem.timestamp >= DIGEST_CONFIG.collectionWindow) {
    return true;
  }
  
  return false;
}

/**
 * Format and send like digest
 */
export async function sendLikeDigest(
  chatId: number,
  userId: string,
  userName?: string
): Promise<boolean> {
  const items = getPendingDigest(userId, 'like');
  
  if (items.length === 0) return false;
  
  const greeting = userName ? `${escapeMarkdownV2(userName)}, ` : '';
  
  // Group likes by track
  const trackLikes = new Map<string, { title: string; count: number; likers: string[] }>();
  
  for (const item of items) {
    const trackId = item.data.trackId as string;
    const trackTitle = (item.data.trackTitle as string) || 'Трек';
    const likerName = (item.data.likerName as string) || 'Пользователь';
    
    const existing = trackLikes.get(trackId);
    if (existing) {
      existing.count++;
      if (existing.likers.length < 3) {
        existing.likers.push(likerName);
      }
    } else {
      trackLikes.set(trackId, { title: trackTitle, count: 1, likers: [likerName] });
    }
  }
  
  const totalLikes = items.length;
  const trackCount = trackLikes.size;
  
  // Build message
  let message = `❤️ *${totalLikes} новых лайков\\!*\n\n`;
  message += `${greeting}ваши треки набирают популярность\\!\n\n`;
  
  // List tracks with most likes
  const sortedTracks = [...trackLikes.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, DIGEST_CONFIG.maxItemsInMessage);
  
  for (const [trackId, info] of sortedTracks) {
    const likersList = info.likers.length < info.count 
      ? `${info.likers.join(', ')} и ещё ${info.count - info.likers.length}`
      : info.likers.join(', ');
    
    message += `🎵 *${escapeMarkdownV2(info.title)}*\n`;
    message += `   └ ${info.count} ❤️ от ${escapeMarkdownV2(likersList)}\n\n`;
  }
  
  if (trackCount > DIGEST_CONFIG.maxItemsInMessage) {
    message += `_\\.\\.\\. и ещё ${trackCount - DIGEST_CONFIG.maxItemsInMessage} треков_\n\n`;
  }
  
  message += `📊 Посмотрите полную статистику в приложении`;
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '📊 Статистика', url: `${MINI_APP_URL}?startapp=analytics` },
        { text: '🎵 Мои треки', url: `${MINI_APP_URL}?startapp=library` },
      ],
    ],
  };
  
  try {
    await sendMessage(chatId, message, keyboard, 'MarkdownV2');
    clearPendingDigest(userId, 'like');
    logger.info('Like digest sent', { userId, totalLikes, trackCount });
    return true;
  } catch (error) {
    logger.error('Failed to send like digest', error);
    return false;
  }
}

/**
 * Format and send comment digest
 */
export async function sendCommentDigest(
  chatId: number,
  userId: string,
  userName?: string
): Promise<boolean> {
  const items = getPendingDigest(userId, 'comment');
  
  if (items.length === 0) return false;
  
  const greeting = userName ? `${escapeMarkdownV2(userName)}, ` : '';
  const totalComments = items.length;
  
  // Group by track
  const trackComments = new Map<string, { title: string; comments: Array<{ author: string; preview: string }> }>();
  
  for (const item of items) {
    const trackId = item.data.trackId as string;
    const trackTitle = (item.data.trackTitle as string) || 'Трек';
    const authorName = (item.data.authorName as string) || 'Пользователь';
    const commentText = (item.data.commentText as string) || '';
    
    const existing = trackComments.get(trackId);
    const commentEntry = {
      author: authorName,
      preview: commentText.length > 50 ? commentText.substring(0, 47) + '...' : commentText,
    };
    
    if (existing) {
      if (existing.comments.length < 3) {
        existing.comments.push(commentEntry);
      }
    } else {
      trackComments.set(trackId, { title: trackTitle, comments: [commentEntry] });
    }
  }
  
  let message = `💬 *${totalComments} новых комментариев\\!*\n\n`;
  message += `${greeting}к вашим трекам оставили отзывы:\n\n`;
  
  const sortedTracks = [...trackComments.entries()]
    .slice(0, DIGEST_CONFIG.maxItemsInMessage);
  
  for (const [trackId, info] of sortedTracks) {
    message += `🎵 *${escapeMarkdownV2(info.title)}*\n`;
    
    for (const comment of info.comments) {
      message += `   💭 _"${escapeMarkdownV2(comment.preview)}"_\n`;
      message += `   └ ${escapeMarkdownV2(comment.author)}\n`;
    }
    message += '\n';
  }
  
  message += `📱 Ответьте в приложении`;
  
  const keyboard = {
    inline_keyboard: [
      [{ text: '💬 Открыть комментарии', url: `${MINI_APP_URL}?startapp=notifications` }],
    ],
  };
  
  try {
    await sendMessage(chatId, message, keyboard, 'MarkdownV2');
    clearPendingDigest(userId, 'comment');
    logger.info('Comment digest sent', { userId, totalComments });
    return true;
  } catch (error) {
    logger.error('Failed to send comment digest', error);
    return false;
  }
}

/**
 * Format and send follower digest
 */
export async function sendFollowerDigest(
  chatId: number,
  userId: string,
  userName?: string
): Promise<boolean> {
  const items = getPendingDigest(userId, 'follow');
  
  if (items.length === 0) return false;
  
  const greeting = userName ? `${escapeMarkdownV2(userName)}, ` : '';
  const totalFollowers = items.length;
  
  // Get follower names
  const followerNames = items
    .map(item => item.data.followerName || 'Пользователь')
    .slice(0, 5);
  
  let message = `👥 *${totalFollowers} новых подписчиков\\!*\n\n`;
  message += `${greeting}ваша аудитория растёт\\!\n\n`;
  
  if (followerNames.length <= 3) {
    message += `Новые подписчики:\n`;
    for (const name of followerNames) {
      message += `• ${escapeMarkdownV2(name)}\n`;
    }
  } else {
    const displayNames = followerNames.slice(0, 3).map(n => escapeMarkdownV2(n)).join(', ');
    const remaining = totalFollowers - 3;
    message += `${displayNames} и ещё ${remaining} человек\n`;
  }
  
  message += `\n🎉 Продолжайте создавать музыку\\!`;
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '👥 Подписчики', url: `${MINI_APP_URL}?startapp=profile` },
        { text: '🎵 Создать трек', callback_data: 'quick_actions' },
      ],
    ],
  };
  
  try {
    await sendMessage(chatId, message, keyboard, 'MarkdownV2');
    clearPendingDigest(userId, 'follow');
    logger.info('Follower digest sent', { userId, totalFollowers });
    return true;
  } catch (error) {
    logger.error('Failed to send follower digest', error);
    return false;
  }
}

/**
 * Process all pending digests for a user
 */
export async function processUserDigests(
  chatId: number,
  userId: string,
  userName?: string
): Promise<void> {
  // Check and send each digest type
  if (shouldSendDigest(userId, 'like')) {
    await sendLikeDigest(chatId, userId, userName);
  }
  
  if (shouldSendDigest(userId, 'comment')) {
    await sendCommentDigest(chatId, userId, userName);
  }
  
  if (shouldSendDigest(userId, 'follow')) {
    await sendFollowerDigest(chatId, userId, userName);
  }
}

/**
 * Get digest status for debugging
 */
export function getDigestStatus(userId: string): Record<string, number> {
  return {
    likes: getPendingDigest(userId, 'like').length,
    comments: getPendingDigest(userId, 'comment').length,
    followers: getPendingDigest(userId, 'follow').length,
  };
}

export default {
  addToPendingDigest,
  getPendingDigest,
  clearPendingDigest,
  shouldSendDigest,
  sendLikeDigest,
  sendCommentDigest,
  sendFollowerDigest,
  processUserDigests,
  getDigestStatus,
};
