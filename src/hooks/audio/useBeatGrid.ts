/**
 * Hook for loading beat grid data from audio analysis
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface Beat {
  time: number;
  beatNumber: number;
  isDownbeat: boolean;
}

export interface BeatGridData {
  beats: Beat[];
  bpm: number | null;
  timeSignature: string | null;
  duration: number;
}

interface UseBeatGridReturn {
  beatGrid: BeatGridData | null;
  isLoading: boolean;
  error: Error | null;
}

export function useBeatGrid(trackId: string | null | undefined): UseBeatGridReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['beat-grid', trackId],
    queryFn: async (): Promise<BeatGridData | null> => {
      if (!trackId) return null;

      const { data: analysis, error } = await supabase
        .from('audio_analysis')
        .select('bpm, beats_data, analysis_metadata')
        .eq('track_id', trackId)
        .maybeSingle();

      if (error) {
        logger.error('Failed to load beat grid', { trackId, error });
        throw error;
      }

      if (!analysis) {
        return null;
      }

      // Parse beats data
      const beatsData = analysis.beats_data as any;
      const metadata = analysis.analysis_metadata as any;
      
      let beats: Beat[] = [];
      
      if (beatsData?.beats && Array.isArray(beatsData.beats)) {
        beats = beatsData.beats.map((time: number, index: number) => ({
          time,
          beatNumber: index + 1,
          isDownbeat: beatsData.downbeats?.includes(time) || index % 4 === 0,
        }));
      }

      return {
        beats,
        bpm: analysis.bpm,
        timeSignature: metadata?.time_signature || '4/4',
        duration: metadata?.duration || 0,
      };
    },
    enabled: !!trackId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  return {
    beatGrid: data ?? null,
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Generate synthetic beat grid from BPM
 */
export function generateSyntheticBeatGrid(
  bpm: number,
  duration: number,
  timeSignature: string = '4/4'
): Beat[] {
  const beatsPerBar = parseInt(timeSignature.split('/')[0]) || 4;
  const beatInterval = 60 / bpm;
  const beats: Beat[] = [];
  
  let time = 0;
  let beatNumber = 1;
  
  while (time < duration) {
    beats.push({
      time,
      beatNumber,
      isDownbeat: (beatNumber - 1) % beatsPerBar === 0,
    });
    time += beatInterval;
    beatNumber++;
  }
  
  return beats;
}

export default useBeatGrid;
