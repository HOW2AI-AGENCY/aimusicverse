/**
 * Advanced Menu Manager for Telegram Bot
 * Handles multi-level navigation, auto-replace, auto-delete, and context preservation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { sendMessage, editMessageText, editMessageMedia, deleteMessage } from '../telegram-api.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('menu-manager');

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Menu {
  id: string;
  title: string;
  description?: string;
  mediaType?: 'photo' | 'video' | 'animation';
  mediaUrl?: string;
  buttons: MenuButton[][];
  context: MenuContext;
  options: MenuOptions;
}

export interface MenuButton {
  text: string;
  action: 'callback' | 'url' | 'webapp' | 'switch_inline';
  data: string;
  emoji?: string;
}

export interface MenuContext {
  path: string[];                      // Navigation path: ['main', 'generate', 'style']
  data: Record<string, any>;           // User selections and state
  timestamp: number;
  parentMenuId?: string;
}

export interface MenuOptions {
  autoReplace: boolean;                // Replace previous menu message
  autoDelete: boolean;                 // Delete on completion/exit
  timeout?: number;                    // Auto-cleanup timeout (seconds)
  persistent?: boolean;                // Keep until explicit action
  parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML';
}

interface MenuState {
  userId: number;
  chatId: number;
  messageIds: number[];
  contexts: MenuContext[];
  currentMenuId?: string;
  lastUpdated: number;
}

// ============================================================================
// MenuManager Class
// ============================================================================

export class MenuManager {
  private stateCache: Map<number, MenuState>;
  private cleanupTimers: Map<number, number>;

  constructor() {
    this.stateCache = new Map();
    this.cleanupTimers = new Map();
    
    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Show a menu to the user
   */
  async showMenu(
    chatId: number,
    userId: number,
    menu: Menu
  ): Promise<number | null> {
    try {
      // Load or initialize state
      let state = await this.getState(userId, chatId);
      
      // Auto-replace previous menu if enabled
      if (menu.options.autoReplace && state.messageIds.length > 0) {
        await this.deleteLastMenu(state);
      }
      
      // Send new menu
      const messageId = await this.sendMenu(chatId, menu);
      
      if (!messageId) {
        logger.error('Failed to send menu', { chatId, userId, menuId: menu.id });
        return null;
      }
      
      // Update state
      state = await this.pushToStack(
        userId,
        chatId,
        messageId,
        menu.id,
        menu.context
      );
      
      // Setup auto-cleanup if timeout specified
      if (menu.options.timeout && menu.options.timeout > 0) {
        this.scheduleCleanup(userId, menu.options.timeout);
      }
      
      logger.debug('Menu shown', {
        chatId,
        userId,
        menuId: menu.id,
        messageId,
        path: menu.context.path
      });
      
      return messageId;
    } catch (error) {
      logger.error('Error showing menu', error);
      return null;
    }
  }

  /**
   * Update an existing menu
   */
  async updateMenu(
    chatId: number,
    messageId: number,
    menu: Partial<Menu>
  ): Promise<boolean> {
    try {
      if (menu.mediaUrl && menu.mediaType) {
        // Update with media
        await editMessageMedia(chatId, messageId, {
          type: menu.mediaType,
          media: menu.mediaUrl,
          caption: menu.description || menu.title || '',
        });
      } else {
        // Update text only
        const text = this.formatMenuText(menu.title || '', menu.description);
        const keyboard = menu.buttons ? this.buildKeyboard(menu.buttons) : undefined;
        await editMessageText(chatId, messageId, text, keyboard);
      }
      
      logger.debug('Menu updated', { chatId, messageId });
      return true;
    } catch (error) {
      logger.error('Error updating menu', error);
      return false;
    }
  }

  /**
   * Navigate back to previous menu
   */
  async navigateBack(
    chatId: number,
    userId: number
  ): Promise<boolean> {
    try {
      let state = await this.getState(userId, chatId);
      
      // Need at least 2 contexts to go back
      if (state.contexts.length < 2) {
        logger.warn('Cannot navigate back - at root', { userId, chatId });
        return false;
      }
      
      // Delete current menu
      await this.deleteLastMenu(state);
      
      // Pop current context
      state = await this.popFromStack(userId, chatId);
      
      // Get previous context
      const prevContext = state.contexts[state.contexts.length - 1];
      
      // Rebuild and show previous menu
      const menu = await this.buildMenuFromContext(prevContext);
      if (menu) {
        await this.showMenu(chatId, userId, menu);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error navigating back', error);
      return false;
    }
  }

  /**
   * Clean up all menus for a user
   */
  async cleanup(
    userId: number,
    chatId: number
  ): Promise<void> {
    try {
      const state = await this.getState(userId, chatId);
      
      // Delete all messages
      for (const msgId of state.messageIds) {
        try {
          await deleteMessage(chatId, msgId);
        } catch (error) {
          logger.warn('Failed to delete message', { msgId, error });
        }
      }
      
      // Clear state
      await this.clearState(userId);
      
      // Cancel cleanup timer
      if (this.cleanupTimers.has(userId)) {
        clearTimeout(this.cleanupTimers.get(userId)!);
        this.cleanupTimers.delete(userId);
      }
      
      logger.debug('Cleanup completed', { userId, chatId });
    } catch (error) {
      logger.error('Error during cleanup', error);
    }
  }

  /**
   * Get current context for a user
   */
  async getCurrentContext(
    userId: number,
    chatId: number
  ): Promise<MenuContext | null> {
    try {
      const state = await this.getState(userId, chatId);
      if (state.contexts.length === 0) return null;
      return state.contexts[state.contexts.length - 1];
    } catch (error) {
      logger.error('Error getting current context', error);
      return null;
    }
  }

  /**
   * Get navigation breadcrumb
   */
  async getBreadcrumb(
    userId: number,
    chatId: number
  ): Promise<string> {
    try {
      const context = await this.getCurrentContext(userId, chatId);
      if (!context) return '🏠 Главная';
      
      const pathNames: Record<string, string> = {
        'main': '🏠 Главная',
        'generate': '🎼 Генерация',
        'library': '📚 Библиотека',
        'projects': '📁 Проекты',
        'settings': '⚙️ Настройки',
        'style_selection': '🎨 Выбор стиля',
        'vocal_type': '🎤 Тип вокала',
        'mood_selection': '😊 Настроение',
        'tempo_selection': '⏱️ Темп',
      };
      
      const breadcrumb = context.path
        .map(p => pathNames[p] || p)
        .join(' → ');
      
      return breadcrumb;
    } catch (error) {
      logger.error('Error building breadcrumb', error);
      return '🏠 Главная';
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Get state from cache or database
   */
  private async getState(userId: number, chatId: number): Promise<MenuState> {
    // Check cache first
    if (this.stateCache.has(userId)) {
      const cached = this.stateCache.get(userId)!;
      // Verify cache is for the same chat
      if (cached.chatId === chatId) {
        return cached;
      }
    }
    
    // Load from database
    const { data, error } = await supabase
      .from('telegram_menu_state')
      .select('menu_stack, context_stack')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      // Initialize new state
      const newState: MenuState = {
        userId,
        chatId,
        messageIds: [],
        contexts: [],
        lastUpdated: Date.now()
      };
      this.stateCache.set(userId, newState);
      return newState;
    }
    
    // Parse from database
    const state: MenuState = {
      userId,
      chatId,
      messageIds: data.menu_stack || [],
      contexts: data.context_stack || [],
      lastUpdated: Date.now()
    };
    
    this.stateCache.set(userId, state);
    return state;
  }

  /**
   * Save state to database
   */
  private async saveState(state: MenuState): Promise<void> {
    try {
      // Get user_id from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('telegram_id', state.userId)
        .single();
      
      if (!profile) {
        logger.warn('Profile not found for telegram_id', { telegram_id: state.userId });
        return;
      }
      
      const { error } = await supabase
        .from('telegram_menu_state')
        .upsert({
          user_id: profile.user_id,
          menu_stack: state.messageIds,
          context_stack: state.contexts,
          last_updated: new Date().toISOString()
        });
      
      if (error) {
        logger.error('Failed to save menu state', error);
      }
      
      // Update cache
      this.stateCache.set(state.userId, state);
    } catch (error) {
      logger.error('Error saving state', error);
    }
  }

  /**
   * Push menu to stack
   */
  private async pushToStack(
    userId: number,
    chatId: number,
    messageId: number,
    menuId: string,
    context: MenuContext
  ): Promise<MenuState> {
    const state = await this.getState(userId, chatId);
    
    state.messageIds.push(messageId);
    state.contexts.push(context);
    state.currentMenuId = menuId;
    state.lastUpdated = Date.now();
    
    await this.saveState(state);
    return state;
  }

  /**
   * Pop menu from stack
   */
  private async popFromStack(userId: number, chatId: number): Promise<MenuState> {
    const state = await this.getState(userId, chatId);
    
    if (state.messageIds.length > 0) {
      state.messageIds.pop();
    }
    if (state.contexts.length > 0) {
      state.contexts.pop();
    }
    
    state.lastUpdated = Date.now();
    
    await this.saveState(state);
    return state;
  }

  /**
   * Clear all state for user
   */
  private async clearState(userId: number): Promise<void> {
    this.stateCache.delete(userId);
    
    // Get user_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();
    
    if (profile) {
      await supabase
        .from('telegram_menu_state')
        .delete()
        .eq('user_id', profile.user_id);
    }
  }

  /**
   * Send menu message
   */
  private async sendMenu(chatId: number, menu: Menu): Promise<number | null> {
    try {
      const text = this.formatMenuText(menu.title, menu.description);
      const keyboard = this.buildKeyboard(menu.buttons);
      
      if (menu.mediaUrl && menu.mediaType) {
        // Send with media
        // Note: Telegram API sendPhoto/sendVideo doesn't return message_id directly in our wrapper
        // We need to enhance the telegram-api.ts wrapper to return message_id
        const result = await sendMessage(chatId, text, keyboard);
        // For now, return null - needs telegram-api.ts enhancement
        return null;
      } else {
        // Send text message
        const result = await sendMessage(chatId, text, keyboard);
        // Same issue - needs telegram-api.ts to return message_id
        return null;
      }
    } catch (error) {
      logger.error('Error sending menu', error);
      return null;
    }
  }

  /**
   * Delete last menu from state
   */
  private async deleteLastMenu(state: MenuState): Promise<void> {
    if (state.messageIds.length === 0) return;
    
    const lastMessageId = state.messageIds[state.messageIds.length - 1];
    try {
      await deleteMessage(state.chatId, lastMessageId);
    } catch (error) {
      logger.warn('Failed to delete last menu message', { messageId: lastMessageId, error });
    }
  }

  /**
   * Build menu from context (for navigation back)
   */
  private async buildMenuFromContext(context: MenuContext): Promise<Menu | null> {
    // This is a placeholder - actual implementation would
    // reconstruct the menu based on the context path and data
    logger.warn('buildMenuFromContext not fully implemented', { context });
    return null;
  }

  /**
   * Format menu text
   */
  private formatMenuText(title: string, description?: string): string {
    let text = `*${this.escapeMarkdown(title)}*`;
    if (description) {
      text += `\n\n${this.escapeMarkdown(description)}`;
    }
    return text;
  }

  /**
   * Build inline keyboard from buttons
   */
  private buildKeyboard(buttons: MenuButton[][]): any {
    return {
      inline_keyboard: buttons.map(row =>
        row.map(btn => {
          const button: any = {
            text: btn.emoji ? `${btn.emoji} ${btn.text}` : btn.text
          };
          
          switch (btn.action) {
            case 'callback':
              button.callback_data = btn.data;
              break;
            case 'url':
              button.url = btn.data;
              break;
            case 'webapp':
              button.web_app = { url: btn.data };
              break;
            case 'switch_inline':
              button.switch_inline_query = btn.data;
              break;
          }
          
          return button;
        })
      )
    };
  }

  /**
   * Escape MarkdownV2 special characters
   */
  private escapeMarkdown(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
  }

  /**
   * Schedule auto-cleanup
   */
  private scheduleCleanup(userId: number, timeoutSeconds: number): void {
    // Cancel existing timer
    if (this.cleanupTimers.has(userId)) {
      clearTimeout(this.cleanupTimers.get(userId)!);
    }
    
    // Schedule new cleanup
    const timer = setTimeout(async () => {
      const state = this.stateCache.get(userId);
      if (state) {
        await this.cleanup(userId, state.chatId);
      }
      this.cleanupTimers.delete(userId);
    }, timeoutSeconds * 1000);
    
    this.cleanupTimers.set(userId, timer as any);
  }

  /**
   * Start periodic cleanup of expired states
   */
  private startPeriodicCleanup(): void {
    setInterval(async () => {
      const now = Date.now();
      const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
      
      for (const [userId, state] of this.stateCache.entries()) {
        if (now - state.lastUpdated > MAX_AGE) {
          await this.cleanup(userId, state.chatId);
        }
      }
    }, 60 * 60 * 1000); // Check every hour
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const menuManager = new MenuManager();
