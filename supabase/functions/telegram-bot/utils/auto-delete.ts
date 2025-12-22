/**
 * Auto-delete message utilities
 * Handles self-destructing notifications and progress updates
 */

import { deleteMessage, sendMessage, editMessageText } from '../telegram-api.ts';
import { logger } from './index.ts';

/**
 * Send a notification that auto-deletes after specified time
 */
export async function sendAutoDeleteMessage(
  chatId: number,
  text: string,
  deleteAfterMs: number = 5000,
  options?: {
    keyboard?: Array<Array<{ text: string; callback_data?: string; url?: string }>>;
    parseMode?: 'MarkdownV2' | 'HTML';
  }
): Promise<number | null> {
  try {
    const result = await sendMessage(chatId, text, {
      parse_mode: options?.parseMode || 'MarkdownV2',
      reply_markup: options?.keyboard ? { inline_keyboard: options.keyboard } : undefined,
    } as Record<string, unknown>);
    
    const messageId = result?.result?.message_id;
    
    if (messageId) {
      scheduleMessageDelete(chatId, messageId, deleteAfterMs);
    }
    
    return messageId || null;
  } catch (error) {
    logger.error('Failed to send auto-delete message', error);
    return null;
  }
}

/**
 * Schedule message deletion after delay
 */
export function scheduleMessageDelete(
  chatId: number,
  messageId: number,
  deleteAfterMs: number
): void {
  const deleteTask = async () => {
    await new Promise(resolve => setTimeout(resolve, deleteAfterMs));
    try {
      await deleteMessage(chatId, messageId);
      logger.debug('Auto-deleted message', { chatId, messageId, delay: deleteAfterMs });
    } catch {
      logger.debug('Failed to auto-delete message (may already be deleted)', { messageId });
    }
  };
  
  deleteTask();
}

/**
 * Send a temporary success notification
 */
export async function sendSuccessNotification(
  chatId: number,
  text: string,
  deleteAfterMs: number = 3000
): Promise<number | null> {
  const formattedText = `✅ ${text.replace(/([_*\[\]()~`>#+=|{}.!-])/g, '\\$1')}`;
  return sendAutoDeleteMessage(chatId, formattedText, deleteAfterMs);
}

/**
 * Send a temporary error notification
 */
export async function sendErrorNotification(
  chatId: number,
  text: string,
  deleteAfterMs: number = 5000
): Promise<number | null> {
  const formattedText = `❌ ${text.replace(/([_*\[\]()~`>#+=|{}.!-])/g, '\\$1')}`;
  return sendAutoDeleteMessage(chatId, formattedText, deleteAfterMs);
}

/**
 * Message timing presets
 */
export const AUTO_DELETE_TIMINGS = {
  QUICK: 2000,
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 10000,
  EXTENDED: 30000,
} as const;
