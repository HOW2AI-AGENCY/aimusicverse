/**
 * Hook for loading waveform data with caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getWaveform, saveWaveform } from '@/lib/waveformCache';
import { generateWaveformFromUrl, WaveformResult, getOptimalSampleCount } from '@/lib/waveformGenerator';
import { logger } from '@/lib/logger';

interface UseWaveformDataOptions {
  samples?: number;
  autoLoad?: boolean;
  containerWidth?: number;
  trackId?: string; // Stable key for caching (preferred over URL)
}

interface UseWaveformDataReturn {
  waveformData: number[] | null;
  peaks: number[] | null;
  duration: number;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

export function useWaveformData(
  audioUrl: string | null | undefined,
  options: UseWaveformDataOptions = {}
): UseWaveformDataReturn {
  const {
    samples: requestedSamples,
    autoLoad = true,
    containerWidth,
    trackId,
  } = options;

  const [waveformData, setWaveformData] = useState<number[] | null>(null);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const loadingRef = useRef(false);
  const urlRef = useRef<string | null>(null);

  // Calculate optimal samples based on container width
  const samples = requestedSamples ?? (containerWidth ? getOptimalSampleCount(containerWidth) : 100);

  const loadWaveform = useCallback(async () => {
    if (!audioUrl || loadingRef.current) return;
    
    // Prevent duplicate loads for same URL
    if (urlRef.current === audioUrl && waveformData) return;
    
    loadingRef.current = true;
    urlRef.current = audioUrl;
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first (priority: trackId > url)
      const cached = await getWaveform(audioUrl, trackId);
      if (cached && cached.length > 0) {
        setWaveformData(cached);
        setPeaks(cached); // Use same data for peaks if not stored separately
        logger.debug('Waveform loaded from cache', { url: audioUrl, trackId, samples: cached.length });
        setIsLoading(false);
        loadingRef.current = false;
        return;
      }

      // Generate new waveform
      const result: WaveformResult = await generateWaveformFromUrl(audioUrl, { samples });
      
      setWaveformData(result.samples);
      setPeaks(result.peaks);
      setDuration(result.duration);

      // Save to cache (with trackId if available for stable caching)
      await saveWaveform(audioUrl, result.samples, trackId);
      
      logger.debug('Waveform generated and cached', { url: audioUrl, trackId, samples: result.samples.length });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load waveform');
      setError(error);
      logger.error('Waveform load error', { url: audioUrl, error });
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [audioUrl, samples, waveformData, trackId]);

  // Auto-load on mount and URL change
  useEffect(() => {
    if (autoLoad && audioUrl) {
      loadWaveform();
    }
  }, [audioUrl, autoLoad, loadWaveform]);

  // Reset state when URL changes
  useEffect(() => {
    if (audioUrl !== urlRef.current) {
      setWaveformData(null);
      setPeaks(null);
      setDuration(0);
      setError(null);
    }
  }, [audioUrl]);

  return {
    waveformData,
    peaks,
    duration,
    isLoading,
    error,
    reload: loadWaveform,
  };
}

export default useWaveformData;
