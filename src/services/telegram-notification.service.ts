/**
 * Telegram Notification Service
 * Robust client-side wrapper for sending Telegram notifications with retry and queue
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type TelegramNotificationType = 
  | 'generation_complete'
  | 'generation_failed'
  | 'stems_ready'
  | 'cover_ready'
  | 'extend_ready'
  | 'system'
  | 'social';

export interface TelegramNotificationPayload {
  type: TelegramNotificationType;
  userId?: string;
  chatId?: number;
  title?: string;
  message?: string;
  audioUrl?: string;
  coverUrl?: string;
  trackId?: string;
  duration?: number;
  performer?: string;
  replyMarkup?: unknown;
  priority?: 'high' | 'normal' | 'low';
}

interface QueuedNotification {
  id: string;
  payload: TelegramNotificationPayload;
  attempts: number;
  lastAttempt?: number;
  status: 'pending' | 'sending' | 'failed' | 'sent';
}

class TelegramNotificationService {
  private queue: QueuedNotification[] = [];
  private isProcessing = false;
  private circuitBreakerOpen = false;
  private consecutiveFailures = 0;
  private readonly maxConsecutiveFailures = 5;
  private readonly circuitBreakerResetTime = 60000; // 1 minute
  private lastCircuitBreakerTrip = 0;
  private readonly maxRetries = 3;
  private readonly retryDelays = [1000, 5000, 15000]; // exponential backoff

  /**
   * Send a notification with automatic retry and queue management
   */
  async send(payload: TelegramNotificationPayload): Promise<boolean> {
    const notificationId = crypto.randomUUID();
    
    // Add to queue
    this.queue.push({
      id: notificationId,
      payload,
      attempts: 0,
      status: 'pending',
    });

    // Sort by priority
    this.sortQueue();
    
    // Start processing if not already
    this.processQueue();
    
    return true;
  }

  /**
   * Send notification immediately (bypasses queue)
   */
  async sendImmediate(payload: TelegramNotificationPayload): Promise<{ success: boolean; error?: string }> {
    if (this.isCircuitBreakerOpen()) {
      logger.warn('Telegram circuit breaker open, skipping notification');
      return { success: false, error: 'Circuit breaker open' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
        body: payload,
      });

      if (error) {
        this.recordFailure();
        logger.error('Telegram notification failed', error);
        return { success: false, error: error.message };
      }

      if (data?.skipped) {
        logger.info('Telegram notification skipped', { reason: data.reason });
        return { success: true }; // Not an error, just skipped
      }

      this.recordSuccess();
      return { success: true };
    } catch (error) {
      this.recordFailure();
      logger.error('Telegram notification error', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send generation completion notification
   */
  async notifyGenerationComplete(params: {
    userId: string;
    chatId?: number;
    trackTitle: string;
    trackId: string;
    audioUrl: string;
    coverUrl?: string;
    duration?: number;
  }): Promise<boolean> {
    return this.send({
      type: 'generation_complete',
      userId: params.userId,
      chatId: params.chatId,
      title: params.trackTitle,
      trackId: params.trackId,
      audioUrl: params.audioUrl,
      coverUrl: params.coverUrl,
      duration: params.duration,
      priority: 'high',
    });
  }

  /**
   * Send generation failed notification
   */
  async notifyGenerationFailed(params: {
    userId: string;
    chatId?: number;
    trackTitle?: string;
    errorMessage?: string;
  }): Promise<boolean> {
    return this.send({
      type: 'generation_failed',
      userId: params.userId,
      chatId: params.chatId,
      title: params.trackTitle,
      message: params.errorMessage || 'Ошибка генерации трека',
      priority: 'high',
    });
  }

  /**
   * Send stems ready notification
   */
  async notifyStemsReady(params: {
    userId: string;
    chatId?: number;
    trackTitle: string;
    trackId: string;
    stemCount: number;
  }): Promise<boolean> {
    return this.send({
      type: 'stems_ready',
      userId: params.userId,
      chatId: params.chatId,
      title: params.trackTitle,
      trackId: params.trackId,
      message: `Стемы готовы: ${params.stemCount} дорожек`,
      priority: 'normal',
    });
  }

  private sortQueue(): void {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    this.queue.sort((a, b) => {
      const priorityA = priorityOrder[a.payload.priority || 'normal'];
      const priorityB = priorityOrder[b.payload.priority || 'normal'];
      return priorityA - priorityB;
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;

    while (this.queue.length > 0) {
      // Check circuit breaker
      if (this.isCircuitBreakerOpen()) {
        logger.warn('Circuit breaker open, pausing queue processing');
        await this.sleep(this.circuitBreakerResetTime);
        continue;
      }

      const notification = this.queue.find(n => n.status === 'pending');
      if (!notification) break;

      notification.status = 'sending';
      notification.attempts++;
      notification.lastAttempt = Date.now();

      const result = await this.sendImmediate(notification.payload);

      if (result.success) {
        notification.status = 'sent';
        this.removeFromQueue(notification.id);
      } else if (notification.attempts >= this.maxRetries) {
        notification.status = 'failed';
        await this.saveToDeadLetterQueue(notification);
        this.removeFromQueue(notification.id);
      } else {
        notification.status = 'pending';
        // Wait before retry with exponential backoff
        const delay = this.retryDelays[notification.attempts - 1] || 15000;
        await this.sleep(delay);
      }

      // Rate limiting: small delay between notifications
      await this.sleep(100);
    }

    this.isProcessing = false;
  }

  private removeFromQueue(id: string): void {
    this.queue = this.queue.filter(n => n.id !== id);
  }

  private async saveToDeadLetterQueue(notification: QueuedNotification): Promise<void> {
    try {
      // Log failed notification - RLS prevents direct insert from client
      logger.error('Notification permanently failed after retries', {
        type: notification.payload.type,
        chatId: notification.payload.chatId,
        attempts: notification.attempts,
      });
    } catch (error) {
      logger.error('DLQ save error', error);
    }
  }

  private isCircuitBreakerOpen(): boolean {
    if (!this.circuitBreakerOpen) return false;
    
    // Check if reset time has passed
    if (Date.now() - this.lastCircuitBreakerTrip > this.circuitBreakerResetTime) {
      this.circuitBreakerOpen = false;
      this.consecutiveFailures = 0;
      logger.info('Circuit breaker reset');
      return false;
    }
    
    return true;
  }

  private recordFailure(): void {
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
      this.circuitBreakerOpen = true;
      this.lastCircuitBreakerTrip = Date.now();
      logger.warn('Circuit breaker tripped', { failures: this.consecutiveFailures });
    }
  }

  private recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue status for monitoring
   */
  getQueueStatus(): {
    queueLength: number;
    circuitBreakerOpen: boolean;
    consecutiveFailures: number;
  } {
    return {
      queueLength: this.queue.length,
      circuitBreakerOpen: this.circuitBreakerOpen,
      consecutiveFailures: this.consecutiveFailures,
    };
  }
}

// Export singleton instance
export const telegramNotificationService = new TelegramNotificationService();

// Export convenience functions
export const sendTelegramNotification = (payload: TelegramNotificationPayload) => 
  telegramNotificationService.send(payload);

export const notifyTelegramGenerationComplete = (params: Parameters<typeof telegramNotificationService.notifyGenerationComplete>[0]) =>
  telegramNotificationService.notifyGenerationComplete(params);

export const notifyTelegramGenerationFailed = (params: Parameters<typeof telegramNotificationService.notifyGenerationFailed>[0]) =>
  telegramNotificationService.notifyGenerationFailed(params);
