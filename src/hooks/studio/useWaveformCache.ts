/**
 * useWaveformCache - Optimized waveform data caching
 * Uses IndexedDB for persistent storage with memory cache
 */

import { useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

interface WaveformCacheEntry {
  peaks: number[];
  duration: number;
  timestamp: number;
}

const CACHE_VERSION = 1;
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MEMORY_CACHE_SIZE = 20;

// In-memory LRU cache
const memoryCache = new Map<string, WaveformCacheEntry>();
const accessOrder: string[] = [];

function updateAccessOrder(key: string) {
  const idx = accessOrder.indexOf(key);
  if (idx > -1) accessOrder.splice(idx, 1);
  accessOrder.push(key);
  
  // Evict oldest if over limit
  while (accessOrder.length > MEMORY_CACHE_SIZE) {
    const oldest = accessOrder.shift();
    if (oldest) memoryCache.delete(oldest);
  }
}

interface UseWaveformCacheReturn {
  get: (key: string) => Promise<WaveformCacheEntry | null>;
  set: (key: string, peaks: number[], duration: number) => Promise<void>;
  clear: () => Promise<void>;
  clearExpired: () => Promise<number>;
}

export function useWaveformCache(): UseWaveformCacheReturn {
  const dbRef = useRef<IDBDatabase | null>(null);
  const dbPromiseRef = useRef<Promise<IDBDatabase> | null>(null);

  const getDB = useCallback(async (): Promise<IDBDatabase> => {
    if (dbRef.current) return dbRef.current;
    
    if (dbPromiseRef.current) return dbPromiseRef.current;
    
    dbPromiseRef.current = new Promise((resolve, reject) => {
      const request = indexedDB.open('waveform-cache', CACHE_VERSION);
      
      request.onerror = () => {
        logger.error('Failed to open waveform cache DB');
        reject(request.error);
      };
      
      request.onsuccess = () => {
        dbRef.current = request.result;
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('waveforms')) {
          const store = db.createObjectStore('waveforms', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
    
    return dbPromiseRef.current;
  }, []);

  const get = useCallback(async (key: string): Promise<WaveformCacheEntry | null> => {
    // Check memory cache first
    const memEntry = memoryCache.get(key);
    if (memEntry) {
      updateAccessOrder(key);
      return memEntry;
    }
    
    try {
      const db = await getDB();
      
      return new Promise((resolve) => {
        const tx = db.transaction('waveforms', 'readonly');
        const store = tx.objectStore('waveforms');
        const request = store.get(key);
        
        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve(null);
            return;
          }
          
          // Check if expired
          if (Date.now() - result.timestamp > CACHE_MAX_AGE_MS) {
            resolve(null);
            return;
          }
          
          // Add to memory cache
          const entry: WaveformCacheEntry = {
            peaks: result.peaks,
            duration: result.duration,
            timestamp: result.timestamp,
          };
          memoryCache.set(key, entry);
          updateAccessOrder(key);
          
          resolve(entry);
        };
        
        request.onerror = () => {
          logger.warn('Failed to get waveform from cache', { key });
          resolve(null);
        };
      });
    } catch {
      return null;
    }
  }, [getDB]);

  const set = useCallback(async (
    key: string, 
    peaks: number[], 
    duration: number
  ): Promise<void> => {
    const entry: WaveformCacheEntry = {
      peaks,
      duration,
      timestamp: Date.now(),
    };
    
    // Always update memory cache
    memoryCache.set(key, entry);
    updateAccessOrder(key);
    
    try {
      const db = await getDB();
      
      return new Promise((resolve, reject) => {
        const tx = db.transaction('waveforms', 'readwrite');
        const store = tx.objectStore('waveforms');
        const request = store.put({ key, ...entry });
        
        request.onsuccess = () => resolve();
        request.onerror = () => {
          logger.warn('Failed to cache waveform', { key });
          reject(request.error);
        };
      });
    } catch {
      // Silently fail for cache writes
    }
  }, [getDB]);

  const clear = useCallback(async (): Promise<void> => {
    memoryCache.clear();
    accessOrder.length = 0;
    
    try {
      const db = await getDB();
      
      return new Promise((resolve) => {
        const tx = db.transaction('waveforms', 'readwrite');
        const store = tx.objectStore('waveforms');
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // Ignore errors on clear
    }
  }, [getDB]);

  const clearExpired = useCallback(async (): Promise<number> => {
    let count = 0;
    
    try {
      const db = await getDB();
      const now = Date.now();
      
      return new Promise((resolve) => {
        const tx = db.transaction('waveforms', 'readwrite');
        const store = tx.objectStore('waveforms');
        const index = store.index('timestamp');
        const range = IDBKeyRange.upperBound(now - CACHE_MAX_AGE_MS);
        const request = index.openCursor(range);
        
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            cursor.delete();
            count++;
            cursor.continue();
          }
        };
        
        tx.oncomplete = () => {
          logger.info('Cleared expired waveform cache entries', { count });
          resolve(count);
        };
        
        tx.onerror = () => resolve(count);
      });
    } catch {
      return count;
    }
  }, [getDB]);

  return { get, set, clear, clearExpired };
}
