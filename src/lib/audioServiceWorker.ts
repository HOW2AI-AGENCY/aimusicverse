/**
 * Audio Service Worker Registration & Control
 * 
 * Manages a Service Worker for audio caching with:
 * - Stale-while-revalidate strategy for audio files
 * - Offline playback support
 * - Cache versioning and cleanup
 */

import { logger } from './logger';

const SW_PATH = '/audio-sw.js';
const CACHE_VERSION = 'v1';

interface ServiceWorkerMessage {
  type: 'CACHE_AUDIO' | 'PRECACHE_AUDIO' | 'CLEAR_CACHE' | 'GET_CACHE_SIZE';
  payload?: unknown;
}

let swRegistration: ServiceWorkerRegistration | null = null;
let isRegistering = false;

/**
 * Check if Service Workers are supported
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Register the audio service worker
 */
export async function registerAudioServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    logger.warn('Service Workers not supported');
    return null;
  }

  if (swRegistration) {
    return swRegistration;
  }

  if (isRegistering) {
    // Wait for existing registration
    return new Promise((resolve) => {
      const checkRegistration = setInterval(() => {
        if (swRegistration) {
          clearInterval(checkRegistration);
          resolve(swRegistration);
        }
      }, 100);
    });
  }

  isRegistering = true;

  try {
    swRegistration = await navigator.serviceWorker.register(SW_PATH, {
      scope: '/',
    });

    logger.info('Audio Service Worker registered', { scope: swRegistration.scope });

    // Handle updates
    swRegistration.addEventListener('updatefound', () => {
      const newWorker = swRegistration?.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            logger.info('New Service Worker available');
          }
        });
      }
    });

    return swRegistration;
  } catch (error) {
    logger.error('Service Worker registration failed', error);
    return null;
  } finally {
    isRegistering = false;
  }
}

/**
 * Send message to Service Worker
 */
async function sendToServiceWorker(message: ServiceWorkerMessage): Promise<unknown> {
  if (!swRegistration?.active) {
    await registerAudioServiceWorker();
  }

  const sw = swRegistration?.active || navigator.serviceWorker.controller;
  if (!sw) {
    logger.warn('No active Service Worker');
    return null;
  }

  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data);
      }
    };

    sw.postMessage(message, [messageChannel.port2]);

    // Timeout after 5 seconds
    setTimeout(() => {
      reject(new Error('Service Worker message timeout'));
    }, 5000);
  });
}

/**
 * Request caching of an audio URL via Service Worker
 */
export async function cacheAudioViaSW(url: string): Promise<boolean> {
  try {
    await sendToServiceWorker({
      type: 'CACHE_AUDIO',
      payload: { url },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Precache multiple audio URLs
 */
export async function precacheAudioUrls(urls: string[]): Promise<void> {
  try {
    await sendToServiceWorker({
      type: 'PRECACHE_AUDIO',
      payload: { urls },
    });
  } catch (error) {
    logger.error('Failed to precache audio URLs', error);
  }
}

/**
 * Clear all audio cache
 */
export async function clearAudioCacheViaSW(): Promise<void> {
  try {
    await sendToServiceWorker({
      type: 'CLEAR_CACHE',
    });
    logger.info('Audio cache cleared');
  } catch (error) {
    logger.error('Failed to clear audio cache', error);
  }
}

/**
 * Get total cache size
 */
export async function getAudioCacheSize(): Promise<number> {
  try {
    const result = await sendToServiceWorker({
      type: 'GET_CACHE_SIZE',
    }) as { size: number };
    return result?.size || 0;
  } catch {
    return 0;
  }
}

/**
 * Check if an audio URL is cached
 */
export async function isAudioCached(url: string): Promise<boolean> {
  if (!isServiceWorkerSupported()) return false;
  
  try {
    const cache = await caches.open(`audio-cache-${CACHE_VERSION}`);
    const response = await cache.match(url);
    return !!response;
  } catch {
    return false;
  }
}

/**
 * Get cached audio as blob
 */
export async function getCachedAudioBlob(url: string): Promise<Blob | null> {
  if (!isServiceWorkerSupported()) return null;
  
  try {
    const cache = await caches.open(`audio-cache-${CACHE_VERSION}`);
    const response = await cache.match(url);
    if (response) {
      return await response.blob();
    }
    return null;
  } catch {
    return null;
  }
}
