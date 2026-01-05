/**
 * Audio Watermark API
 * 
 * Handles audio watermarking using Resemble AI's neural watermark model
 */

import { supabase } from '@/integrations/supabase/client';

export interface WatermarkOptions {
  audioUrl: string;
  trackId?: string;
  mode: 'apply' | 'detect';
}

export interface WatermarkResult {
  success: boolean;
  mode: 'apply' | 'detect';
  watermarkedUrl?: string;
  storedUrl?: string;
  hasWatermark?: boolean;
  trackId?: string;
  processingTimeMs?: number;
  error?: string;
}

/**
 * Apply or detect watermark on audio
 */
export async function watermarkAudio(options: WatermarkOptions): Promise<WatermarkResult> {
  const { data, error } = await supabase.functions.invoke<WatermarkResult>(
    'replicate-audio-watermark',
    {
      body: {
        audioUrl: options.audioUrl,
        trackId: options.trackId,
        mode: options.mode,
      },
    }
  );

  if (error) {
    throw new Error(error.message || 'Failed to process watermark');
  }

  if (!data) {
    throw new Error('No response from watermark service');
  }

  return data;
}

/**
 * Apply watermark to audio
 */
export async function applyWatermark(audioUrl: string, trackId?: string): Promise<WatermarkResult> {
  return watermarkAudio({ audioUrl, trackId, mode: 'apply' });
}

/**
 * Detect if audio has watermark
 */
export async function detectWatermark(audioUrl: string): Promise<boolean> {
  const result = await watermarkAudio({ audioUrl, mode: 'detect' });
  return result.hasWatermark ?? false;
}

/**
 * Check if track has watermark applied
 */
export async function hasWatermark(trackId: string): Promise<boolean> {
  const { data } = await supabase
    .from('tracks')
    .select('is_watermarked')
    .eq('id', trackId)
    .single();

  return data?.is_watermarked ?? false;
}

/**
 * Get watermarked audio URL for track
 */
export async function getWatermarkedUrl(trackId: string): Promise<string | null> {
  const { data } = await supabase
    .from('tracks')
    .select('watermarked_url')
    .eq('id', trackId)
    .single();

  return data?.watermarked_url || null;
}
