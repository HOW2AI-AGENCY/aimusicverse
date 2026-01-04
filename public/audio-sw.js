/**
 * Audio Service Worker
 * 
 * Provides offline audio caching with stale-while-revalidate strategy.
 * Optimized for music playback continuity.
 */

const CACHE_NAME = 'audio-cache-v1';
const MAX_CACHE_SIZE_MB = 500;
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm'];

// Audio URL patterns to cache
const AUDIO_URL_PATTERNS = [
  /\.supabase\.co\/storage\/.*audio/,
  /\.supabase\.co\/storage\/.*tracks/,
  /\.supabase\.co\/storage\/.*stems/,
  /cdn\.suno\.ai/,
  /audio\./,
];

/**
 * Check if URL is an audio file
 */
function isAudioUrl(url) {
  const urlLower = url.toLowerCase();
  
  // Check extensions
  if (AUDIO_EXTENSIONS.some(ext => urlLower.includes(ext))) {
    return true;
  }
  
  // Check URL patterns
  return AUDIO_URL_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Get total cache size
 */
async function getCacheSize() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  let totalSize = 0;
  
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.clone().blob();
      totalSize += blob.size;
    }
  }
  
  return totalSize;
}

/**
 * Evict oldest entries to make room
 */
async function evictOldEntries(targetBytes) {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  // Get all entries with their timestamps
  const entries = [];
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.clone().blob();
      // Use response date header or current time
      const dateHeader = response.headers.get('date');
      const timestamp = dateHeader ? new Date(dateHeader).getTime() : Date.now();
      entries.push({
        request,
        size: blob.size,
        timestamp,
      });
    }
  }
  
  // Sort by timestamp (oldest first)
  entries.sort((a, b) => a.timestamp - b.timestamp);
  
  // Evict until we free enough space
  let freedBytes = 0;
  for (const entry of entries) {
    if (freedBytes >= targetBytes) break;
    await cache.delete(entry.request);
    freedBytes += entry.size;
  }
  
  return freedBytes;
}

/**
 * Cache an audio response
 */
async function cacheResponse(request, response) {
  if (!response || response.status !== 200) return;
  
  const cache = await caches.open(CACHE_NAME);
  const blob = await response.clone().blob();
  const sizeBytes = blob.size;
  const sizeMB = sizeBytes / (1024 * 1024);
  
  // Don't cache files larger than 50MB
  if (sizeMB > 50) return;
  
  // Check if we need to evict
  const currentSize = await getCacheSize();
  const currentSizeMB = currentSize / (1024 * 1024);
  
  if (currentSizeMB + sizeMB > MAX_CACHE_SIZE_MB) {
    await evictOldEntries(sizeBytes);
  }
  
  // Add date header for LRU tracking
  const headers = new Headers(response.headers);
  headers.set('sw-cached-at', new Date().toISOString());
  
  const cachedResponse = new Response(blob, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  
  await cache.put(request, cachedResponse);
}

// Install event - precache any static audio assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('audio-cache-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - stale-while-revalidate for audio
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Only handle audio URLs
  if (!isAudioUrl(url)) return;
  
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      
      // Try cache first
      const cachedResponse = await cache.match(event.request);
      
      if (cachedResponse) {
        // Return cached, but revalidate in background
        event.waitUntil(
          fetch(event.request)
            .then((response) => cacheResponse(event.request, response))
            .catch(() => {}) // Ignore network errors for revalidation
        );
        return cachedResponse;
      }
      
      // Not in cache - fetch from network
      try {
        const networkResponse = await fetch(event.request);
        
        // Cache the response
        event.waitUntil(cacheResponse(event.request, networkResponse.clone()));
        
        return networkResponse;
      } catch (error) {
        // Network failed and no cache - return error
        return new Response('Audio not available offline', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      }
    })()
  );
});

// Message handler for cache control
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'CACHE_AUDIO':
      (async () => {
        try {
          const response = await fetch(payload.url);
          await cacheResponse(new Request(payload.url), response);
          event.ports[0]?.postMessage({ success: true });
        } catch (error) {
          event.ports[0]?.postMessage({ error: error.message });
        }
      })();
      break;
      
    case 'PRECACHE_AUDIO':
      (async () => {
        try {
          const urls = payload.urls || [];
          await Promise.all(
            urls.map(async (url) => {
              const response = await fetch(url);
              await cacheResponse(new Request(url), response);
            })
          );
          event.ports[0]?.postMessage({ success: true, count: urls.length });
        } catch (error) {
          event.ports[0]?.postMessage({ error: error.message });
        }
      })();
      break;
      
    case 'CLEAR_CACHE':
      (async () => {
        try {
          await caches.delete(CACHE_NAME);
          event.ports[0]?.postMessage({ success: true });
        } catch (error) {
          event.ports[0]?.postMessage({ error: error.message });
        }
      })();
      break;
      
    case 'GET_CACHE_SIZE':
      (async () => {
        try {
          const size = await getCacheSize();
          event.ports[0]?.postMessage({ size });
        } catch (error) {
          event.ports[0]?.postMessage({ error: error.message, size: 0 });
        }
      })();
      break;
  }
});
