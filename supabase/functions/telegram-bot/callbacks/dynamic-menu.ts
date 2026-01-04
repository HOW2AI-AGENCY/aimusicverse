/**
 * Dynamic Menu Callback Handler
 * Handles callbacks from dynamically configured menu items
 * Supports nested menus and various action types
 */

import { answerCallbackQuery, sendMessage } from '../telegram-api.ts';
import { handleSubmenu, handleMenuAction, getMenuItem, handleMenuBack, loadMenuItems } from '../handlers/dynamic-menu.ts';
import { logBotAction } from '../utils/bot-logger.ts';
import { logger } from '../utils/index.ts';
import { escapeMarkdownV2 } from '../utils/text-processor.ts';

/**
 * Handle dynamic menu callbacks (menu_*)
 */
export async function handleDynamicMenuCallback(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  // Handle menu_back specially
  if (data.startsWith('menu_back_')) {
    const currentKey = data.replace('menu_back_', '');
    await handleMenuBack(chatId, userId, currentKey, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }
  
  // Extract menu key from callback data (menu_about -> about)
  if (!data.startsWith('menu_')) {
    return false;
  }
  
  const menuKey = data.replace('menu_', '');
  
  try {
    // Log the action
    await logBotAction(userId, chatId, 'menu_click', { menu_key: menuKey });
    
    // Get menu item to check action type
    const menuItem = await getMenuItem(menuKey);
    
    if (!menuItem) {
      logger.warn(`Menu item not found: ${menuKey}`);
      await answerCallbackQuery(queryId, '❌ Пункт меню не найден');
      return true;
    }
    
    // Handle based on action type
    switch (menuItem.action_type) {
      case 'submenu':
        // Navigate to submenu
        await handleSubmenu(chatId, userId, menuKey, messageId);
        await answerCallbackQuery(queryId);
        return true;
      
      case 'callback':
        // Let other handlers process the callback_data
        if (menuItem.action_data) {
          // Return false so router can dispatch to correct handler
          return false;
        }
        await answerCallbackQuery(queryId);
        return true;
      
      case 'message':
        // Send a message with the description/caption
        if (menuItem.description || menuItem.caption) {
          const text = menuItem.caption || escapeMarkdownV2(menuItem.description || '');
          await sendMessage(chatId, text, undefined, 'MarkdownV2');
        }
        await answerCallbackQuery(queryId);
        return true;
      
      case 'switch_inline':
        // Switch to inline mode with prefilled query
        // This action type is handled client-side via switch_inline_query_current_chat
        // But if callback comes through, show hint
        await answerCallbackQuery(queryId, `💡 Используйте @AIMusicVerseBot ${menuItem.action_data || ''}`);
        return true;
      
      case 'webapp':
      case 'url':
        // These are handled client-side by Telegram buttons
        await answerCallbackQuery(queryId);
        return true;
      
      default:
        // Check if this item has children (treat as submenu)
        const children = await loadMenuItems(menuKey);
        if (children.length > 0) {
          await handleSubmenu(chatId, userId, menuKey, messageId);
          await answerCallbackQuery(queryId);
          return true;
        }
        
        await answerCallbackQuery(queryId, '✅');
        return true;
    }
    
  } catch (error) {
    logger.error('Error handling dynamic menu callback', error);
    await answerCallbackQuery(queryId, '❌ Ошибка');
    return true;
  }
}
