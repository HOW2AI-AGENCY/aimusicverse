/**
 * Lyrics IndexedDB Cache
 * 
 * Caches timestamped lyrics data to avoid re-fetching on each playback.
 * Uses IndexedDB for persistent storage across sessions.
 */

import { logger } from '@/lib/logger';

const DB_NAME = 'LyricsCache';
const DB_VERSION = 1;
const STORE_NAME = 'lyrics';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface CachedLyricsEntry {
  key: string;
  data: unknown;
  timestamp: number;
  taskId: string;
  audioId: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize or get the IndexedDB database
 */
function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      logger.error('Failed to open lyrics cache DB', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('taskId', 'taskId', { unique: false });
      }
    };
  });
  
  return dbPromise;
}

/**
 * Generate cache key from taskId and audioId
 */
function getCacheKey(taskId: string, audioId: string): string {
  return `lyrics_${taskId}_${audioId}`;
}

/**
 * Get cached lyrics data
 */
export async function getCachedLyrics(
  taskId: string,
  audioId: string
): Promise<unknown | null> {
  try {
    const db = await getDB();
    const key = getCacheKey(taskId, audioId);
    
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const entry = request.result as CachedLyricsEntry | undefined;
        
        if (!entry) {
          resolve(null);
          return;
        }
        
        // Check if cache is expired
        if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
          // Expired, remove and return null
          deleteCachedLyrics(taskId, audioId).catch(() => {});
          resolve(null);
          return;
        }
        
        logger.debug('Lyrics cache hit', { taskId, audioId });
        resolve(entry.data);
      };
      
      request.onerror = () => {
        logger.warn('Failed to get cached lyrics', { error: String(request.error) });
        resolve(null);
      };
    });
  } catch (err) {
    logger.warn('Error accessing lyrics cache', { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

/**
 * Store lyrics data in cache
 */
export async function setCachedLyrics(
  taskId: string,
  audioId: string,
  data: unknown
): Promise<void> {
  try {
    const db = await getDB();
    const key = getCacheKey(taskId, audioId);
    
    const entry: CachedLyricsEntry = {
      key,
      data,
      timestamp: Date.now(),
      taskId,
      audioId,
    };
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);
      
      request.onsuccess = () => {
        logger.debug('Lyrics cached successfully', { taskId, audioId });
        resolve();
      };
      
      request.onerror = () => {
        logger.warn('Failed to cache lyrics', { error: String(request.error) });
        reject(request.error);
      };
    });
  } catch (err) {
    logger.warn('Error storing lyrics in cache', { error: err instanceof Error ? err.message : String(err) });
  }
}

/**
 * Delete cached lyrics
 */
export async function deleteCachedLyrics(
  taskId: string,
  audioId: string
): Promise<void> {
  try {
    const db = await getDB();
    const key = getCacheKey(taskId, audioId);
    
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(key);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  } catch {
    // Ignore errors
  }
}

/**
 * Clear all expired entries from cache
 */
export async function cleanupExpiredLyrics(): Promise<void> {
  try {
    const db = await getDB();
    const now = Date.now();
    
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(now - CACHE_EXPIRY_MS);
      
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
      
      transaction.oncomplete = () => {
        logger.debug('Expired lyrics cache entries cleaned up');
        resolve();
      };
      
      transaction.onerror = () => resolve();
    });
  } catch {
    // Ignore errors
  }
}

/**
 * Get cache statistics
 */
export async function getLyricsCacheStats(): Promise<{ count: number; oldestTimestamp: number | null }> {
  try {
    const db = await getDB();
    
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const countRequest = store.count();
      let count = 0;
      let oldestTimestamp: number | null = null;
      
      countRequest.onsuccess = () => {
        count = countRequest.result;
      };
      
      const index = store.index('timestamp');
      const cursorRequest = index.openCursor();
      
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor && oldestTimestamp === null) {
          oldestTimestamp = cursor.value.timestamp;
        }
      };
      
      transaction.oncomplete = () => {
        resolve({ count, oldestTimestamp });
      };
      
      transaction.onerror = () => {
        resolve({ count: 0, oldestTimestamp: null });
      };
    });
  } catch {
    return { count: 0, oldestTimestamp: null };
  }
}
