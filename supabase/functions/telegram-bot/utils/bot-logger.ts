/**
 * Bot Action Logger
 * Logs all bot actions to database for analytics and debugging
 */

import { getSupabaseClient } from '../core/supabase-client.ts';
import { logger } from './index.ts';

interface LogData {
  menu_key?: string;
  message_id?: number;
  response_time_ms?: number;
  [key: string]: unknown;
}

/**
 * Log a bot action to database
 */
export async function logBotAction(
  telegramUserId: number,
  chatId: number,
  actionType: string,
  data?: LogData
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    const logEntry = {
      telegram_user_id: telegramUserId,
      chat_id: chatId,
      action_type: actionType,
      action_data: data ? JSON.stringify(data) : null,
      menu_key: data?.menu_key || null,
      message_id: data?.message_id || null,
      response_time_ms: data?.response_time_ms || null
    };
    
    const { error } = await supabase
      .from('telegram_bot_logs')
      .insert(logEntry);
    
    if (error) {
      // Don't throw, just log - we don't want logging to break the bot
      logger.warn('Failed to log bot action', { error, actionType });
    }
  } catch (err) {
    logger.warn('Error in logBotAction', { error: String(err) });
  }
}

/**
 * Log a menu click
 */
export async function logMenuClick(
  telegramUserId: number,
  chatId: number,
  menuKey: string,
  buttonText: string
): Promise<void> {
  await logBotAction(telegramUserId, chatId, 'menu_click', {
    menu_key: menuKey,
    button_text: buttonText
  });
}

/**
 * Log a command
 */
export async function logCommand(
  telegramUserId: number,
  chatId: number,
  command: string,
  args?: string
): Promise<void> {
  await logBotAction(telegramUserId, chatId, 'command', {
    command,
    args
  });
}

/**
 * Log a message sent
 */
export async function logMessageSent(
  telegramUserId: number,
  chatId: number,
  messageId: number,
  messageType: string
): Promise<void> {
  await logBotAction(telegramUserId, chatId, 'message_sent', {
    message_id: messageId,
    message_type: messageType
  });
}

/**
 * Log a message deleted
 */
export async function logMessageDeleted(
  telegramUserId: number,
  chatId: number,
  messageId: number,
  reason?: string
): Promise<void> {
  await logBotAction(telegramUserId, chatId, 'message_deleted', {
    message_id: messageId,
    reason
  });
}

/**
 * Log an error
 */
export async function logBotError(
  telegramUserId: number,
  chatId: number,
  error: Error | string,
  context?: Record<string, unknown>
): Promise<void> {
  await logBotAction(telegramUserId, chatId, 'error', {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    ...context
  });
}

/**
 * Log navigation
 */
export async function logNavigation(
  telegramUserId: number,
  chatId: number,
  from: string,
  to: string
): Promise<void> {
  await logBotAction(telegramUserId, chatId, 'navigation', {
    from,
    to
  });
}
