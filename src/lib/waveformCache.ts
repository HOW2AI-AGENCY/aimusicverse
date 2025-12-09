/**
 * Global Waveform Cache using IndexedDB
 * Persists waveform data across sessions to avoid regeneration
 */

const DB_NAME = 'musicverse_waveform_cache';
const DB_VERSION = 1;
const STORE_NAME = 'waveforms';
const MAX_CACHE_SIZE = 100; // Maximum cached waveforms

interface WaveformCacheEntry {
  url: string;
  data: number[];
  createdAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

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
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });

  return dbPromise;
}

/**
 * Get cached waveform data by audio URL
 */
export async function getCachedWaveform(url: string): Promise<number[] | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as WaveformCacheEntry | undefined;
        resolve(result?.data || null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Save waveform data to cache
 */
export async function setCachedWaveform(url: string, data: number[]): Promise<void> {
  try {
    const db = await getDB();
    
    // First, cleanup old entries if needed
    await cleanupOldEntries(db);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const entry: WaveformCacheEntry = {
        url,
        data,
        createdAt: Date.now()
      };

      const request = store.put(entry);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch {
    // Silently fail - cache is optional
  }
}

/**
 * Remove oldest entries if cache exceeds MAX_CACHE_SIZE
 */
async function cleanupOldEntries(db: IDBDatabase): Promise<void> {
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      const count = countRequest.result;
      if (count < MAX_CACHE_SIZE) {
        resolve();
        return;
      }

      // Get oldest entries and delete them
      const index = store.index('createdAt');
      const deleteCount = count - MAX_CACHE_SIZE + 10; // Delete 10 extra for buffer
      let deleted = 0;

      const cursorRequest = index.openCursor();
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor && deleted < deleteCount) {
          cursor.delete();
          deleted++;
          cursor.continue();
        } else {
          resolve();
        }
      };
      cursorRequest.onerror = () => resolve();
    };
    countRequest.onerror = () => resolve();
  });
}

/**
 * Clear all cached waveforms
 */
export async function clearWaveformCache(): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch {
    // Silently fail
  }
}

/**
 * In-memory cache for immediate access (session only)
 */
const memoryCache = new Map<string, number[]>();

/**
 * Get waveform from memory cache first, then IndexedDB
 */
export async function getWaveform(url: string): Promise<number[] | null> {
  // Check memory cache first
  if (memoryCache.has(url)) {
    return memoryCache.get(url) || null;
  }

  // Check IndexedDB
  const cached = await getCachedWaveform(url);
  if (cached) {
    // Store in memory for faster subsequent access
    memoryCache.set(url, cached);
  }
  return cached;
}

/**
 * Save waveform to both caches
 */
export async function saveWaveform(url: string, data: number[]): Promise<void> {
  // Save to memory cache immediately
  memoryCache.set(url, data);
  
  // Save to IndexedDB in background
  await setCachedWaveform(url, data);
}
