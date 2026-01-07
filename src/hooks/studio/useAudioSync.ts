/**
 * useAudioSync - Lightweight audio synchronization hook
 * Manages sync between multiple audio elements without full master clock overhead
 */

import { useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface UseAudioSyncOptions {
  audioRefs: Record<string, HTMLAudioElement>;
  syncThreshold?: number; // ms
  onSyncCorrection?: (stemId: string, drift: number) => void;
}

interface UseAudioSyncReturn {
  syncAll: (targetTime: number) => void;
  checkSync: () => { inSync: boolean; maxDrift: number };
  correctDrift: () => void;
}

const DEFAULT_SYNC_THRESHOLD = 50; // 50ms

export function useAudioSync({
  audioRefs,
  syncThreshold = DEFAULT_SYNC_THRESHOLD,
  onSyncCorrection,
}: UseAudioSyncOptions): UseAudioSyncReturn {
  const lastSyncRef = useRef<number>(0);
  const thresholdSec = syncThreshold / 1000;

  // Sync all audio elements to target time
  const syncAll = useCallback((targetTime: number) => {
    const now = performance.now();
    
    // Debounce rapid syncs
    if (now - lastSyncRef.current < 100) return;
    lastSyncRef.current = now;

    const audios = Object.entries(audioRefs);
    let correctionCount = 0;

    for (const [id, audio] of audios) {
      if (!audio || audio.readyState < 2) continue;
      
      const drift = Math.abs(audio.currentTime - targetTime);
      
      if (drift > thresholdSec) {
        audio.currentTime = targetTime;
        correctionCount++;
        onSyncCorrection?.(id, drift * 1000);
      }
    }

    if (correctionCount > 0) {
      logger.debug('Audio sync correction', { 
        corrected: correctionCount, 
        total: audios.length 
      });
    }
  }, [audioRefs, thresholdSec, onSyncCorrection]);

  // Check if all audios are in sync
  const checkSync = useCallback(() => {
    const audios = Object.values(audioRefs);
    if (audios.length < 2) return { inSync: true, maxDrift: 0 };

    const times = audios
      .filter(a => a && a.readyState >= 2)
      .map(a => a.currentTime);

    if (times.length < 2) return { inSync: true, maxDrift: 0 };

    const min = Math.min(...times);
    const max = Math.max(...times);
    const maxDrift = (max - min) * 1000;

    return {
      inSync: maxDrift <= syncThreshold,
      maxDrift,
    };
  }, [audioRefs, syncThreshold]);

  // Correct drift by syncing to first audio element
  const correctDrift = useCallback(() => {
    const audios = Object.values(audioRefs);
    const reference = audios.find(a => a && a.readyState >= 2);
    
    if (reference) {
      syncAll(reference.currentTime);
    }
  }, [audioRefs, syncAll]);

  return {
    syncAll,
    checkSync,
    correctDrift,
  };
}

/**
 * useAutoSync - Automatically corrects drift during playback
 */
export function useAutoSync({
  audioRefs,
  isPlaying,
  checkIntervalMs = 500,
  syncThreshold = DEFAULT_SYNC_THRESHOLD,
}: {
  audioRefs: Record<string, HTMLAudioElement>;
  isPlaying: boolean;
  checkIntervalMs?: number;
  syncThreshold?: number;
}) {
  const { checkSync, correctDrift } = useAudioSync({
    audioRefs,
    syncThreshold,
  });

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const { inSync, maxDrift } = checkSync();
      
      if (!inSync) {
        logger.debug('Auto-correcting drift', { maxDrift });
        correctDrift();
      }
    }, checkIntervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, checkIntervalMs, checkSync, correctDrift]);
}
