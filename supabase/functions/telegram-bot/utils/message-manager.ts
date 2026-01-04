/**
 * Message Manager - Advanced message lifecycle management
 * Handles auto-replace, auto-delete, message queuing, and cleanup
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { deleteMessage, editMessageText, editMessageMedia } from '../telegram-api.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('message-manager');

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

// ============================================================================
// Types
// ============================================================================

export interface ManagedMessage {
  chatId: number;
  messageId: number;
  type: MessageType;
  category: MessageCategory;
  createdAt: number;
  expiresAt?: number;
  persistent?: boolean;
  metadata?: Record<string, any>;
}

export type MessageType = 'menu' | 'notification' | 'status' | 'content' | 'temp';
export type MessageCategory = 
  | 'main_menu'
  | 'library'
  | 'projects'
  | 'settings'
  | 'generation'
  | 'upload'
  | 'analysis'
  | 'help'
  | 'error'
  | 'success'
  | 'loading'
  | 'temp';

export interface MessageQueueItem {
  chatId: number;
  priority: number;
  action: () => Promise<number | null>;
  onSuccess?: (messageId: number) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// Message Manager Class
// ============================================================================

export class MessageManager {
  private messageCache: Map<number, ManagedMessage[]>;
  private cleanupTimers: Map<string, number>;
  private messageQueue: MessageQueueItem[];
  private isProcessingQueue: boolean;

  constructor() {
    this.messageCache = new Map();
    this.cleanupTimers = new Map();
    this.messageQueue = [];
    this.isProcessingQueue = false;
    
    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Track a new message
   */
  async trackMessage(message: ManagedMessage): Promise<void> {
    const chatMessages = this.messageCache.get(message.chatId) || [];
    chatMessages.push(message);
    this.messageCache.set(message.chatId, chatMessages);
    
    // Set cleanup timer if expiration is set
    if (message.expiresAt && !message.persistent) {
      const delay = message.expiresAt - Date.now();
      if (delay > 0) {
        this.scheduleCleanup(message.chatId, message.messageId, delay);
      }
    }
    
    // Auto-replace logic: delete previous messages of the same category
    if (this.shouldAutoReplace(message.type, message.category)) {
      await this.replacePreviousMessages(message.chatId, message.category, message.messageId);
    }
    
    logger.debug('Message tracked', {
      chatId: message.chatId,
      messageId: message.messageId,
      type: message.type,
      category: message.category
    });
  }

  /**
   * Get tracked messages for a chat
   */
  getMessages(chatId: number, filter?: {
    type?: MessageType;
    category?: MessageCategory;
  }): ManagedMessage[] {
    const messages = this.messageCache.get(chatId) || [];
    
    if (!filter) return messages;
    
    return messages.filter(msg => {
      if (filter.type && msg.type !== filter.type) return false;
      if (filter.category && msg.category !== filter.category) return false;
      return true;
    });
  }

  /**
   * Delete a tracked message
   */
  async deleteTrackedMessage(
    chatId: number,
    messageId: number,
    options?: { silent?: boolean }
  ): Promise<boolean> {
    try {
      // Delete from Telegram
      await deleteMessage(chatId, messageId);
      
      // Remove from cache
      this.removeFromCache(chatId, messageId);
      
      // Cancel cleanup timer
      this.cancelCleanup(chatId, messageId);
      
      if (!options?.silent) {
        logger.debug('Message deleted', { chatId, messageId });
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to delete message', error, { chatId, messageId });
      return false;
    }
  }

  /**
   * Delete all messages in a category
   */
  async deleteCategory(
    chatId: number,
    category: MessageCategory,
    options?: { except?: number }
  ): Promise<number> {
    const messages = this.getMessages(chatId, { category });
    let deletedCount = 0;
    
    for (const msg of messages) {
      if (options?.except && msg.messageId === options.except) {
        continue;
      }
      
      const deleted = await this.deleteTrackedMessage(chatId, msg.messageId, { silent: true });
      if (deleted) deletedCount++;
    }
    
    logger.info('Category messages deleted', {
      chatId,
      category,
      deletedCount
    });
    
    return deletedCount;
  }

  /**
   * Delete all temporary messages for a chat
   */
  async deleteTemporary(chatId: number): Promise<number> {
    const messages = this.getMessages(chatId, { type: 'temp' });
    let deletedCount = 0;
    
    for (const msg of messages) {
      const deleted = await this.deleteTrackedMessage(chatId, msg.messageId, { silent: true });
      if (deleted) deletedCount++;
    }
    
    logger.info('Temporary messages deleted', { chatId, deletedCount });
    return deletedCount;
  }

  /**
   * Delete expired messages
   */
  async deleteExpired(chatId?: number): Promise<number> {
    const now = Date.now();
    let deletedCount = 0;
    
    const chatsToCheck = chatId 
      ? [chatId]
      : Array.from(this.messageCache.keys());
    
    for (const cid of chatsToCheck) {
      const messages = this.messageCache.get(cid) || [];
      
      for (const msg of messages) {
        if (msg.expiresAt && msg.expiresAt <= now && !msg.persistent) {
          const deleted = await this.deleteTrackedMessage(cid, msg.messageId, { silent: true });
          if (deleted) deletedCount++;
        }
      }
    }
    
    if (deletedCount > 0) {
      logger.info('Expired messages deleted', { deletedCount });
    }
    
    return deletedCount;
  }

  /**
   * Queue a message for sending
   */
  queueMessage(item: MessageQueueItem): void {
    this.messageQueue.push(item);
    this.messageQueue.sort((a, b) => b.priority - a.priority);
    
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Clear all messages for a chat
   */
  async clearChat(chatId: number, options?: {
    keepPersistent?: boolean;
  }): Promise<number> {
    const messages = this.messageCache.get(chatId) || [];
    let deletedCount = 0;
    
    for (const msg of messages) {
      if (options?.keepPersistent && msg.persistent) {
        continue;
      }
      
      const deleted = await this.deleteTrackedMessage(chatId, msg.messageId, { silent: true });
      if (deleted) deletedCount++;
    }
    
    logger.info('Chat messages cleared', { chatId, deletedCount });
    return deletedCount;
  }

  /**
   * Update message metadata
   */
  updateMetadata(
    chatId: number,
    messageId: number,
    metadata: Record<string, any>
  ): void {
    const messages = this.messageCache.get(chatId);
    if (!messages) return;
    
    const message = messages.find(m => m.messageId === messageId);
    if (message) {
      message.metadata = { ...message.metadata, ...metadata };
    }
  }

  /**
   * Mark message as persistent
   */
  markPersistent(chatId: number, messageId: number): void {
    const messages = this.messageCache.get(chatId);
    if (!messages) return;
    
    const message = messages.find(m => m.messageId === messageId);
    if (message) {
      message.persistent = true;
      this.cancelCleanup(chatId, messageId);
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Check if messages of this type should auto-replace previous ones
   */
  private shouldAutoReplace(type: MessageType, category: MessageCategory): boolean {
    // Menu messages always replace previous menu messages
    if (type === 'menu') return true;
    
    // Status messages replace previous status messages
    if (type === 'status') return true;
    
    // Loading messages replace previous loading messages
    if (category === 'loading') return true;
    
    return false;
  }

  /**
   * Replace previous messages of the same category
   */
  private async replacePreviousMessages(
    chatId: number,
    category: MessageCategory,
    exceptMessageId: number
  ): Promise<void> {
    const messages = this.getMessages(chatId, { category });
    
    for (const msg of messages) {
      if (msg.messageId !== exceptMessageId && !msg.persistent) {
        await this.deleteTrackedMessage(chatId, msg.messageId, { silent: true });
      }
    }
  }

  /**
   * Remove message from cache
   */
  private removeFromCache(chatId: number, messageId: number): void {
    const messages = this.messageCache.get(chatId);
    if (!messages) return;
    
    const filtered = messages.filter(m => m.messageId !== messageId);
    
    if (filtered.length === 0) {
      this.messageCache.delete(chatId);
    } else {
      this.messageCache.set(chatId, filtered);
    }
  }

  /**
   * Schedule cleanup for a message
   */
  private scheduleCleanup(chatId: number, messageId: number, delay: number): void {
    const key = `${chatId}_${messageId}`;
    
    const timerId = setTimeout(async () => {
      await this.deleteTrackedMessage(chatId, messageId, { silent: true });
      this.cleanupTimers.delete(key);
    }, delay);
    
    this.cleanupTimers.set(key, timerId as unknown as number);
  }

  /**
   * Cancel scheduled cleanup
   */
  private cancelCleanup(chatId: number, messageId: number): void {
    const key = `${chatId}_${messageId}`;
    const timerId = this.cleanupTimers.get(key);
    
    if (timerId) {
      clearTimeout(timerId);
      this.cleanupTimers.delete(key);
    }
  }

  /**
   * Process message queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    while (this.messageQueue.length > 0) {
      const item = this.messageQueue.shift();
      if (!item) continue;
      
      try {
        const messageId = await item.action();
        if (messageId && item.onSuccess) {
          item.onSuccess(messageId);
        }
      } catch (error) {
        if (item.onError) {
          item.onError(error as Error);
        } else {
          logger.error('Queue item failed', error);
        }
      }
      
      // Small delay between messages to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Start periodic cleanup of expired messages
   */
  private startPeriodicCleanup(): void {
    setInterval(async () => {
      await this.deleteExpired();
      
      // Clean up empty caches
      for (const [chatId, messages] of this.messageCache.entries()) {
        if (messages.length === 0) {
          this.messageCache.delete(chatId);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const messageManager = new MessageManager();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Track a message with automatic expiration
 */
export async function trackMessage(
  chatId: number,
  messageId: number,
  type: MessageType,
  category: MessageCategory,
  options?: {
    expiresIn?: number; // milliseconds
    persistent?: boolean;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  const expiresAt = options?.expiresIn 
    ? Date.now() + options.expiresIn
    : undefined;
  
  await messageManager.trackMessage({
    chatId,
    messageId,
    type,
    category,
    createdAt: Date.now(),
    expiresAt,
    persistent: options?.persistent,
    metadata: options?.metadata
  });
}

/**
 * Send and track a temporary message
 */
export async function sendTemporaryMessage(
  chatId: number,
  sendFn: () => Promise<number | null>,
  expiresIn: number = 10000 // 10 seconds default
): Promise<number | null> {
  const messageId = await sendFn();
  
  if (messageId) {
    await trackMessage(chatId, messageId, 'temp', 'temp', { expiresIn });
  }
  
  return messageId;
}

/**
 * Delete all temporary messages for a user
 */
export async function cleanupTemporary(chatId: number): Promise<number> {
  return await messageManager.deleteTemporary(chatId);
}

/**
 * Delete messages in a category except one
 */
export async function replaceInCategory(
  chatId: number,
  category: MessageCategory,
  newMessageId: number
): Promise<void> {
  await messageManager.deleteCategory(chatId, category, { except: newMessageId });
}
