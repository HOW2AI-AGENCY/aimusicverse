/**
 * useStudioAnalytics - Analytics and statistics tracking for Studio
 * 
 * Tracks:
 * - Stem loading performance
 * - Playback patterns
 * - Mix adjustments
 * - Export operations
 * - User interactions
 */

import { useCallback, useRef, useEffect } from 'react';
import { studioAnalytics, recordMetric, trackFeature } from '@/lib/telemetry';
import { logger } from '@/lib/logger';

interface StudioSession {
  startTime: number;
  trackId: string;
  stemsLoaded: number;
  playCount: number;
  seekCount: number;
  mixChanges: number;
  exportCount: number;
}

interface UseStudioAnalyticsOptions {
  trackId?: string;
  projectId?: string;
}

export function useStudioAnalytics({ trackId, projectId }: UseStudioAnalyticsOptions = {}) {
  const sessionRef = useRef<StudioSession>({
    startTime: Date.now(),
    trackId: trackId || '',
    stemsLoaded: 0,
    playCount: 0,
    seekCount: 0,
    mixChanges: 0,
    exportCount: 0,
  });

  // Reset session when track changes
  useEffect(() => {
    if (trackId && trackId !== sessionRef.current.trackId) {
      // Log previous session
      logSessionEnd();
      
      // Start new session
      sessionRef.current = {
        startTime: Date.now(),
        trackId,
        stemsLoaded: 0,
        playCount: 0,
        seekCount: 0,
        mixChanges: 0,
        exportCount: 0,
      };
      
      trackFeature('studio:session', 'start', { trackId, projectId });
      logger.info('Studio session started', { trackId, projectId });
    }
  }, [trackId, projectId]);

  // Log session end on unmount
  useEffect(() => {
    return () => {
      logSessionEnd();
    };
  }, []);

  const logSessionEnd = useCallback(() => {
    const session = sessionRef.current;
    if (!session.trackId) return;
    
    const durationMs = Date.now() - session.startTime;
    
    trackFeature('studio:session', 'complete', {
      trackId: session.trackId,
      durationMs,
      stemsLoaded: session.stemsLoaded,
      playCount: session.playCount,
      seekCount: session.seekCount,
      mixChanges: session.mixChanges,
      exportCount: session.exportCount,
    });
    
    recordMetric('studio:session_duration', durationMs, 'ms');
    
    logger.info('Studio session ended', {
      durationSec: Math.round(durationMs / 1000),
      stats: {
        plays: session.playCount,
        seeks: session.seekCount,
        mixChanges: session.mixChanges,
        exports: session.exportCount,
      },
    });
  }, []);

  // Track stem loading
  const trackStemLoaded = useCallback((stemType: string, loadTimeMs: number, fromCache: boolean) => {
    sessionRef.current.stemsLoaded++;
    studioAnalytics.trackStemLoad(stemType, loadTimeMs, fromCache);
  }, []);

  // Track playback
  const trackPlay = useCallback(() => {
    sessionRef.current.playCount++;
    studioAnalytics.trackPlayback('play');
  }, []);

  const trackPause = useCallback(() => {
    studioAnalytics.trackPlayback('pause');
  }, []);

  const trackSeek = useCallback((position: number) => {
    sessionRef.current.seekCount++;
    studioAnalytics.trackPlayback('seek', position);
  }, []);

  // Track mix changes
  const trackVolumeChange = useCallback((stemType: string) => {
    sessionRef.current.mixChanges++;
    studioAnalytics.trackMixChange('volume', stemType);
  }, []);

  const trackMuteToggle = useCallback((stemType: string) => {
    sessionRef.current.mixChanges++;
    studioAnalytics.trackMixChange('mute', stemType);
  }, []);

  const trackSoloToggle = useCallback((stemType: string) => {
    sessionRef.current.mixChanges++;
    studioAnalytics.trackMixChange('solo', stemType);
  }, []);

  const trackPanChange = useCallback((stemType: string) => {
    sessionRef.current.mixChanges++;
    studioAnalytics.trackMixChange('pan', stemType);
  }, []);

  // Track export
  const trackExport = useCallback((format: string, stemsCount: number, durationMs: number) => {
    sessionRef.current.exportCount++;
    studioAnalytics.trackExport(format, stemsCount, durationMs);
  }, []);

  // Track transcription
  const trackTranscription = useCallback((model: string, success: boolean, durationMs: number) => {
    studioAnalytics.trackTranscription(model, success, durationMs);
  }, []);

  // Get current session stats
  const getSessionStats = useCallback(() => {
    const session = sessionRef.current;
    return {
      trackId: session.trackId,
      durationMs: Date.now() - session.startTime,
      stemsLoaded: session.stemsLoaded,
      playCount: session.playCount,
      seekCount: session.seekCount,
      mixChanges: session.mixChanges,
      exportCount: session.exportCount,
    };
  }, []);

  return {
    // Stem tracking
    trackStemLoaded,
    
    // Playback tracking
    trackPlay,
    trackPause,
    trackSeek,
    
    // Mix tracking
    trackVolumeChange,
    trackMuteToggle,
    trackSoloToggle,
    trackPanChange,
    
    // Export tracking
    trackExport,
    
    // Transcription tracking
    trackTranscription,
    
    // Session info
    getSessionStats,
    logSessionEnd,
  };
}
