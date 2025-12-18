/**
 * Unified Waveform Generator
 * Single source of truth for waveform data generation
 */

import { logger } from '@/lib/logger';

export interface WaveformOptions {
  samples?: number;
  normalize?: boolean;
  smoothing?: number;
}

export interface WaveformResult {
  samples: number[];
  peaks: number[];
  duration: number;
  sampleRate: number;
}

const DEFAULT_SAMPLES = 100;
const MAX_SAMPLES = 500;

// Shared AudioContext for all waveform operations
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContext();
  }
  return sharedAudioContext;
}

/**
 * Generate waveform data from audio URL
 */
export async function generateWaveformFromUrl(
  audioUrl: string,
  options: WaveformOptions = {}
): Promise<WaveformResult> {
  const {
    samples = DEFAULT_SAMPLES,
    normalize = true,
    smoothing = 0.8,
  } = options;

  const clampedSamples = Math.min(Math.max(samples, 10), MAX_SAMPLES);

  try {
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return await generateWaveformFromBuffer(arrayBuffer, {
      samples: clampedSamples,
      normalize,
      smoothing,
    });
  } catch (error) {
    logger.error('Waveform generation failed', { audioUrl, error });
    // Return empty waveform on error
    return {
      samples: new Array(clampedSamples).fill(0),
      peaks: new Array(clampedSamples).fill(0),
      duration: 0,
      sampleRate: 44100,
    };
  }
}

/**
 * Generate waveform from ArrayBuffer
 */
export async function generateWaveformFromBuffer(
  buffer: ArrayBuffer,
  options: WaveformOptions = {}
): Promise<WaveformResult> {
  const {
    samples = DEFAULT_SAMPLES,
    normalize = true,
    smoothing = 0.8,
  } = options;

  const audioContext = getAudioContext();
  
  try {
    const audioBuffer = await audioContext.decodeAudioData(buffer.slice(0));
    return generateWaveformFromAudioBuffer(audioBuffer, {
      samples,
      normalize,
      smoothing,
    });
  } catch (error) {
    logger.error('Audio decode failed', error);
    return {
      samples: new Array(samples).fill(0),
      peaks: new Array(samples).fill(0),
      duration: 0,
      sampleRate: 44100,
    };
  }
}

/**
 * Generate waveform from AudioBuffer
 */
export function generateWaveformFromAudioBuffer(
  audioBuffer: AudioBuffer,
  options: WaveformOptions = {}
): WaveformResult {
  const {
    samples = DEFAULT_SAMPLES,
    normalize = true,
    smoothing = 0.8,
  } = options;

  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / samples);
  
  const rawSamples: number[] = [];
  const peaks: number[] = [];

  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, channelData.length);
    
    let sum = 0;
    let peak = 0;
    
    for (let j = start; j < end; j++) {
      const value = Math.abs(channelData[j]);
      sum += value;
      if (value > peak) peak = value;
    }
    
    rawSamples.push(sum / (end - start));
    peaks.push(peak);
  }

  // Apply smoothing
  const smoothedSamples = applySmoothing(rawSamples, smoothing);

  // Normalize if requested
  if (normalize) {
    const maxValue = Math.max(...smoothedSamples, 0.01);
    const normalizedSamples = smoothedSamples.map(v => v / maxValue);
    const normalizedPeaks = peaks.map(v => v / Math.max(...peaks, 0.01));
    
    return {
      samples: normalizedSamples,
      peaks: normalizedPeaks,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
    };
  }

  return {
    samples: smoothedSamples,
    peaks,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
  };
}

/**
 * Apply smoothing to waveform data
 */
function applySmoothing(data: number[], factor: number): number[] {
  if (factor <= 0 || factor >= 1) return data;
  
  const result: number[] = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    result.push(result[i - 1] * factor + data[i] * (1 - factor));
  }
  
  return result;
}

/**
 * Resample waveform to different number of samples
 */
export function resampleWaveform(
  data: number[],
  targetSamples: number
): number[] {
  if (data.length === targetSamples) return data;
  
  const result: number[] = [];
  const ratio = data.length / targetSamples;
  
  for (let i = 0; i < targetSamples; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, data.length - 1);
    const t = srcIndex - srcIndexFloor;
    
    // Linear interpolation
    result.push(data[srcIndexFloor] * (1 - t) + data[srcIndexCeil] * t);
  }
  
  return result;
}

/**
 * Get optimal sample count based on container width
 */
export function getOptimalSampleCount(width: number, barWidth: number = 3, gap: number = 1): number {
  return Math.min(Math.max(Math.floor(width / (barWidth + gap)), 20), MAX_SAMPLES);
}

/**
 * Clean up shared audio context
 */
export function cleanupWaveformAudioContext(): void {
  if (sharedAudioContext && sharedAudioContext.state !== 'closed') {
    sharedAudioContext.close();
    sharedAudioContext = null;
  }
}
