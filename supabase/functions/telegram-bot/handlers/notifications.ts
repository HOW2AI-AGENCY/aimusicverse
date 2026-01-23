/**
 * Notification handlers for Telegram bot
 * Sends notifications about project events, track status, etc.
 * Now with digest support for batching similar notifications
 */

import { sendMessage, sendPhoto } from '../telegram-api.ts';
import { getSupabaseClient } from '../core/supabase-client.ts';
import { escapeMarkdownV2, truncateText } from '../utils/text-processor.ts';
import { getProjectDeepLink, getTrackDeepLink, getTelegramConfig } from '../../_shared/telegram-config.ts';
import { createLogger } from '../../_shared/logger.ts';
import { 
  addToPendingDigest, 
  shouldSendDigest, 
  sendLikeDigest, 
  sendCommentDigest, 
  sendFollowerDigest 
} from '../utils/notification-digest.ts';
import { SmartLinks } from '../utils/smart-deep-links.ts';

const logger = createLogger('notifications');

const supabase = getSupabaseClient();

const telegramConfig = getTelegramConfig();
const MINI_APP_URL = telegramConfig.miniAppUrl;
const CHANNEL_URL = 'https://t.me/AIMusiicVerse';
const CHANNEL_USERNAME = 'AIMusiicVerse';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  data: Record<string, any>;
}

export type NotificationType = 
  | 'track_completed'
  | 'track_added_to_project'
  | 'project_status_changed'
  | 'project_completed'
  | 'new_follower'
  | 'track_liked'
  | 'comment_received'
  | 'credits_earned'
  | 'achievement_unlocked'
  | 'feature_announcement';

// Rate limiting cooldowns for each notification type (in milliseconds)
const NOTIFICATION_COOLDOWNS: Record<NotificationType, number> = {
  track_completed: 0,              // No cooldown - always send
  track_added_to_project: 60_000,  // 1 minute
  project_status_changed: 60_000,  // 1 minute
  project_completed: 0,            // No cooldown
  new_follower: 10 * 60_000,       // 10 minutes
  track_liked: 5 * 60_000,         // 5 minutes (digest instead)
  comment_received: 5 * 60_000,    // 5 minutes
  credits_earned: 30_000,          // 30 seconds
  achievement_unlocked: 0,         // No cooldown
  feature_announcement: 0,         // No cooldown
};

// In-memory cooldown cache (per-user, per-type)
const cooldownCache = new Map<string, number>();

/**
 * Check if notification can be sent (rate limiting)
 */
function canSendNotification(userId: string, type: NotificationType): boolean {
  const cooldown = NOTIFICATION_COOLDOWNS[type];
  if (cooldown === 0) return true;
  
  const cacheKey = `${userId}:${type}`;
  const lastSent = cooldownCache.get(cacheKey);
  
  if (!lastSent) return true;
  return Date.now() - lastSent > cooldown;
}

/**
 * Mark notification as sent (for rate limiting)
 */
function markNotificationSent(userId: string, type: NotificationType): void {
  const cacheKey = `${userId}:${type}`;
  cooldownCache.set(cacheKey, Date.now());
}

/**
 * Send notification to user via Telegram
 * Uses digest for likes, comments, followers to prevent spam
 */
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    // Check rate limiting
    if (!canSendNotification(payload.userId, payload.type)) {
      logger.info('Notification rate limited', { userId: payload.userId, type: payload.type });
      return false;
    }

    // Get user's telegram chat id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('telegram_chat_id, telegram_id, first_name')
      .eq('user_id', payload.userId)
      .single();

    if (profileError || !profile?.telegram_chat_id) {
      logger.warn('Cannot send notification - no chat id', { userId: payload.userId });
      return false;
    }

    const chatId = profile.telegram_chat_id;
    
    // Use digest for social notifications
    if (payload.type === 'track_liked') {
      addToPendingDigest(payload.userId, 'like', payload.data);
      
      // Check if we should send digest now
      if (shouldSendDigest(payload.userId, 'like')) {
        await sendLikeDigest(chatId, payload.userId, profile.first_name);
      }
      return true;
    }
    
    if (payload.type === 'comment_received') {
      addToPendingDigest(payload.userId, 'comment', payload.data);
      
      if (shouldSendDigest(payload.userId, 'comment')) {
        await sendCommentDigest(chatId, payload.userId, profile.first_name);
      }
      return true;
    }
    
    if (payload.type === 'new_follower') {
      addToPendingDigest(payload.userId, 'follow', payload.data);
      
      if (shouldSendDigest(payload.userId, 'follow')) {
        await sendFollowerDigest(chatId, payload.userId, profile.first_name);
      }
      return true;
    }
    
    // For other types, send immediately
    const message = await formatNotificationMessage(payload.type, payload.data, profile.first_name);
    
    if (!message) {
      return false;
    }

    await sendMessage(chatId, message.text, message.keyboard);
    
    // Mark as sent for rate limiting
    markNotificationSent(payload.userId, payload.type);
    
    logger.info('Notification sent', { userId: payload.userId, type: payload.type });
    return true;
  } catch (error) {
    logger.error('Failed to send notification', error);
    return false;
  }
}

/**
 * Format notification message based on type
 */
async function formatNotificationMessage(
  type: NotificationType,
  data: Record<string, any>,
  userName?: string
): Promise<{ text: string; keyboard?: any } | null> {
  const greeting = userName ? `Привет, ${escapeMarkdownV2(userName)}\\!` : 'Привет\\!';

  switch (type) {
    case 'track_completed': {
      const trackTitle = data.trackTitle || 'Новый трек';
      const trackId = data.trackId;
      
      const text = `🎵 *Трек готов\\!*\n\n` +
        `${greeting}\n\n` +
        `✅ Ваш трек *${escapeMarkdownV2(trackTitle)}* успешно создан\\!\n\n` +
        `Послушайте и поделитесь с друзьями 🎧`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '▶️ Послушать', callback_data: `play_${trackId}` }],
          [
            { text: '📤 Поделиться', callback_data: `share_${trackId}` },
            { text: '📱 В приложении', url: `${MINI_APP_URL}?startapp=track_${trackId}` },
          ],
        ],
      };

      return { text, keyboard };
    }

    case 'track_added_to_project': {
      const trackTitle = data.trackTitle || 'Трек';
      const projectTitle = data.projectTitle || 'Проект';
      const projectId = data.projectId;
      const progress = data.progress || 0;
      
      const progressBar = getProgressBar(progress);
      
      const text = `📁 *Трек добавлен в проект\\!*\n\n` +
        `🎵 *${escapeMarkdownV2(trackTitle)}* добавлен в:\n` +
        `📁 *${escapeMarkdownV2(projectTitle)}*\n\n` +
        `Прогресс: ${progressBar} ${progress}%`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '📁 Открыть проект', callback_data: `project_details_${projectId}` }],
          [{ text: '📱 В приложении', url: `${MINI_APP_URL}?startapp=project_${projectId}` }],
        ],
      };

      return { text, keyboard };
    }

    case 'project_status_changed': {
      const projectTitle = data.projectTitle || 'Проект';
      const projectId = data.projectId;
      const oldStatus = data.oldStatus || 'draft';
      const newStatus = data.newStatus || 'in_progress';
      
      const statusInfo = getStatusInfo(newStatus);
      
      const text = `📋 *Статус проекта изменён\\!*\n\n` +
        `📁 *${escapeMarkdownV2(projectTitle)}*\n\n` +
        `${statusInfo.emoji} Новый статус: *${escapeMarkdownV2(statusInfo.label)}*`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '📁 Открыть проект', callback_data: `project_details_${projectId}` }],
        ],
      };

      return { text, keyboard };
    }

    case 'project_completed': {
      const projectTitle = data.projectTitle || 'Проект';
      const projectId = data.projectId;
      const trackCount = data.trackCount || 0;
      
      const text = `🎉 *Проект завершён\\!*\n\n` +
        `📁 *${escapeMarkdownV2(projectTitle)}*\n\n` +
        `✅ Все ${trackCount} треков готовы\\!\n\n` +
        `🚀 Поделитесь своим творением с миром\\!`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '📤 Поделиться', callback_data: `project_share_${projectId}` }],
          [{ text: '📱 Открыть', url: `${MINI_APP_URL}?startapp=project_${projectId}` }],
        ],
      };

      return { text, keyboard };
    }

    case 'new_follower': {
      const followerName = data.followerName || 'Пользователь';
      const followerUsername = data.followerUsername;
      const totalFollowers = data.totalFollowers || 1;
      
      const text = `👥 *Новый подписчик\\!*\n\n` +
        `${greeting}\n\n` +
        `🎉 *${escapeMarkdownV2(followerName)}* ${followerUsername ? `\\(@${escapeMarkdownV2(followerUsername)}\\)` : ''} ` +
        `теперь следит за вашим творчеством\\!\n\n` +
        `📊 У вас уже ${totalFollowers} подписчиков`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '👤 Мой профиль', url: `${MINI_APP_URL}?startapp=profile` }],
        ],
      };

      return { text, keyboard };
    }

    case 'track_liked': {
      const trackTitle = data.trackTitle || 'Трек';
      const trackId = data.trackId;
      const likerName = data.likerName || 'Кто-то';
      const totalLikes = data.totalLikes || 1;
      
      const text = `❤️ *Новый лайк\\!*\n\n` +
        `*${escapeMarkdownV2(likerName)}* оценил ваш трек:\n` +
        `🎵 *${escapeMarkdownV2(trackTitle)}*\n\n` +
        `💖 Всего лайков: ${totalLikes}`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '▶️ Послушать', callback_data: `play_${trackId}` }],
          [{ text: '📊 Статистика', callback_data: `stats_${trackId}` }],
        ],
      };

      return { text, keyboard };
    }

    case 'credits_earned': {
      const amount = data.amount || 1;
      const reason = data.reason || 'Награда';
      const newBalance = data.newBalance || amount;
      
      const text = `💰 *Кредиты получены\\!*\n\n` +
        `\\+${amount} 🎵 за: ${escapeMarkdownV2(reason)}\n\n` +
        `💳 Ваш баланс: ${newBalance} кредитов`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '🎼 Создать трек', callback_data: 'quick_actions' }],
          [{ text: '💳 Баланс', url: `${MINI_APP_URL}?startapp=credits` }],
        ],
      };

      return { text, keyboard };
    }

    case 'achievement_unlocked': {
      const achievementName = data.name || 'Достижение';
      const achievementIcon = data.icon || '🏆';
      const description = data.description || '';
      const creditsReward = data.creditsReward || 0;
      const experienceReward = data.experienceReward || 0;
      
      let rewardText = '';
      if (creditsReward > 0) rewardText += `\\+${creditsReward} 💰`;
      if (experienceReward > 0) rewardText += ` \\+${experienceReward} XP`;
      
      const text = `🏆 *Достижение разблокировано\\!*\n\n` +
        `${achievementIcon} *${escapeMarkdownV2(achievementName)}*\n` +
        `_${escapeMarkdownV2(description)}_\n\n` +
        (rewardText ? `🎁 Награда: ${rewardText}` : '');

      const keyboard = {
        inline_keyboard: [
          [{ text: '🏆 Все достижения', url: `${MINI_APP_URL}?startapp=achievements` }],
        ],
      };

      return { text, keyboard };
    }

    case 'feature_announcement': {
      const featureName = data.featureName || 'Новая функция';
      const featureDescription = data.description || '';
      const actionUrl = data.actionUrl || MINI_APP_URL;
      const actionLabel = data.actionLabel || 'Попробовать';
      
      const text = `🎉 *${escapeMarkdownV2(featureName)}*\n\n` +
        `${escapeMarkdownV2(featureDescription)}\n\n` +
        `📢 Следите за новостями в @${CHANNEL_USERNAME}`;

      const keyboard = {
        inline_keyboard: [
          [{ text: `✨ ${actionLabel}`, url: actionUrl }],
          [{ text: `📢 Канал @${CHANNEL_USERNAME}`, url: CHANNEL_URL }],
        ],
      };

      return { text, keyboard };
    }

    default:
      return null;
  }
}

/**
 * Generate progress bar visual
 */
function getProgressBar(percent: number, length: number = 10): string {
  const filled = Math.round(percent / (100 / length));
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Get status emoji and label
 */
function getStatusInfo(status: string): { emoji: string; label: string } {
  const statusMap: Record<string, { emoji: string; label: string }> = {
    'draft': { emoji: '📝', label: 'Черновик' },
    'in_progress': { emoji: '🔄', label: 'В работе' },
    'completed': { emoji: '✅', label: 'Завершён' },
    'released': { emoji: '🚀', label: 'Выпущен' },
    'published': { emoji: '🌐', label: 'Опубликован' },
  };
  return statusMap[status] || statusMap['draft'];
}

/**
 * Batch send notifications to multiple users
 */
export async function sendBatchNotifications(
  notifications: NotificationPayload[]
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const notification of notifications) {
    const success = await sendNotification(notification);
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Store notification in database for later retrieval
 */
export async function storeNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  actionUrl?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        action_url: actionUrl,
        read: false,
      });

    if (error) {
      logger.error('Failed to store notification', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Failed to store notification', error);
    return false;
  }
}
