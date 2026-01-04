/**
 * Centralized Notification Service
 * Handles de-duplication, rate limiting, and Telegram-aware toasts
 */

import { toast, ExternalToast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'notifications' });

interface NotificationOptions extends ExternalToast {
  dedupe?: boolean;
  dedupeKey?: string;
  dedupeTimeout?: number;
}

// Store for shown notifications to prevent duplicates
const shownNotifications = new Map<string, number>();
const DEDUPE_TIMEOUT_MS = 5000;
const MAX_STORED_KEYS = 50;

/**
 * Check if notification should be de-duplicated
 */
function shouldDedupe(key: string, options?: NotificationOptions): boolean {
  if (!options?.dedupe) return false;
  
  const dedupeKey = options.dedupeKey || key;
  const now = Date.now();
  const lastShown = shownNotifications.get(dedupeKey);
  
  if (lastShown && now - lastShown < (options.dedupeTimeout || DEDUPE_TIMEOUT_MS)) {
    log.debug('Notification deduped', { key: dedupeKey });
    return true;
  }
  
  shownNotifications.set(dedupeKey, now);
  
  // Cleanup old entries
  if (shownNotifications.size > MAX_STORED_KEYS) {
    for (const [k, v] of shownNotifications) {
      if (now - v > DEDUPE_TIMEOUT_MS * 2) {
        shownNotifications.delete(k);
      }
    }
  }
  
  return false;
}

/**
 * Core notification functions with de-duplication
 */
export const notify = {
  success: (message: string, options?: NotificationOptions) => {
    if (shouldDedupe(message, options)) return;
    log.info('Toast: success', { message });
    return toast.success(message, options);
  },
  
  error: (message: string, options?: NotificationOptions) => {
    if (shouldDedupe(message, options)) return;
    log.warn('Toast: error', { message });
    return toast.error(message, options);
  },
  
  info: (message: string, options?: NotificationOptions) => {
    if (shouldDedupe(message, options)) return;
    log.info('Toast: info', { message });
    return toast.info(message, options);
  },
  
  warning: (message: string, options?: NotificationOptions) => {
    if (shouldDedupe(message, options)) return;
    log.info('Toast: warning', { message });
    return toast.warning(message, options);
  },
  
  // === Specialized notifications with auto-deduplication ===
  
  /**
   * Stems ready notification
   */
  stemReady: (trackTitle?: string) => {
    const key = 'stem-ready';
    if (shouldDedupe(key, { dedupe: true, dedupeKey: key, dedupeTimeout: 10000 })) return;
    
    log.info('Stems ready', { trackTitle });
    return toast.success('Стемы готовы! 🎵', {
      description: trackTitle ? `Трек: ${trackTitle}` : undefined,
      duration: 5000,
    });
  },
  
  /**
   * Generation started notification
   */
  generationStarted: (type: 'music' | 'vocals' | 'instrumental' | 'extend' | 'cover' | 'stems' = 'music') => {
    const messages: Record<string, string> = {
      music: 'Генерация трека началась! 🎵',
      vocals: 'Добавление вокала началось! 🎤',
      instrumental: 'Генерация инструментала началась! 🎸',
      extend: 'Расширение трека началось! ➕',
      cover: 'Создание кавера началось! 🎧',
      stems: 'Разделение на стемы началось! 🎛️',
    };
    
    const key = `generation-started-${type}`;
    if (shouldDedupe(key, { dedupe: true, dedupeKey: key, dedupeTimeout: 3000 })) return;
    
    log.info('Generation started', { type });
    return toast.success(messages[type] || messages.music, { duration: 3000 });
  },
  
  /**
   * Generation complete notification
   */
  generationComplete: (type: string, trackTitle?: string) => {
    const key = `generation-complete-${trackTitle || 'unknown'}`;
    if (shouldDedupe(key, { dedupe: true, dedupeKey: key, dedupeTimeout: 5000 })) return;
    
    log.info('Generation complete', { type, trackTitle });
    return toast.success(`${type} завершено! ✨`, {
      description: trackTitle,
      duration: 5000,
    });
  },
  
  /**
   * Generation failed notification
   */
  generationFailed: (error?: string) => {
    const key = 'generation-failed';
    if (shouldDedupe(key, { dedupe: true, dedupeKey: key, dedupeTimeout: 5000 })) return;
    
    log.error('Generation failed', { error });
    return toast.error('Ошибка генерации', {
      description: error || 'Попробуйте еще раз',
      duration: 6000,
    });
  },
  
  /**
   * Track added to favorites
   */
  trackLiked: (isLiked: boolean) => {
    const key = `track-liked-${isLiked}`;
    if (shouldDedupe(key, { dedupe: true, dedupeKey: key, dedupeTimeout: 2000 })) return;
    
    return toast.success(isLiked ? '❤️ Добавлено в избранное' : '💔 Удалено из избранного', {
      duration: 2000,
    });
  },
  
  /**
   * Track added to queue
   */
  addedToQueue: () => {
    const key = 'added-to-queue';
    if (shouldDedupe(key, { dedupe: true, dedupeKey: key, dedupeTimeout: 2000 })) return;
    
    return toast.success('Добавлено в очередь', { duration: 2000 });
  },
  
  /**
   * Track deleted
   */
  trackDeleted: () => {
    const key = 'track-deleted';
    if (shouldDedupe(key, { dedupe: true, dedupeKey: key, dedupeTimeout: 2000 })) return;
    
    return toast.success('Трек удален', { duration: 2000 });
  },
  
  /**
   * Version switched
   */
  versionSwitched: (versionLabel: string) => {
    const key = 'version-switched';
    if (shouldDedupe(key, { dedupe: true, dedupeKey: key, dedupeTimeout: 1500 })) return;
    
    return toast.success(`Версия ${versionLabel}`, { duration: 1500 });
  },
  
  /**
   * Credits low warning
   */
  creditsLow: (remaining: number) => {
    const key = 'credits-low';
    if (shouldDedupe(key, { dedupe: true, dedupeKey: key, dedupeTimeout: 60000 })) return;
    
    log.warn('Credits low', { remaining });
    return toast.warning(`Осталось ${remaining} кредитов`, {
      description: 'Пополните баланс для продолжения',
      duration: 8000,
    });
  },
  
  /**
   * Network error
   */
  networkError: (retry?: () => void) => {
    const key = 'network-error';
    if (shouldDedupe(key, { dedupe: true, dedupeKey: key, dedupeTimeout: 5000 })) return;
    
    log.error('Network error');
    return toast.error('Ошибка сети', {
      description: 'Проверьте подключение к интернету',
      duration: 5000,
      action: retry ? { label: 'Повторить', onClick: retry } : undefined,
    });
  },
  
  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },
};

export default notify;
