/**
 * Audio Cache System
 * 
 * Provides efficient audio file caching using IndexedDB and memory cache.
 * Features:
 * - LRU eviction policy
 * - Configurable cache size limits
 * - Prefetch next track in queue
 * - Background cache cleanup
 * - Network-aware quality selection
 */

import { logger } from './logger';

const DB_NAME = 'musicverse_audio_cache';
const DB_VERSION = 1;
const STORE_NAME = 'audio_files';
const MAX_CACHE_SIZE_MB = 500; // 500MB max cache
const MAX_CACHE_ENTRIES = 100;
const PREFETCH_AHEAD = 2; // Prefetch 2 tracks ahead
const MAX_CACHE_AGE_DAYS = 14; // 14 days max cache age (provider stores for 15 days)
const MAX_CACHE_AGE_MS = MAX_CACHE_AGE_DAYS * 24 * 60 * 60 * 1000;

interface AudioCacheEntry {
  url: string;
  blob: Blob;
  size: number;
  lastAccessed: number;
  createdAt: number;
}

interface CacheStats {
  totalSize: number;
  entryCount: number;
  hitRate: number;
  missRate: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;
const memoryCache = new Map<string, Blob>();
const accessLog = new Map<string, number>();
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Initialize IndexedDB connection
 */
function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('size', 'size', { unique: false });
      }
    };
  });

  return dbPromise;
}

/**
 * Get cached audio blob by URL
 * Returns null if cache entry is expired (older than 14 days)
 */
export async function getCachedAudio(url: string): Promise<Blob | null> {
  // Check memory cache first
  if (memoryCache.has(url)) {
    cacheHits++;
    updateAccessTime(url);
    return memoryCache.get(url) || null;
  }

  // Check IndexedDB
  try {
    const db = await getDB();
    const entry = await new Promise<AudioCacheEntry | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as AudioCacheEntry | undefined;
        resolve(result || null);
      };
    });

    if (entry) {
      // Check if entry is expired (older than 14 days)
      const age = Date.now() - entry.createdAt;
      if (age > MAX_CACHE_AGE_MS) {
        // Entry expired, remove it
        logger.debug('Cache entry expired, removing', { url: url.substring(0, 50), ageDays: Math.floor(age / (24 * 60 * 60 * 1000)) });
        removeCacheEntry(url);
        cacheMisses++;
        return null;
      }
      
      cacheHits++;
      // Update access time asynchronously
      updateAccessTimeInDB(url);
      // Store in memory for faster subsequent access
      memoryCache.set(url, entry.blob);
      return entry.blob;
    }
  } catch (error) {
    logger.error('Error reading from audio cache', error instanceof Error ? error : new Error(String(error)));
  }

  cacheMisses++;
  return null;
}

/**
 * Remove a single cache entry
 */
async function removeCacheEntry(url: string): Promise<void> {
  memoryCache.delete(url);
  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(url);
  } catch {
    // Silently fail
  }
}

/**
 * Save audio blob to cache
 */
export async function cacheAudio(url: string, blob: Blob): Promise<void> {
  const size = blob.size;
  
  // Don't cache if blob is too large (>50MB)
  if (size > 50 * 1024 * 1024) {
    logger.warn('Audio file too large to cache', { size, url: url.substring(0, 50) });
    return;
  }

  // Store in memory cache immediately
  memoryCache.set(url, blob);

  try {
    const db = await getDB();
    
    // Check if we need to cleanup before adding
    await cleanupIfNeeded(db);

    const entry: AudioCacheEntry = {
      url,
      blob,
      size,
      lastAccessed: Date.now(),
      createdAt: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    logger.error('Error saving to audio cache', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Prefetch audio URL in the background
 */
export async function prefetchAudio(url: string): Promise<void> {
  // Don't prefetch if already cached
  const cached = await getCachedAudio(url);
  if (cached) return;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const blob = await response.blob();
    await cacheAudio(url, blob);
  } catch (error) {
    logger.error('Error prefetching audio', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Prefetch next tracks in queue
 */
export async function prefetchQueue(urls: string[], currentIndex: number): Promise<void> {
  const prefetchUrls = urls.slice(
    currentIndex + 1,
    Math.min(currentIndex + 1 + PREFETCH_AHEAD, urls.length)
  );

  // Prefetch in parallel but don't wait for completion
  Promise.all(prefetchUrls.map(url => prefetchAudio(url))).catch(err => {
    logger.error('Error in prefetch queue', err instanceof Error ? err : new Error(String(err)));
  });
}

/**
 * Update access time in memory
 */
function updateAccessTime(url: string): void {
  accessLog.set(url, Date.now());
}

/**
 * Update access time in IndexedDB (async, non-blocking)
 */
async function updateAccessTimeInDB(url: string): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const getRequest = store.get(url);
    getRequest.onsuccess = () => {
      const entry = getRequest.result as AudioCacheEntry | undefined;
      if (entry) {
        entry.lastAccessed = Date.now();
        store.put(entry);
      }
    };
  } catch {
    // Silently fail - not critical
  }
}

/**
 * Get total cache size
 */
async function getCacheSize(db: IDBDatabase): Promise<number> {
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const entries = request.result as AudioCacheEntry[];
      const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
      resolve(totalSize);
    };
    
    request.onerror = () => resolve(0);
  });
}

/**
 * Cleanup old entries using LRU eviction
 */
async function cleanupIfNeeded(db: IDBDatabase): Promise<void> {
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  // Check entry count
  const countRequest = store.count();
  await new Promise<void>((resolve) => {
    countRequest.onsuccess = async () => {
      const count = countRequest.result;
      const totalSize = await getCacheSize(db);
      const totalSizeMB = totalSize / (1024 * 1024);

      // Cleanup if exceeds limits
      if (count > MAX_CACHE_ENTRIES || totalSizeMB > MAX_CACHE_SIZE_MB) {
        await evictLRUEntries(db, Math.ceil(count * 0.2)); // Remove 20% of entries
      }
      resolve();
    };
    countRequest.onerror = () => resolve();
  });
}

/**
 * Evict least recently used entries
 */
async function evictLRUEntries(db: IDBDatabase, countToEvict: number): Promise<void> {
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('lastAccessed');
    
    let evicted = 0;
    const cursorRequest = index.openCursor();
    
    cursorRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor && evicted < countToEvict) {
        const entry = cursor.value as AudioCacheEntry;
        // Remove from memory cache too
        memoryCache.delete(entry.url);
        cursor.delete();
        evicted++;
        cursor.continue();
      } else {
        resolve();
      }
    };
    
    cursorRequest.onerror = () => resolve();
  });
}

/**
 * Clear all cached audio
 */
export async function clearAudioCache(): Promise<void> {
  memoryCache.clear();
  accessLog.clear();
  
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    logger.error('Error clearing audio cache', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const entries = await new Promise<AudioCacheEntry[]>((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as AudioCacheEntry[]);
      request.onerror = () => resolve([]);
    });

    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalRequests = cacheHits + cacheMisses;
    
    return {
      totalSize,
      entryCount: entries.length,
      hitRate: totalRequests > 0 ? cacheHits / totalRequests : 0,
      missRate: totalRequests > 0 ? cacheMisses / totalRequests : 0,
    };
  } catch {
    return {
      totalSize: 0,
      entryCount: 0,
      hitRate: 0,
      missRate: 0,
    };
  }
}

interface NetworkInformation {
  effectiveType?: string;
  saveData?: boolean;
}

/**
 * Check network connection quality and suggest audio quality
 */
export function getRecommendedQuality(): 'high' | 'medium' | 'low' {
  const connection = (navigator as any).connection as NetworkInformation | undefined;
  if (!connection) return 'high';
  
  const effectiveType = connection.effectiveType;
  
  if (effectiveType === '4g') return 'high';
  if (effectiveType === '3g') return 'medium';
  return 'low';
}

/**
 * Check if we should prefetch based on network conditions
 */
export function shouldPrefetch(): boolean {
  const connection = (navigator as any).connection as NetworkInformation | undefined;
  if (!connection) return true;
  
  return !connection.saveData && connection.effectiveType !== 'slow-2g' && connection.effectiveType !== '2g';
}

/**
 * Cleanup expired cache entries (older than 14 days)
 * Should be called periodically or on app startup
 */
export async function cleanupExpiredEntries(): Promise<number> {
  let removedCount = 0;
  
  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('createdAt');
    
    const cutoffTime = Date.now() - MAX_CACHE_AGE_MS;
    const range = IDBKeyRange.upperBound(cutoffTime);
    
    const cursorRequest = index.openCursor(range);
    
    await new Promise<void>((resolve) => {
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const entry = cursor.value as AudioCacheEntry;
          memoryCache.delete(entry.url);
          cursor.delete();
          removedCount++;
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      cursorRequest.onerror = () => resolve();
    });
    
    if (removedCount > 0) {
      logger.info('Cleaned up expired cache entries', { removedCount });
    }
  } catch (error) {
    logger.error('Error cleaning up expired cache entries', error instanceof Error ? error : new Error(String(error)));
  }
  
  return removedCount;
}
