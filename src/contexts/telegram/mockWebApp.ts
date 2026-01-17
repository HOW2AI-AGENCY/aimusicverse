/**
 * Mock Telegram WebApp
 * 
 * Provides a mock implementation of Telegram WebApp for development mode.
 * 
 * @module contexts/telegram/mockWebApp
 */

import { logger } from '@/lib/logger';
import type { TelegramWebApp } from './types';

const telegramLogger = logger.child({ module: 'TelegramMock' });

/**
 * Creates a mock Telegram WebApp for development/testing
 */
export function createMockWebApp(): TelegramWebApp {
  return {
    ready: () => telegramLogger.debug('Mock: ready()'),
    expand: () => telegramLogger.debug('Mock: expand()'),
    close: () => telegramLogger.debug('Mock: close()'),
    
    MainButton: {
      setText: (text: string) => telegramLogger.debug('Mock MainButton', { text }),
      show: () => telegramLogger.debug('Mock MainButton: show()'),
      hide: () => telegramLogger.debug('Mock MainButton: hide()'),
      onClick: () => telegramLogger.debug('Mock MainButton: onClick set'),
      offClick: () => telegramLogger.debug('Mock MainButton: offClick'),
    },
    
    BackButton: {
      show: () => telegramLogger.debug('Mock BackButton: show()'),
      hide: () => telegramLogger.debug('Mock BackButton: hide()'),
      onClick: () => telegramLogger.debug('Mock BackButton: onClick set'),
      offClick: () => telegramLogger.debug('Mock BackButton: offClick'),
    },
    
    HapticFeedback: {
      impactOccurred: (type: string) => telegramLogger.debug('Mock Haptic', { type }),
      notificationOccurred: (type: string) => telegramLogger.debug('Mock Notification', { type }),
      selectionChanged: () => telegramLogger.debug('Mock Selection changed'),
    },
    
    CloudStorage: {
      setItem: (key: string, value: string, callback?: (error: string | null, success: boolean) => void) => {
        telegramLogger.debug('Mock CloudStorage.setItem', { key });
        localStorage.setItem(`mock_cloud_${key}`, value);
        callback?.(null, true);
      },
      getItem: (key: string, callback: (error: string | null, value: string) => void) => {
        telegramLogger.debug('Mock CloudStorage.getItem', { key });
        const value = localStorage.getItem(`mock_cloud_${key}`) || '';
        callback(null, value);
      },
      removeItem: (key: string, callback?: (error: string | null, success: boolean) => void) => {
        telegramLogger.debug('Mock CloudStorage.removeItem', { key });
        localStorage.removeItem(`mock_cloud_${key}`);
        callback?.(null, true);
      },
      getKeys: (callback: (error: string | null, keys: string[]) => void) => {
        telegramLogger.debug('Mock CloudStorage.getKeys');
        const keys = Object.keys(localStorage)
          .filter(k => k.startsWith('mock_cloud_'))
          .map(k => k.replace('mock_cloud_', ''));
        callback(null, keys);
      },
      getItems: (keys: string[], callback: (error: string | null, values: Record<string, string>) => void) => {
        telegramLogger.debug('Mock CloudStorage.getItems', { keys });
        const values: Record<string, string> = {};
        keys.forEach(key => {
          values[key] = localStorage.getItem(`mock_cloud_${key}`) || '';
        });
        callback(null, values);
      },
      removeItems: (keys: string[], callback?: (error: string | null, success: boolean) => void) => {
        telegramLogger.debug('Mock CloudStorage.removeItems', { keys });
        keys.forEach(key => localStorage.removeItem(`mock_cloud_${key}`));
        callback?.(null, true);
      },
    },
  } as unknown as TelegramWebApp;
}
