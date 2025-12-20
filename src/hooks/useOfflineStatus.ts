/**
 * Offline Status Hook
 * 
 * Tracks online/offline status and provides audio availability info.
 * Integrates with Service Worker audio cache.
 */

import { useState, useEffect, useCallback } from 'react';
import { isAudioCached, getCachedAudioBlob } from '@/lib/audioServiceWorker';

interface OfflineStatus {
  isOnline: boolean;
  isOfflineCapable: boolean;
  cachedAudioUrls: Set<string>;
}

export function useOfflineStatus() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: navigator.onLine,
    isOfflineCapable: 'serviceWorker' in navigator,
    cachedAudioUrls: new Set(),
  });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Check if a specific audio URL is available offline
   */
  const isAudioAvailableOffline = useCallback(async (url: string): Promise<boolean> => {
    if (status.cachedAudioUrls.has(url)) {
      return true;
    }
    
    const isCached = await isAudioCached(url);
    if (isCached) {
      setStatus(prev => ({
        ...prev,
        cachedAudioUrls: new Set([...prev.cachedAudioUrls, url]),
      }));
    }
    return isCached;
  }, [status.cachedAudioUrls]);

  /**
   * Get cached audio blob for offline playback
   */
  const getOfflineAudio = useCallback(async (url: string): Promise<Blob | null> => {
    return getCachedAudioBlob(url);
  }, []);

  /**
   * Check multiple URLs for offline availability
   */
  const checkOfflineAvailability = useCallback(async (urls: string[]): Promise<Map<string, boolean>> => {
    const results = new Map<string, boolean>();
    
    await Promise.all(
      urls.map(async (url) => {
        const available = await isAudioAvailableOffline(url);
        results.set(url, available);
      })
    );
    
    return results;
  }, [isAudioAvailableOffline]);

  return {
    ...status,
    isAudioAvailableOffline,
    getOfflineAudio,
    checkOfflineAvailability,
  };
}
