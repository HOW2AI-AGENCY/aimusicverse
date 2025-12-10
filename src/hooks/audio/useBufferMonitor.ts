/**
 * Audio Buffer Monitor Hook
 * 
 * Monitors audio buffering state and provides UX feedback.
 * 
 * Features:
 * - Detects buffering/stalling events
 * - Tracks buffer health
 * - Provides loading state for UI
 * - Network quality estimation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getGlobalAudioRef } from './useAudioTime';
import { usePlayerStore } from './usePlayerState';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'BufferMonitor' });

export interface BufferState {
  isBuffering: boolean;
  bufferHealth: 'good' | 'fair' | 'poor'; // Based on buffered amount ahead
  bufferedSeconds: number;
  bufferedPercentage: number;
  stallCount: number;
  networkQuality: 'excellent' | 'good' | 'poor' | 'offline';
}

const BUFFER_HEALTH_THRESHOLDS = {
  good: 10, // 10+ seconds buffered = good
  fair: 5,  // 5-10 seconds = fair
  // < 5 seconds = poor
};

const STALL_DETECTION_INTERVAL = 500; // Check every 500ms
const STALL_THRESHOLD = 0.1; // If playback doesn't advance 0.1s in 500ms = stalling

/**
 * Hook for monitoring audio buffer state
 */
export function useBufferMonitor() {
  const { isPlaying, activeTrack } = usePlayerStore();
  
  const [bufferState, setBufferState] = useState<BufferState>({
    isBuffering: false,
    bufferHealth: 'good',
    bufferedSeconds: 0,
    bufferedPercentage: 0,
    stallCount: 0,
    networkQuality: 'good',
  });

  const lastPositionRef = useRef<number>(0);
  const stallCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stallCountRef = useRef<number>(0);

  /**
   * Calculate buffered amount ahead of current position
   */
  const calculateBufferedAhead = useCallback((
    audio: HTMLAudioElement
  ): { seconds: number; percentage: number } => {
    const currentTime = audio.currentTime;
    const duration = audio.duration || 0;
    const buffered = audio.buffered;

    if (buffered.length === 0 || duration === 0) {
      return { seconds: 0, percentage: 0 };
    }

    // Find the buffered range that contains current time
    let bufferedEnd = 0;
    for (let i = 0; i < buffered.length; i++) {
      const start = buffered.start(i);
      const end = buffered.end(i);
      
      if (currentTime >= start && currentTime <= end) {
        bufferedEnd = end;
        break;
      }
    }

    const bufferedSeconds = Math.max(0, bufferedEnd - currentTime);
    const bufferedPercentage = duration > 0 ? (bufferedSeconds / duration) * 100 : 0;

    return { seconds: bufferedSeconds, percentage: bufferedPercentage };
  }, []);

  /**
   * Determine buffer health based on buffered amount
   */
  const getBufferHealth = useCallback((bufferedSeconds: number): BufferState['bufferHealth'] => {
    if (bufferedSeconds >= BUFFER_HEALTH_THRESHOLDS.good) {
      return 'good';
    } else if (bufferedSeconds >= BUFFER_HEALTH_THRESHOLDS.fair) {
      return 'fair';
    } else {
      return 'poor';
    }
  }, []);

  /**
   * Estimate network quality based on stalls and buffer health
   */
  const estimateNetworkQuality = useCallback((
    stallCount: number,
    bufferHealth: BufferState['bufferHealth']
  ): BufferState['networkQuality'] => {
    if (!navigator.onLine) {
      return 'offline';
    }

    if (stallCount === 0 && bufferHealth === 'good') {
      return 'excellent';
    } else if (stallCount < 3 && bufferHealth !== 'poor') {
      return 'good';
    } else {
      return 'poor';
    }
  }, []);

  /**
   * Update buffer state
   */
  const updateBufferState = useCallback(() => {
    const audio = getGlobalAudioRef();
    if (!audio || !activeTrack) return;

    const { seconds, percentage } = calculateBufferedAhead(audio);
    const bufferHealth = getBufferHealth(seconds);
    const networkQuality = estimateNetworkQuality(stallCountRef.current, bufferHealth);

    setBufferState(prev => ({
      ...prev,
      bufferedSeconds: seconds,
      bufferedPercentage: percentage,
      bufferHealth,
      networkQuality,
      stallCount: stallCountRef.current,
    }));
  }, [activeTrack, calculateBufferedAhead, getBufferHealth, estimateNetworkQuality]);

  /**
   * Detect playback stalls
   */
  const checkForStalls = useCallback(() => {
    const audio = getGlobalAudioRef();
    if (!audio || !isPlaying) return;

    const currentPosition = audio.currentTime;
    const positionAdvance = currentPosition - lastPositionRef.current;

    // If playing but position didn't advance = stalling
    if (positionAdvance < STALL_THRESHOLD && !audio.ended) {
      // Check if we're actually buffering (not just paused)
      if (audio.readyState < 3) { // HAVE_FUTURE_DATA
        setBufferState(prev => ({ ...prev, isBuffering: true }));
        stallCountRef.current++;
        
        log.warn('Playback stalled', {
          position: currentPosition.toFixed(2),
          readyState: audio.readyState,
          stallCount: stallCountRef.current,
        });
      }
    } else {
      setBufferState(prev => ({ ...prev, isBuffering: false }));
    }

    lastPositionRef.current = currentPosition;
    updateBufferState();
  }, [isPlaying, updateBufferState]);

  /**
   * Monitor buffer state when playing
   */
  useEffect(() => {
    const audio = getGlobalAudioRef();
    if (!audio) return;

    // Listen to buffering events
    const handleWaiting = () => {
      setBufferState(prev => ({ ...prev, isBuffering: true }));
      log.debug('Audio waiting for data');
    };

    const handleCanPlay = () => {
      setBufferState(prev => ({ ...prev, isBuffering: false }));
      log.debug('Audio can play');
    };

    const handleProgress = () => {
      updateBufferState();
    };

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlay);
    audio.addEventListener('progress', handleProgress);

    // Initial state
    updateBufferState();

    return () => {
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlay);
      audio.removeEventListener('progress', handleProgress);
    };
  }, [activeTrack?.id, updateBufferState]);

  /**
   * Periodic stall detection when playing
   */
  useEffect(() => {
    if (isPlaying) {
      lastPositionRef.current = getGlobalAudioRef()?.currentTime || 0;
      stallCheckTimerRef.current = setInterval(checkForStalls, STALL_DETECTION_INTERVAL);

      return () => {
        if (stallCheckTimerRef.current) {
          clearInterval(stallCheckTimerRef.current);
          stallCheckTimerRef.current = null;
        }
      };
    } else {
      // Reset buffering state when paused
      setBufferState(prev => ({ ...prev, isBuffering: false }));
    }
  }, [isPlaying, checkForStalls]);

  /**
   * Reset stall count on track change
   */
  useEffect(() => {
    stallCountRef.current = 0;
    setBufferState(prev => ({ ...prev, stallCount: 0, isBuffering: false }));
  }, [activeTrack?.id]);

  return bufferState;
}
