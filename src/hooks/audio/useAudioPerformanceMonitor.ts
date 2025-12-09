/**
 * Audio Performance Monitor Hook
 * 
 * Monitors and tracks audio playback performance metrics:
 * - Loading times
 * - Buffer health
 * - Cache hit/miss rates
 * - Stalls and interruptions
 * - Network quality
 * 
 * Provides analytics and automatic quality adjustment
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePlayerStore } from './usePlayerState';
import { getGlobalAudioRef } from './useAudioTime';
import { getCacheStats } from '@/lib/audioCache';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'AudioPerformanceMonitor' });

interface PerformanceMetrics {
  // Loading metrics
  averageLoadTime: number;
  totalLoads: number;
  fastLoads: number; // < 1s
  slowLoads: number; // > 3s
  
  // Playback quality
  stallCount: number;
  stallDuration: number; // total stall time in seconds
  bufferUnderrunCount: number;
  
  // Cache metrics
  cacheHitRate: number;
  cacheMissRate: number;
  cacheSize: number;
  
  // Network metrics
  averageBitrate: number;
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Overall health
  healthScore: number; // 0-100
}

interface SessionMetrics {
  sessionStart: number;
  tracksPlayed: number;
  totalPlayTime: number;
  errors: number;
}

export function useAudioPerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    averageLoadTime: 0,
    totalLoads: 0,
    fastLoads: 0,
    slowLoads: 0,
    stallCount: 0,
    stallDuration: 0,
    bufferUnderrunCount: 0,
    cacheHitRate: 0,
    cacheMissRate: 0,
    cacheSize: 0,
    averageBitrate: 0,
    networkQuality: 'good',
    healthScore: 100,
  });

  const [session, setSession] = useState<SessionMetrics>({
    sessionStart: Date.now(),
    tracksPlayed: 0,
    totalPlayTime: 0,
    errors: 0,
  });

  const { activeTrack, isPlaying } = usePlayerStore();
  
  const loadStartRef = useRef<number | null>(null);
  const stallStartRef = useRef<number | null>(null);
  const playTimeStartRef = useRef<number | null>(null);
  const loadTimesRef = useRef<number[]>([]);

  /**
   * Start tracking load time
   */
  const startLoadTracking = useCallback(() => {
    loadStartRef.current = Date.now();
    log.debug('Started load tracking');
  }, []);

  /**
   * End tracking load time and record metric
   */
  const endLoadTracking = useCallback(() => {
    if (loadStartRef.current) {
      const loadTime = Date.now() - loadStartRef.current;
      loadTimesRef.current.push(loadTime);
      
      // Keep only last 50 load times
      if (loadTimesRef.current.length > 50) {
        loadTimesRef.current.shift();
      }

      const isFast = loadTime < 1000;
      const isSlow = loadTime > 3000;

      setMetrics(prev => ({
        ...prev,
        totalLoads: prev.totalLoads + 1,
        fastLoads: prev.fastLoads + (isFast ? 1 : 0),
        slowLoads: prev.slowLoads + (isSlow ? 1 : 0),
        averageLoadTime: loadTimesRef.current.reduce((a, b) => a + b, 0) / loadTimesRef.current.length,
      }));

      log.debug('Load time recorded', { loadTime, isFast, isSlow });
      loadStartRef.current = null;
    }
  }, []);

  /**
   * Track stall (buffering interruption)
   */
  const trackStall = useCallback((duration: number) => {
    setMetrics(prev => ({
      ...prev,
      stallCount: prev.stallCount + 1,
      stallDuration: prev.stallDuration + duration,
    }));
    
    log.warn('Playback stall detected', { duration });
  }, []);

  /**
   * Track buffer underrun
   */
  const trackBufferUnderrun = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      bufferUnderrunCount: prev.bufferUnderrunCount + 1,
    }));
    
    log.warn('Buffer underrun detected');
  }, []);

  /**
   * Update cache metrics
   */
  const updateCacheMetrics = useCallback(async () => {
    try {
      const cacheStats = await getCacheStats();
      
      setMetrics(prev => ({
        ...prev,
        cacheHitRate: cacheStats.hitRate,
        cacheMissRate: cacheStats.missRate,
        cacheSize: cacheStats.totalSize,
      }));
    } catch (error) {
      log.error('Failed to update cache metrics', error);
    }
  }, []);

  /**
   * Calculate health score based on all metrics
   */
  const calculateHealthScore = useCallback((m: PerformanceMetrics): number => {
    let score = 100;

    // Penalize slow loads
    const slowLoadRate = m.totalLoads > 0 ? m.slowLoads / m.totalLoads : 0;
    score -= slowLoadRate * 30;

    // Penalize stalls
    if (m.stallCount > 5) {
      score -= Math.min(m.stallCount * 2, 20);
    }

    // Penalize buffer underruns
    if (m.bufferUnderrunCount > 3) {
      score -= Math.min(m.bufferUnderrunCount * 5, 20);
    }

    // Bonus for good cache hit rate
    if (m.cacheHitRate > 0.7) {
      score += 10;
    }

    // Penalize poor cache hit rate
    if (m.cacheHitRate < 0.3 && m.totalLoads > 10) {
      score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }, []);

  /**
   * Determine network quality
   */
  const determineNetworkQuality = useCallback((m: PerformanceMetrics): PerformanceMetrics['networkQuality'] => {
    if (m.averageLoadTime < 1000 && m.stallCount === 0) {
      return 'excellent';
    } else if (m.averageLoadTime < 2000 && m.stallCount < 3) {
      return 'good';
    } else if (m.averageLoadTime < 4000 && m.stallCount < 5) {
      return 'fair';
    } else {
      return 'poor';
    }
  }, []);

  /**
   * Update metrics periodically
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => {
        const healthScore = calculateHealthScore(prev);
        const networkQuality = determineNetworkQuality(prev);
        
        return {
          ...prev,
          healthScore,
          networkQuality,
        };
      });

      // Update cache metrics
      updateCacheMetrics();
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [calculateHealthScore, determineNetworkQuality, updateCacheMetrics]);

  /**
   * Monitor audio element events
   */
  useEffect(() => {
    const audio = getGlobalAudioRef();
    if (!audio) return;

    // Track loading start
    const handleLoadStart = () => {
      startLoadTracking();
    };

    // Track loading end
    const handleCanPlay = () => {
      endLoadTracking();
    };

    // Track stalls
    const handleWaiting = () => {
      stallStartRef.current = Date.now();
    };

    const handlePlaying = () => {
      if (stallStartRef.current) {
        const stallDuration = (Date.now() - stallStartRef.current) / 1000;
        trackStall(stallDuration);
        stallStartRef.current = null;
      }
    };

    // Track errors
    const handleError = () => {
      setSession(prev => ({
        ...prev,
        errors: prev.errors + 1,
      }));
      log.error('Audio error detected');
    };

    // Track buffer state
    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        const currentTime = audio.currentTime;
        const bufferAhead = bufferedEnd - currentTime;
        
        // Buffer underrun if less than 2 seconds ahead while playing
        if (bufferAhead < 2 && isPlaying && !audio.paused) {
          trackBufferUnderrun();
        }
      }
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('error', handleError);
    audio.addEventListener('progress', handleProgress);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('progress', handleProgress);
    };
  }, [
    startLoadTracking,
    endLoadTracking,
    trackStall,
    trackBufferUnderrun,
    isPlaying,
  ]);

  /**
   * Track session play time
   */
  useEffect(() => {
    if (isPlaying) {
      playTimeStartRef.current = Date.now();
    } else if (playTimeStartRef.current) {
      const playDuration = (Date.now() - playTimeStartRef.current) / 1000;
      setSession(prev => ({
        ...prev,
        totalPlayTime: prev.totalPlayTime + playDuration,
      }));
      playTimeStartRef.current = null;
    }
  }, [isPlaying]);

  /**
   * Track track changes
   */
  useEffect(() => {
    if (activeTrack) {
      setSession(prev => ({
        ...prev,
        tracksPlayed: prev.tracksPlayed + 1,
      }));
    }
  }, [activeTrack?.id]);

  /**
   * Reset metrics
   */
  const resetMetrics = useCallback(() => {
    setMetrics({
      averageLoadTime: 0,
      totalLoads: 0,
      fastLoads: 0,
      slowLoads: 0,
      stallCount: 0,
      stallDuration: 0,
      bufferUnderrunCount: 0,
      cacheHitRate: 0,
      cacheMissRate: 0,
      cacheSize: 0,
      averageBitrate: 0,
      networkQuality: 'good',
      healthScore: 100,
    });
    
    setSession({
      sessionStart: Date.now(),
      tracksPlayed: 0,
      totalPlayTime: 0,
      errors: 0,
    });
    
    loadTimesRef.current = [];
    
    log.info('Performance metrics reset');
  }, []);

  /**
   * Get recommendations based on metrics
   */
  const getRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];

    if (metrics.networkQuality === 'poor') {
      recommendations.push('Низкое качество сети. Рекомендуется снизить качество аудио.');
    }

    if (metrics.cacheHitRate < 0.3 && metrics.totalLoads > 10) {
      recommendations.push('Низкая эффективность кеша. Попробуйте очистить кеш.');
    }

    if (metrics.stallCount > 10) {
      recommendations.push('Частые прерывания воспроизведения. Проверьте подключение к интернету.');
    }

    if (metrics.slowLoads > metrics.fastLoads && metrics.totalLoads > 5) {
      recommendations.push('Медленная загрузка треков. Рекомендуется использовать Wi-Fi.');
    }

    return recommendations;
  }, [metrics]);

  return {
    metrics,
    session,
    recommendations: getRecommendations(),
    resetMetrics,
  };
}
