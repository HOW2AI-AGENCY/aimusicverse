/**
 * Dynamic Menu Handler
 * Loads menu structure from database and builds keyboards dynamically
 */

import { getSupabaseClient } from '../core/supabase-client.ts';
import { sendPhoto, editMessageMedia, escapeMarkdownV2 } from '../telegram-api.ts';
import { navigateTo } from '../core/navigation-state.ts';
import { deleteActiveMenu, setActiveMenuMessageId, deleteAndSendNewMenuPhoto } from '../core/active-menu-manager.ts';
import { trackMessage } from '../utils/message-manager.ts';
import { BOT_CONFIG } from '../config.ts';
import { logger } from '../utils/index.ts';
import { logBotAction } from '../utils/bot-logger.ts';

export interface MenuItem {
  id: string;
  menu_key: string;
  parent_key: string | null;
  sort_order: number;
  title: string;
  caption: string | null;
  description: string | null;
  image_url: string | null;
  image_fallback: string | null;
  action_type: string;
  action_data: string | null;
  row_position: number;
  column_span: number;
  is_enabled: boolean;
  show_in_menu: boolean;
  requires_auth: boolean;
  icon_emoji: string | null;
}

interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
  web_app?: { url: string };
}

/**
 * Load menu items from database
 */
export async function loadMenuItems(parentKey: string | null = null): Promise<MenuItem[]> {
  const supabase = getSupabaseClient();
  
  let query = supabase
    .from('telegram_menu_items')
    .select('*')
    .eq('is_enabled', true)
    .eq('show_in_menu', true)
    .order('sort_order', { ascending: true });
  
  if (parentKey === null) {
    query = query.is('parent_key', null);
  } else {
    query = query.eq('parent_key', parentKey);
  }
  
  const { data, error } = await query;
  
  if (error) {
    logger.error('Failed to load menu items', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get a single menu item by key
 */
export async function getMenuItem(menuKey: string): Promise<MenuItem | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('telegram_menu_items')
    .select('*')
    .eq('menu_key', menuKey)
    .single();
  
  if (error || !data) {
    logger.warn(`Menu item not found: ${menuKey}`);
    return null;
  }
  
  return data;
}

/**
 * Create button based on action type
 */
function createButton(item: MenuItem): InlineKeyboardButton {
  const text = item.icon_emoji ? `${item.icon_emoji} ${item.title}` : item.title;
  
  switch (item.action_type) {
    case 'webapp':
      return {
        text,
        web_app: { url: `${BOT_CONFIG.miniAppUrl}${item.action_data || ''}` }
      };
    
    case 'url':
      return {
        text,
        url: item.action_data || '#'
      };
    
    case 'submenu':
      return {
        text,
        callback_data: `menu_${item.menu_key}`
      };
    
    case 'callback':
    default:
      return {
        text,
        callback_data: item.action_data || item.menu_key
      };
  }
}

/**
 * Build keyboard from menu items
 * Groups items by row_position and respects column_span
 */
export function buildKeyboard(items: MenuItem[]): InlineKeyboardButton[][] {
  if (!items.length) return [];
  
  // Group items by row_position
  const rows = new Map<number, MenuItem[]>();
  
  for (const item of items) {
    if (item.menu_key === 'main') continue; // Skip the main item itself
    
    const row = item.row_position;
    if (!rows.has(row)) {
      rows.set(row, []);
    }
    rows.get(row)!.push(item);
  }
  
  // Sort rows by position and build keyboard
  const keyboard: InlineKeyboardButton[][] = [];
  const sortedRows = [...rows.entries()].sort((a, b) => a[0] - b[0]);
  
  for (const [, rowItems] of sortedRows) {
    // Sort items within row by sort_order
    rowItems.sort((a, b) => a.sort_order - b.sort_order);
    
    const row: InlineKeyboardButton[] = [];
    for (const item of rowItems) {
      row.push(createButton(item));
    }
    
    if (row.length > 0) {
      keyboard.push(row);
    }
  }
  
  return keyboard;
}

/**
 * Build dynamic keyboard for a menu
 */
export async function buildDynamicKeyboard(
  parentKey: string = 'main',
  includeBack: boolean = false
): Promise<InlineKeyboardButton[][]> {
  const items = await loadMenuItems(parentKey);
  const keyboard = buildKeyboard(items);
  
  // Add back button for submenus
  if (includeBack && parentKey !== 'main') {
    const parentItem = await getMenuItem(parentKey);
    const backTarget = parentItem?.parent_key || 'main';
    
    keyboard.push([{
      text: '⬅️ Назад',
      callback_data: backTarget === 'main' ? 'main_menu' : `menu_${backTarget}`
    }]);
  }
  
  return keyboard;
}

/**
 * Handle submenu navigation
 */
export async function handleSubmenu(
  chatId: number,
  userId: number,
  menuKey: string,
  messageId?: number
): Promise<boolean> {
  const startTime = Date.now();
  
  // Get menu item data
  const menuItem = await getMenuItem(menuKey);
  if (!menuItem) {
    logger.warn(`Submenu not found: ${menuKey}`);
    return false;
  }
  
  // Navigate to this menu
  navigateTo(userId, menuKey, messageId);
  
  // Load child items and build keyboard
  const keyboard = await buildDynamicKeyboard(menuKey, true);
  
  // Get image (from item, fallback, or default)
  const image = menuItem.image_url 
    || menuItem.image_fallback 
    || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80';
  
  // Build caption
  const title = escapeMarkdownV2(menuItem.title);
  const description = menuItem.description 
    ? `\n\n${escapeMarkdownV2(menuItem.description)}` 
    : '';
  const caption = menuItem.caption 
    ? escapeMarkdownV2(menuItem.caption) 
    : `*${title}*${description}\n\n👇 *Выберите действие:*`;
  
  // Send or edit message
  await deleteAndSendNewMenuPhoto(
    chatId,
    userId,
    image,
    caption,
    { inline_keyboard: keyboard },
    menuKey
  );
  
  // Log action
  await logBotAction(userId, chatId, 'submenu_open', {
    menu_key: menuKey,
    response_time_ms: Date.now() - startTime
  });
  
  return true;
}

/**
 * Get main menu items for dashboard
 */
export async function getMainMenuKeyboard(): Promise<InlineKeyboardButton[][]> {
  return buildDynamicKeyboard('main', false);
}
