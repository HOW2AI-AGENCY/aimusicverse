/**
 * Audio Element Health Check Utilities
 * 
 * Provides utilities to validate and diagnose audio element health,
 * detect common issues, and suggest recovery actions.
 */

import { logger } from './logger';

export interface AudioHealthReport {
  isHealthy: boolean;
  issues: AudioHealthIssue[];
  warnings: string[];
  recommendations: string[];
  metrics: AudioMetrics;
}

export interface AudioHealthIssue {
  type: 'critical' | 'warning' | 'info';
  code: string;
  message: string;
  suggestion?: string;
}

export interface AudioMetrics {
  readyState: number;
  networkState: number;
  error: MediaError | null;
  currentTime: number;
  duration: number;
  buffered: {
    start: number;
    end: number;
  }[];
  paused: boolean;
  ended: boolean;
  seeking: boolean;
  volume: number;
  muted: boolean;
  src: string;
  srcValidLength: number;
}

/**
 * Get detailed metrics from audio element
 */
function getAudioMetrics(audio: HTMLAudioElement): AudioMetrics {
  const buffered: { start: number; end: number }[] = [];
  
  for (let i = 0; i < audio.buffered.length; i++) {
    buffered.push({
      start: audio.buffered.start(i),
      end: audio.buffered.end(i),
    });
  }

  return {
    readyState: audio.readyState,
    networkState: audio.networkState,
    error: audio.error,
    currentTime: audio.currentTime,
    duration: audio.duration || 0,
    buffered,
    paused: audio.paused,
    ended: audio.ended,
    seeking: audio.seeking,
    volume: audio.volume,
    muted: audio.muted,
    src: audio.src,
    srcValidLength: audio.src && audio.src !== window.location.href ? audio.src.length : 0,
  };
}

/**
 * Check audio element health
 */
export function checkAudioHealth(audio: HTMLAudioElement | null): AudioHealthReport {
  const issues: AudioHealthIssue[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // No audio element
  if (!audio) {
    return {
      isHealthy: false,
      issues: [{
        type: 'critical',
        code: 'NO_AUDIO_ELEMENT',
        message: 'Audio element is not initialized',
        suggestion: 'Create audio element instance',
      }],
      warnings: [],
      recommendations: ['Initialize GlobalAudioProvider'],
      metrics: {} as AudioMetrics,
    };
  }

  const metrics = getAudioMetrics(audio);

  // Check for audio errors
  if (metrics.error) {
    const errorMessages: Record<number, string> = {
      1: 'MEDIA_ERR_ABORTED: Loading was aborted',
      2: 'MEDIA_ERR_NETWORK: Network error while loading',
      3: 'MEDIA_ERR_DECODE: Decoding error',
      4: 'MEDIA_ERR_SRC_NOT_SUPPORTED: Source format not supported',
    };

    issues.push({
      type: 'critical',
      code: `MEDIA_ERROR_${metrics.error.code}`,
      message: errorMessages[metrics.error.code] || 'Unknown media error',
      suggestion: 'Check audio source URL and format',
    });
  }

  // Check source
  if (!metrics.src || metrics.src === window.location.href) {
    issues.push({
      type: 'warning',
      code: 'NO_SOURCE',
      message: 'No audio source set',
      suggestion: 'Set valid audio source URL',
    });
  } else if (metrics.srcValidLength < 10) {
    warnings.push('Audio source URL seems too short');
  }

  // Check ready state
  if (metrics.readyState < 2) {
    warnings.push(`Audio not ready (readyState: ${metrics.readyState})`);
    
    if (metrics.readyState === 0) {
      issues.push({
        type: 'info',
        code: 'NOT_LOADED',
        message: 'Audio has not started loading',
        suggestion: 'Call audio.load() to start loading',
      });
    }
  }

  // Check network state
  if (metrics.networkState === 3) {
    issues.push({
      type: 'critical',
      code: 'NETWORK_NO_SOURCE',
      message: 'No audio source found',
      suggestion: 'Verify audio source URL',
    });
  } else if (metrics.networkState === 0) {
    warnings.push('Network idle (no data loading)');
  }

  // Check duration
  if (!isFinite(metrics.duration) || metrics.duration <= 0) {
    if (metrics.readyState >= 1) {
      warnings.push('Duration is invalid or unknown');
    }
  }

  // Check playback position
  if (!isFinite(metrics.currentTime) || metrics.currentTime < 0) {
    issues.push({
      type: 'warning',
      code: 'INVALID_TIME',
      message: 'Current time is invalid',
      suggestion: 'Reset currentTime to 0',
    });
  }

  if (metrics.currentTime > metrics.duration && metrics.duration > 0) {
    issues.push({
      type: 'warning',
      code: 'TIME_OVERFLOW',
      message: 'Current time exceeds duration',
      suggestion: 'Reset to valid position',
    });
  }

  // Check volume
  if (metrics.volume < 0 || metrics.volume > 1) {
    issues.push({
      type: 'warning',
      code: 'INVALID_VOLUME',
      message: `Volume out of range: ${metrics.volume}`,
      suggestion: 'Set volume between 0 and 1',
    });
  }

  if (metrics.volume === 0 && !metrics.muted) {
    warnings.push('Volume is 0 but not muted');
    recommendations.push('Consider showing volume indicator to user');
  }

  // Check seeking state
  if (metrics.seeking) {
    warnings.push('Audio is in seeking state');
  }

  // Check buffering
  if (metrics.buffered.length === 0 && metrics.readyState >= 2) {
    warnings.push('No buffered data available');
    recommendations.push('Check network connection');
  }

  // Check for stalled playback
  if (!metrics.paused && !metrics.ended && metrics.readyState < 3) {
    warnings.push('Playback may be stalled (insufficient data)');
    recommendations.push('Monitor buffer and network status');
  }

  // Generate recommendations based on issues
  if (issues.some(i => i.code.includes('NETWORK'))) {
    recommendations.push('Check internet connection');
    recommendations.push('Try reloading the audio source');
  }

  if (issues.some(i => i.code.includes('DECODE'))) {
    recommendations.push('Verify audio file format is supported');
    recommendations.push('Try different audio quality/format');
  }

  if (warnings.length > 3) {
    recommendations.push('Consider resetting audio element');
  }

  // Determine overall health
  const hasCriticalIssues = issues.some(i => i.type === 'critical');
  const hasMultipleWarnings = issues.filter(i => i.type === 'warning').length > 2;
  const isHealthy = !hasCriticalIssues && !hasMultipleWarnings;

  return {
    isHealthy,
    issues,
    warnings,
    recommendations,
    metrics,
  };
}

/**
 * Attempt to recover from audio issues
 */
export async function attemptAudioRecovery(
  audio: HTMLAudioElement,
  report: AudioHealthReport
): Promise<boolean> {
  logger.debug('Attempting audio recovery', {
    issues: report.issues.map(i => i.code),
    warnings: report.warnings,
  });

  try {
    // Reset invalid time
    if (report.issues.some(i => i.code === 'INVALID_TIME')) {
      audio.currentTime = 0;
      logger.debug('Reset invalid currentTime');
    }

    // Reset invalid volume
    if (report.issues.some(i => i.code === 'INVALID_VOLUME')) {
      audio.volume = 1;
      logger.debug('Reset invalid volume');
    }

    // Reload source if network error
    if (report.issues.some(i => i.code.includes('NETWORK'))) {
      const currentSrc = audio.src;
      if (currentSrc && currentSrc !== window.location.href) {
        audio.load();
        logger.debug('Reloaded audio source after network error');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Verify recovery
    const newReport = checkAudioHealth(audio);
    const recovered = newReport.issues.length < report.issues.length;

    logger.debug('Audio recovery result', {
      recovered,
      remainingIssues: newReport.issues.length,
    });

    return recovered;
  } catch (error) {
    logger.error('Audio recovery failed', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Log audio health report
 */
export function logAudioHealth(audio: HTMLAudioElement | null, context?: string) {
  const report = checkAudioHealth(audio);
  
  const logContext = {
    context: context || 'health-check',
    isHealthy: report.isHealthy,
    criticalIssues: report.issues.filter(i => i.type === 'critical').length,
    warnings: report.warnings.length,
    readyState: report.metrics.readyState,
    networkState: report.metrics.networkState,
    hasError: !!report.metrics.error,
  };

  if (report.isHealthy) {
    logger.debug('Audio health check: OK', logContext);
  } else {
    logger.warn('Audio health check: Issues detected', {
      ...logContext,
      issues: report.issues,
      recommendations: report.recommendations,
    });
  }

  return report;
}
