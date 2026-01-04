/**
 * CloudStorage utilities for Telegram Mini App
 * Provides persistent storage with Telegram CloudStorage API + localStorage fallback
 */

import { logger } from './logger';

const log = logger.child({ module: 'cloudStorage' });

// Telegram WebApp CloudStorage interface
interface TelegramCloudStorage {
  setItem: (key: string, value: string, callback?: (error: Error | null, stored: boolean) => void) => void;
  getItem: (key: string, callback: (error: Error | null, value: string | null) => void) => void;
  getItems: (keys: string[], callback: (error: Error | null, values: Record<string, string>) => void) => void;
  removeItem: (key: string, callback?: (error: Error | null, removed: boolean) => void) => void;
  removeItems: (keys: string[], callback?: (error: Error | null, removed: boolean) => void) => void;
  getKeys: (callback: (error: Error | null, keys: string[]) => void) => void;
}

// Get Telegram CloudStorage if available
function getTelegramCloudStorage(): TelegramCloudStorage | null {
  try {
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp?.CloudStorage) {
      return webApp.CloudStorage;
    }
  } catch (e) {
    log.debug('Telegram CloudStorage not available');
  }
  return null;
}

// Storage prefix to avoid conflicts
const STORAGE_PREFIX = 'mvai_';

/**
 * Set item in CloudStorage with localStorage fallback
 */
export async function setItem(key: string, value: string): Promise<boolean> {
  const prefixedKey = STORAGE_PREFIX + key;
  const cloudStorage = getTelegramCloudStorage();
  
  if (cloudStorage) {
    return new Promise((resolve) => {
      try {
        cloudStorage.setItem(prefixedKey, value, (error, stored) => {
          if (error) {
            log.warn('CloudStorage setItem failed, using localStorage', { key, error: error.message });
            try {
              localStorage.setItem(prefixedKey, value);
              resolve(true);
            } catch {
              resolve(false);
            }
          } else {
            resolve(stored);
          }
        });
      } catch (e) {
        // Fallback to localStorage
        try {
          localStorage.setItem(prefixedKey, value);
          resolve(true);
        } catch {
          resolve(false);
        }
      }
    });
  }
  
  // Fallback to localStorage
  try {
    localStorage.setItem(prefixedKey, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get item from CloudStorage with localStorage fallback
 */
export async function getItem(key: string): Promise<string | null> {
  const prefixedKey = STORAGE_PREFIX + key;
  const cloudStorage = getTelegramCloudStorage();
  
  if (cloudStorage) {
    return new Promise((resolve) => {
      try {
        cloudStorage.getItem(prefixedKey, (error, value) => {
          if (error || value === null) {
            // Try localStorage fallback
            try {
              resolve(localStorage.getItem(prefixedKey));
            } catch {
              resolve(null);
            }
          } else {
            resolve(value);
          }
        });
      } catch (e) {
        // Fallback to localStorage
        try {
          resolve(localStorage.getItem(prefixedKey));
        } catch {
          resolve(null);
        }
      }
    });
  }
  
  // Fallback to localStorage
  try {
    return localStorage.getItem(prefixedKey);
  } catch {
    return null;
  }
}

/**
 * Get multiple items at once
 */
export async function getItems(keys: string[]): Promise<Record<string, string | null>> {
  const prefixedKeys = keys.map(k => STORAGE_PREFIX + k);
  const cloudStorage = getTelegramCloudStorage();
  
  if (cloudStorage) {
    return new Promise((resolve) => {
      try {
        cloudStorage.getItems(prefixedKeys, (error, values) => {
          if (error) {
            // Fallback to localStorage
            const result: Record<string, string | null> = {};
            keys.forEach(key => {
              try {
                result[key] = localStorage.getItem(STORAGE_PREFIX + key);
              } catch {
                result[key] = null;
              }
            });
            resolve(result);
          } else {
            // Remap keys without prefix
            const result: Record<string, string | null> = {};
            keys.forEach(key => {
              result[key] = values[STORAGE_PREFIX + key] || null;
            });
            resolve(result);
          }
        });
      } catch (e) {
        // Fallback to localStorage
        const result: Record<string, string | null> = {};
        keys.forEach(key => {
          try {
            result[key] = localStorage.getItem(STORAGE_PREFIX + key);
          } catch {
            result[key] = null;
          }
        });
        resolve(result);
      }
    });
  }
  
  // Fallback to localStorage
  const result: Record<string, string | null> = {};
  keys.forEach(key => {
    try {
      result[key] = localStorage.getItem(STORAGE_PREFIX + key);
    } catch {
      result[key] = null;
    }
  });
  return result;
}

/**
 * Remove item from CloudStorage with localStorage fallback
 */
export async function removeItem(key: string): Promise<boolean> {
  const prefixedKey = STORAGE_PREFIX + key;
  const cloudStorage = getTelegramCloudStorage();
  
  if (cloudStorage) {
    return new Promise((resolve) => {
      try {
        cloudStorage.removeItem(prefixedKey, (error, removed) => {
          // Also remove from localStorage for consistency
          try {
            localStorage.removeItem(prefixedKey);
          } catch {}
          resolve(!error);
        });
      } catch (e) {
        try {
          localStorage.removeItem(prefixedKey);
          resolve(true);
        } catch {
          resolve(false);
        }
      }
    });
  }
  
  // Fallback to localStorage
  try {
    localStorage.removeItem(prefixedKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Store JSON object
 */
export async function setJSON<T>(key: string, value: T): Promise<boolean> {
  try {
    return await setItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

/**
 * Get JSON object
 */
export async function getJSON<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const value = await getItem(key);
    if (value === null) return defaultValue;
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Check if CloudStorage is available (running in Telegram)
 */
export function isCloudStorageAvailable(): boolean {
  return getTelegramCloudStorage() !== null;
}

// Export all functions as a namespace
export const cloudStorage = {
  getItem,
  setItem,
  getItems,
  removeItem,
  getJSON,
  setJSON,
  isAvailable: isCloudStorageAvailable,
};
