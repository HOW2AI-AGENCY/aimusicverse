/**
 * Telegram Notifications Service
 * Handles sending notifications via Telegram Bot API
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { getTrackDeepLink } from '@/lib/telegram';

const log = logger.child({ module: 'TelegramNotifications' });

// ============================================================================
// Types
// ============================================================================

interface TelegramNotificationPayload {
  chatId: number;
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  replyMarkup?: object;
}

interface NotificationQueueItem {
  id: string;
  payload: TelegramNotificationPayload;
  retryCount: number;
  createdAt: number;
}

// ============================================================================
// Queue Management
// ============================================================================

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const notificationQueue: NotificationQueueItem[] = [];
let isProcessing = false;

/**
 * Add notification to queue
 */
export function queueNotification(payload: TelegramNotificationPayload): string {
  const id = crypto.randomUUID();
  notificationQueue.push({
    id,
    payload,
    retryCount: 0,
    createdAt: Date.now(),
  });
  
  processQueue();
  return id;
}

/**
 * Process notification queue
 */
async function processQueue(): Promise<void> {
  if (isProcessing || notificationQueue.length === 0) return;
  
  isProcessing = true;
  
  while (notificationQueue.length > 0) {
    const item = notificationQueue.shift();
    if (!item) break;
    
    try {
      await sendTelegramMessage(item.payload);
      log.debug('Notification sent', { id: item.id });
    } catch (error) {
      log.error('Failed to send notification', error);
      
      if (item.retryCount < MAX_RETRIES) {
        item.retryCount++;
        notificationQueue.push(item);
        await delay(RETRY_DELAY_MS * item.retryCount);
      } else {
        // Save to failed notifications table for later retry
        await saveFailedNotification(item);
      }
    }
  }
  
  isProcessing = false;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// API
// ============================================================================

/**
 * Send message via Telegram Bot
 */
async function sendTelegramMessage(payload: TelegramNotificationPayload): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('telegram-send-message', {
    body: {
      chat_id: payload.chatId,
      text: payload.text,
      parse_mode: payload.parseMode || 'HTML',
      reply_markup: payload.replyMarkup,
    },
  });

  if (error) {
    throw error;
  }

  return data?.ok === true;
}

/**
 * Save failed notification for later retry
 */
async function saveFailedNotification(item: NotificationQueueItem): Promise<void> {
  try {
    await supabase.from('failed_telegram_notifications').insert({
      chat_id: item.payload.chatId,
      method: 'sendMessage',
      payload: item.payload as any,
      retry_count: item.retryCount,
      status: 'failed',
    });
  } catch (error) {
    log.error('Failed to save notification for retry', error);
  }
}

// ============================================================================
// High-Level API
// ============================================================================

/**
 * Notify user about generation completion
 */
export function notifyGenerationComplete(
  chatId: number,
  trackTitle: string,
  trackId: string
): string {
  return queueNotification({
    chatId,
    text: `🎵 <b>Трек готов!</b>\n\n${trackTitle}\n\n<a href="${getTrackDeepLink(trackId)}">Открыть трек</a>`,
    parseMode: 'HTML',
  });
}

/**
 * Notify user about generation failure
 */
export function notifyGenerationFailed(
  chatId: number,
  errorMessage: string
): string {
  return queueNotification({
    chatId,
    text: `❌ <b>Ошибка генерации</b>\n\n${errorMessage}\n\nПопробуйте ещё раз.`,
    parseMode: 'HTML',
  });
}

/**
 * Notify about social event (like, comment, follow)
 */
export function notifySocialEvent(
  chatId: number,
  eventType: 'like' | 'comment' | 'follow',
  actorName: string,
  entityTitle?: string,
  entityUrl?: string
): string {
  const templates = {
    like: `❤️ <b>${actorName}</b> оценил ваш трек "${entityTitle}"`,
    comment: `💬 <b>${actorName}</b> прокомментировал ваш трек "${entityTitle}"`,
    follow: `👤 <b>${actorName}</b> подписался на вас`,
  };

  let text = templates[eventType];
  if (entityUrl) {
    text += `\n\n<a href="${entityUrl}">Открыть</a>`;
  }

  return queueNotification({
    chatId,
    text,
    parseMode: 'HTML',
  });
}

/**
 * Notify about new achievement
 */
export function notifyAchievement(
  chatId: number,
  achievementName: string,
  description: string,
  reward?: number
): string {
  let text = `🏆 <b>Достижение разблокировано!</b>\n\n<b>${achievementName}</b>\n${description}`;
  
  if (reward) {
    text += `\n\n+${reward} кредитов 💰`;
  }

  return queueNotification({
    chatId,
    text,
    parseMode: 'HTML',
  });
}

/**
 * Send custom message
 */
export function sendCustomMessage(
  chatId: number,
  text: string,
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
): string {
  return queueNotification({
    chatId,
    text,
    parseMode,
  });
}
