/**
 * Active Menu Manager
 * Manages the single active menu message per user to prevent spam in Telegram chat
 */

import { getSupabaseClient } from './supabase-client.ts';
import { sendMessage, sendPhoto, deleteMessage, type InlineKeyboardButton } from '../telegram-api.ts';
import { BOT_CONFIG } from '../config.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('active-menu-manager');

const supabase = getSupabaseClient();

interface MenuState {
  id: string;
  user_id: number;
  chat_id: number;
  active_menu_message_id: number | null;
  current_menu: string | null;
  navigation_stack: string[];
}

/**
 * Get the active menu message ID for a user
 */
export async function getActiveMenuMessageId(userId: number, chatId: number): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('telegram_menu_state')
      .select('active_menu_message_id')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Error getting active menu', error);
    }

    return data?.active_menu_message_id ?? null;
  } catch (error) {
    logger.error('Exception getting active menu', error);
    return null;
  }
}

/**
 * Set the active menu message ID for a user
 */
export async function setActiveMenuMessageId(
  userId: number, 
  chatId: number, 
  messageId: number,
  menuName?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('telegram_menu_state')
      .upsert({
        user_id: userId,
        chat_id: chatId,
        active_menu_message_id: messageId,
        current_menu: menuName || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      logger.error('Error setting active menu', error);
    }
  } catch (error) {
    logger.error('Exception setting active menu', error);
  }
}

/**
 * Clear the active menu for a user
 */
export async function clearActiveMenu(userId: number, chatId: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('telegram_menu_state')
      .update({ 
        active_menu_message_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      logger.error('Error clearing active menu', error);
    }
  } catch (error) {
    logger.error('Exception clearing active menu', error);
  }
}

/**
 * Delete the current active menu message and clear state
 */
export async function deleteActiveMenu(userId: number, chatId: number): Promise<boolean> {
  try {
    const activeMenuId = await getActiveMenuMessageId(userId, chatId);
    
    if (activeMenuId) {
      // Try to delete the message
      const result = await deleteMessage(chatId, activeMenuId);
      
      // Clear state regardless of delete success
      await clearActiveMenu(userId, chatId);
      
      return result !== null;
    }
    
    return false;
  } catch (error) {
    logger.error('Error deleting active menu', error);
    // Still clear state on error
    await clearActiveMenu(userId, chatId);
    return false;
  }
}

/**
 * Delete old menu and send a new menu message, saving it as active
 * This is the main function for menu navigation
 */
export async function deleteAndSendNewMenu(
  chatId: number,
  userId: number,
  text: string,
  keyboard?: { inline_keyboard: InlineKeyboardButton[][] },
  menuName?: string,
  parseMode?: 'MarkdownV2' | 'HTML' | null
): Promise<number | null> {
  try {
    // Delete previous menu if exists
    await deleteActiveMenu(userId, chatId);
    
    // Send new menu message
    const result = await sendMessage(chatId, text, keyboard, parseMode ?? null);
    
    if (result?.ok && result?.result?.message_id) {
      const newMessageId = result.result.message_id;
      
      // Save as new active menu
      await setActiveMenuMessageId(userId, chatId, newMessageId, menuName);
      
      logger.info('New menu sent and saved', { 
        chatId, 
        userId, 
        messageId: newMessageId, 
        menu: menuName 
      });
      
      return newMessageId;
    }
    
    logger.warn('Failed to send new menu', { chatId, userId });
    return null;
  } catch (error) {
    logger.error('Exception in deleteAndSendNewMenu', error);
    return null;
  }
}

/**
 * Delete old menu and send a new photo menu, saving it as active
 * Use this for menus with images
 */
export async function deleteAndSendNewMenuPhoto(
  chatId: number,
  userId: number,
  photoUrl: string,
  caption: string,
  keyboard?: { inline_keyboard: InlineKeyboardButton[][] },
  menuName?: string
): Promise<number | null> {
  try {
    // Delete previous menu if exists
    await deleteActiveMenu(userId, chatId);
    
    // Send new photo menu
    const result = await sendPhoto(chatId, photoUrl, {
      caption,
      replyMarkup: keyboard
    });
    
    if (result?.ok && result?.result?.message_id) {
      const newMessageId = result.result.message_id;
      
      // Save as new active menu
      await setActiveMenuMessageId(userId, chatId, newMessageId, menuName);
      
      logger.info('New photo menu sent and saved', { 
        chatId, 
        userId, 
        messageId: newMessageId, 
        menu: menuName 
      });
      
      return newMessageId;
    }
    
    logger.warn('Failed to send new photo menu', { chatId, userId });
    return null;
  } catch (error) {
    logger.error('Exception in deleteAndSendNewMenuPhoto', error);
    return null;
  }
}

/**
 * Send a notification message without affecting active menu
 * Use for alerts, confirmations, progress updates
 */
export async function sendNotification(
  chatId: number,
  text: string,
  keyboard?: { inline_keyboard: InlineKeyboardButton[][] },
  parseMode?: 'MarkdownV2' | 'HTML' | null
): Promise<number | null> {
  try {
    const result = await sendMessage(chatId, text, keyboard, parseMode ?? null);
    
    if (result?.ok && result?.result?.message_id) {
      logger.debug('Notification sent', { chatId, messageId: result.result.message_id });
      return result.result.message_id;
    }
    
    return null;
  } catch (error) {
    logger.error('Exception sending notification', error);
    return null;
  }
}

/**
 * Get full menu state for a user
 */
export async function getMenuState(userId: number): Promise<MenuState | null> {
  try {
    const { data, error } = await supabase
      .from('telegram_menu_state')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Error getting menu state', error);
    }

    return data as MenuState | null;
  } catch (error) {
    logger.error('Exception getting menu state', error);
    return null;
  }
}
