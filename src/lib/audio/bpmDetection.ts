/**
 * BPM Detection Utilities
 * Uses web-audio-beat-detector package for tempo detection
 */

import { detect } from 'web-audio-beat-detector';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'bpmDetection' });

export interface BPMDetectionResult {
  bpm: number;
  offset: number;
  confidence: number;
}

export interface BPMDetectionOptions {
  /**
   * Minimum BPM to detect
   * @default 60
   */
  minBPM?: number;

  /**
   * Maximum BPM to detect
   * @default 200
   */
  maxBPM?: number;

  /**
   * Whether to use web worker for processing
   * @default true
   */
  useWorker?: boolean;
}

/**
 * Detect BPM from an audio buffer
 * @param audioBuffer - AudioBuffer to analyze
 * @param options - Detection options
 * @returns BPM detection result or null if detection fails
 */
export async function detectBPM(
  audioBuffer: AudioBuffer,
  options: BPMDetectionOptions = {}
): Promise<BPMDetectionResult | null> {
  const {
    minBPM = 60,
    maxBPM = 200,
    useWorker = true,
  } = options;

  try {
    log.debug('Starting BPM detection', {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
    });

    const startTime = performance.now();

    // Use web-audio-beat-detector package
    const result = await detect(audioBuffer, {
      offset: 0,
      returnTempo: true,
    });

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    log.info('BPM detection complete', {
      bpm: result.bpm,
      offset: result.offset,
      processingTime: `${processingTime.toFixed(2)}ms`,
    });

    // Validate BPM is within reasonable range
    if (result.bpm < minBPM || result.bpm > maxBPM) {
      log.warn('BPM outside expected range', {
        detected: result.bpm,
        min: minBPM,
        max: maxBPM,
      });
    }

    return {
      bpm: result.bpm,
      offset: result.offset || 0,
      confidence: calculateConfidence(result.bpm, audioBuffer.duration),
    };

  } catch (error) {
    log.error('BPM detection failed', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Detect BPM from an audio file URL
 * @param audioUrl - URL of audio file to analyze
 * @param options - Detection options
 * @returns BPM detection result or null if detection fails
 */
export async function detectBPMFromUrl(
  audioUrl: string,
  options: BPMDetectionOptions = {}
): Promise<BPMDetectionResult | null> {
  try {
    log.debug('Fetching audio for BPM detection', { audioUrl });

    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    // Create audio context
    const audioContext = new AudioContext();

    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const result = await detectBPM(audioBuffer, options);

      await audioContext.close();

      return result;
    } catch (error) {
      await audioContext.close();
      throw error;
    }

  } catch (error) {
    log.error('Failed to detect BPM from URL', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Calculate confidence score for BPM detection
 * Higher confidence for:
 * - Longer audio samples
 * - BPMs in common ranges (e.g., 60-140)
 * - Whole number BPMs (more likely to be accurate)
 */
function calculateConfidence(bpm: number, duration: number): number {
  let confidence = 0.5; // Base confidence

  // Increase confidence for longer samples
  if (duration > 60) confidence += 0.2;
  if (duration > 180) confidence += 0.1;

  // Increase confidence for common BPM ranges
  if (bpm >= 80 && bpm <= 140) confidence += 0.1;
  if (bpm >= 100 && bpm <= 130) confidence += 0.1;

  // Increase confidence for whole number BPMs
  if (Number.isInteger(bpm)) confidence += 0.1;

  // Cap at 1.0
  return Math.min(confidence, 1.0);
}

/**
 * Round BPM to nearest whole number if confidence is high
 * @param bpm - Detected BPM
 * @param confidence - Confidence score (0-1)
 * @returns Rounded BPM or original if confidence is low
 */
export function maybeRoundBPM(bpm: number, confidence: number): number {
  if (confidence >= 0.8) {
    return Math.round(bpm);
  }
  return bpm;
}

/**
 * Convert BPM to beat duration in seconds
 * @param bpm - Beats per minute
 * @returns Duration of one beat in seconds
 */
export function bpmToBeatDuration(bpm: number): number {
  return 60 / bpm;
}

/**
 * Convert beat duration to BPM
 * @param beatDuration - Duration of one beat in seconds
 * @returns Beats per minute
 */
export function beatDurationToBPM(beatDuration: number): number {
  return 60 / beatDuration;
}
