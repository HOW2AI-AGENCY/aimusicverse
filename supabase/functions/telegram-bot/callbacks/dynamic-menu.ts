/**
 * Dynamic Menu Callback Handler
 * Handles callbacks from dynamically configured menu items
 */

import { answerCallbackQuery } from '../telegram-api.ts';
import { handleSubmenu, getMenuItem } from '../handlers/dynamic-menu.ts';
import { logBotAction } from '../utils/bot-logger.ts';
import { logger } from '../utils/index.ts';

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
  // Extract menu key from callback data (menu_about -> about)
  if (!data.startsWith('menu_')) {
    return false;
  }
  
  const menuKey = data.replace('menu_', '');
  
  try {
    // Get menu item to check action type
    const menuItem = await getMenuItem(menuKey);
    
    if (!menuItem) {
      logger.warn(`Menu item not found: ${menuKey}`);
      await answerCallbackQuery(queryId, '❌ Пункт меню не найден');
      return true;
    }
    
    // Check if it's a submenu
    if (menuItem.action_type === 'submenu') {
      await handleSubmenu(chatId, userId, menuKey, messageId);
      await answerCallbackQuery(queryId);
      return true;
    }
    
    // For other action types, let navigation handle them
    // Or handle directly based on action_type
    if (menuItem.action_type === 'callback' && menuItem.action_data) {
      // Re-route to the actual callback
      // This will be picked up by other handlers
      return false;
    }
    
    await answerCallbackQuery(queryId);
    return true;
    
  } catch (error) {
    logger.error('Error handling dynamic menu callback', error);
    await answerCallbackQuery(queryId, '❌ Ошибка');
    return true;
  }
}
