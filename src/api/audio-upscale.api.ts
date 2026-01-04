/**
 * Audio Upscale API
 * 
 * Handles audio upscaling to 48kHz using AudioSR model
 */

import { supabase } from '@/integrations/supabase/client';

export interface UpscaleOptions {
  audioUrl: string;
  trackId?: string;
  ddimSteps?: number;       // 1-100, default 50
  guidanceScale?: number;   // 0.1-10, default 3.5
  truncatedBatches?: boolean;
  seed?: number;
}

export interface UpscaleResult {
  success: boolean;
  upscaledUrl: string;
  originalUrl: string;
  storedUrl?: string;
  trackId?: string;
  processingTimeMs?: number;
  quality: string;
  error?: string;
}

/**
 * Upscale audio to 48kHz HD quality
 */
export async function upscaleAudio(options: UpscaleOptions): Promise<UpscaleResult> {
  const { data, error } = await supabase.functions.invoke<UpscaleResult>(
    'replicate-audio-upscale',
    {
      body: {
        audioUrl: options.audioUrl,
        trackId: options.trackId,
        ddimSteps: options.ddimSteps ?? 50,
        guidanceScale: options.guidanceScale ?? 3.5,
        truncatedBatches: options.truncatedBatches ?? true,
        seed: options.seed,
      },
    }
  );

  if (error) {
    throw new Error(error.message || 'Failed to upscale audio');
  }

  if (!data) {
    throw new Error('No response from upscale service');
  }

  return data;
}

/**
 * Check if track has HD audio available
 */
export async function hasHdAudio(trackId: string): Promise<boolean> {
  const { data } = await supabase
    .from('tracks')
    .select('audio_url_hd, audio_quality')
    .eq('id', trackId)
    .single();

  return !!data?.audio_url_hd && data?.audio_quality === 'hd';
}

/**
 * Get HD audio URL for track
 */
export async function getHdAudioUrl(trackId: string): Promise<string | null> {
  const { data } = await supabase
    .from('tracks')
    .select('audio_url_hd')
    .eq('id', trackId)
    .single();

  return data?.audio_url_hd || null;
}

/**
 * Get upscale status for track
 */
export async function getUpscaleStatus(trackId: string): Promise<string | null> {
  const { data } = await supabase
    .from('tracks')
    .select('upscale_status')
    .eq('id', trackId)
    .single();

  return data?.upscale_status || null;
}
