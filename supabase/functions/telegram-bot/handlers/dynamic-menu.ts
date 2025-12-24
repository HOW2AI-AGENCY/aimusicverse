/**
 * Dynamic Menu Handler
 * Loads menu structure from database and builds keyboards dynamically
 * Supports nested menus with rich text formatting
 */

import { getSupabaseClient } from '../core/supabase-client.ts';
import { sendPhoto, editMessageMedia, escapeMarkdownV2 } from '../telegram-api.ts';
import { navigateTo, getPreviousRoute } from '../core/navigation-state.ts';
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

interface SubscriptionTierLite {
  code: string;
  name: Record<string, string>;
  icon_emoji: string;
  price_usd: number;
  price_stars: number;
  custom_pricing: boolean;
  min_purchase_amount: number;
  display_order: number;
  is_active: boolean;
}

// Default images for menu sections
const DEFAULT_IMAGES: Record<string, string> = {
  main: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80',
  generate: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80',
  library: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
  projects: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&q=80',
  analyze: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  settings: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&q=80',
  help: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80'
};

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
 * Load subscription tiers (used for tariffs menu)
 */
async function loadTariffTiers(): Promise<SubscriptionTierLite[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('subscription_tiers')
    .select('code,name,icon_emoji,price_usd,price_stars,custom_pricing,min_purchase_amount,display_order,is_active')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    logger.error('Failed to load subscription tiers', error);
    return [];
  }

  return (data || []) as SubscriptionTierLite[];
}

/**
 * Create button based on action type
 */
function createButton(item: MenuItem): InlineKeyboardButton {
  const title = item.title?.trim() || '';
  const titleHasLeadingEmoji = /^[\p{Extended_Pictographic}]/u.test(title);
  const text = item.icon_emoji && !titleHasLeadingEmoji ? `${item.icon_emoji} ${title}` : title;

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
 * Get button text length (including emoji)
 */
function getButtonTextLength(item: MenuItem): number {
  const text = item.icon_emoji ? `${item.icon_emoji} ${item.title}` : item.title;
  return text.length;
}

/**
 * Max characters for buttons to be placed side-by-side
 * Buttons with longer text will be placed on their own row
 */
const MAX_CHARS_FOR_PAIRING = 12;

/**
 * Build keyboard from menu items
 * Groups items by row_position and respects column_span
 * Automatically splits long text buttons onto separate rows
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
    
    // If only 1 item in row, just add it
    if (rowItems.length === 1) {
      keyboard.push([createButton(rowItems[0])]);
      continue;
    }
    
    // Check if all items in this row have short enough titles to be paired
    const allShort = rowItems.every(item => getButtonTextLength(item) <= MAX_CHARS_FOR_PAIRING);
    
    if (allShort && rowItems.length <= 3) {
      // All buttons are short enough, place them side by side
      const row: InlineKeyboardButton[] = [];
      for (const item of rowItems) {
        row.push(createButton(item));
      }
      keyboard.push(row);
    } else {
      // Some buttons are too long, place each on its own row
      for (const item of rowItems) {
        keyboard.push([createButton(item)]);
      }
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
  // Special menu: tariffs should show real prices from subscription_tiers
  if (parentKey === 'tariffs') {
    const tiers = await loadTariffTiers();

    const keyboard: InlineKeyboardButton[][] = tiers.map(tier => {
      const name = tier.name?.ru || tier.name?.en || tier.code;

      let text: string;
      if (tier.code === 'free' || (tier.price_usd ?? 0) <= 0) {
        text = `${tier.icon_emoji} ${name} — Бесплатно`;
      } else if (tier.custom_pricing) {
        text = `${tier.icon_emoji} ${name} — от $${tier.min_purchase_amount}/мес`;
      } else {
        text = `${tier.icon_emoji} ${name} — $${tier.price_usd} / ${tier.price_stars}⭐`;
      }

      return [
        {
          text,
          callback_data: tier.code === 'enterprise' ? 'tariff_contact_enterprise' : `tariff_info_${tier.code}`,
        },
      ];
    });

    keyboard.push([
      {
        text: '📊 Сравнить тарифы',
        web_app: { url: `${BOT_CONFIG.miniAppUrl}/pricing` },
      },
    ]);

    if (includeBack) {
      const parentItem = await getMenuItem(parentKey);
      const backTarget = parentItem?.parent_key || 'main';

      keyboard.push([
        {
          text: '⬅️ Назад',
          callback_data: backTarget === 'main' ? 'main_menu' : `menu_${backTarget}`,
        },
      ]);
    }

    return keyboard;
  }

  const items = await loadMenuItems(parentKey);
  const keyboard = buildKeyboard(items);

  // Add back button for submenus
  if (includeBack && parentKey !== 'main') {
    const parentItem = await getMenuItem(parentKey);
    const backTarget = parentItem?.parent_key || 'main';

    keyboard.push([
      {
        text: '⬅️ Назад',
        callback_data: backTarget === 'main' ? 'main_menu' : `menu_${backTarget}`,
      },
    ]);
  }

  return keyboard;
}

/**
 * Format caption with rich text styling
 */
function formatMenuCaption(item: MenuItem, hasChildren: boolean): string {
  const parts: string[] = [];
  
  // Title with emoji
  const emoji = item.icon_emoji || '📌';
  const title = escapeMarkdownV2(item.title);
  parts.push(`${emoji} *${title}*`);
  
  // Description if available
  if (item.description) {
    parts.push('');
    parts.push(escapeMarkdownV2(item.description));
  }
  
  // Custom caption (already formatted in DB, escape only special chars)
  if (item.caption) {
    parts.push('');
    // Caption may contain MarkdownV2, escape only unescaped special chars
    parts.push(item.caption);
  }
  
  // Footer hint
  if (hasChildren) {
    parts.push('');
    parts.push('👇 _Выберите действие:_');
  }
  
  return parts.join('\n');
}

/**
 * Get menu image with fallbacks
 */
function getMenuImageUrl(item: MenuItem): string {
  return item.image_url 
    || item.image_fallback 
    || DEFAULT_IMAGES[item.menu_key] 
    || DEFAULT_IMAGES.main;
}

/**
 * Handle submenu navigation with rich formatting
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
  
  // Check if this menu has children
  const children = await loadMenuItems(menuKey);
  const hasChildren = children.length > 0;
  
  // Load keyboard with back button for non-main menus
  const keyboard = await buildDynamicKeyboard(menuKey, menuKey !== 'main');
  
  // Get image
  const image = getMenuImageUrl(menuItem);
  
  // Build formatted caption
  const caption = formatMenuCaption(menuItem, hasChildren);
  
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
    has_children: hasChildren,
    response_time_ms: Date.now() - startTime
  });
  
  return true;
}

/**
 * Handle any menu item action (callback, url, webapp, submenu)
 */
export async function handleMenuAction(
  chatId: number,
  userId: number,
  menuKey: string,
  messageId?: number
): Promise<boolean> {
  const menuItem = await getMenuItem(menuKey);
  if (!menuItem) {
    return false;
  }
  
  switch (menuItem.action_type) {
    case 'submenu':
      return handleSubmenu(chatId, userId, menuKey, messageId);
    
    case 'callback':
      // Return false to let the router handle the callback
      return false;
    
    case 'webapp':
    case 'url':
      // These are handled client-side by Telegram
      return true;
    
    default:
      return false;
  }
}

/**
 * Get main menu items for dashboard
 */
export async function getMainMenuKeyboard(): Promise<InlineKeyboardButton[][]> {
  return buildDynamicKeyboard('main', false);
}

/**
 * Navigate back in menu hierarchy
 */
export async function handleMenuBack(
  chatId: number,
  userId: number,
  currentMenuKey: string,
  messageId?: number
): Promise<boolean> {
  const currentItem = await getMenuItem(currentMenuKey);
  const parentKey = currentItem?.parent_key || 'main';
  
  return handleSubmenu(chatId, userId, parentKey, messageId);
}
