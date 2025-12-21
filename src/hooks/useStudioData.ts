/**
 * useStudioData - Consolidated studio data fetching
 * 
 * Combines stems, transcriptions, and waveform prefetching
 * in a single optimized hook to reduce DB queries
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { waveformWorkerPool } from '@/lib/waveformWorkerPool';
import { logger } from '@/lib/logger';

export interface TrackStem {
  id: string;
  track_id: string;
  stem_type: string;
  audio_url: string;
  separation_mode: string | null;
  version_id: string | null;
  source?: 'separated' | 'generated' | 'uploaded' | string | null;
  generation_prompt?: string | null;
  generation_model?: string | null;
  created_at: string | null;
}

export interface StemTranscription {
  id: string;
  stem_id: string;
  track_id: string;
  user_id: string;
  midi_url: string | null;
  midi_quant_url: string | null;
  mxml_url: string | null;
  gp5_url: string | null;
  pdf_url: string | null;
  model: string;
  notes: any[] | null;
  notes_count: number | null;
  bpm: number | null;
  key_detected: string | null;
  time_signature: string | null;
  duration_seconds: number | null;
  klangio_log_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudioData {
  stems: TrackStem[];
  transcriptions: StemTranscription[];
  transcriptionsByStem: Record<string, StemTranscription>;
}

/**
 * Fetch all studio data in parallel with single queries
 */
export function useStudioData(trackId: string | undefined) {
  const queryClient = useQueryClient();
  const prefetchedRef = useRef(false);
  
  const query = useQuery({
    queryKey: ['studio-data', trackId],
    queryFn: async (): Promise<StudioData> => {
      if (!trackId) {
        return { stems: [], transcriptions: [], transcriptionsByStem: {} };
      }
      
      // Fetch stems and transcriptions in parallel
      const [stemsResult, transcriptionsResult] = await Promise.all([
        supabase
          .from('track_stems')
          .select('*')
          .eq('track_id', trackId)
          .order('created_at', { ascending: false }),
        supabase
          .from('stem_transcriptions')
          .select('*')
          .eq('track_id', trackId)
          .order('created_at', { ascending: false }),
      ]);
      
      if (stemsResult.error) throw stemsResult.error;
      if (transcriptionsResult.error) throw transcriptionsResult.error;
      
      const stems = (stemsResult.data || []) as TrackStem[];
      const transcriptions = (transcriptionsResult.data || []) as StemTranscription[];
      
      // Group transcriptions by stem_id (latest only)
      const transcriptionsByStem: Record<string, StemTranscription> = {};
      transcriptions.forEach((t) => {
        if (!transcriptionsByStem[t.stem_id]) {
          transcriptionsByStem[t.stem_id] = t;
        }
      });
      
      logger.debug('Studio data loaded', { 
        trackId, 
        stemsCount: stems.length, 
        transcriptionsCount: transcriptions.length 
      });
      
      return { stems, transcriptions, transcriptionsByStem };
    },
    enabled: !!trackId,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Prefetch waveforms for all stems
  useEffect(() => {
    if (!query.data?.stems || prefetchedRef.current) return;
    
    const audioUrls = query.data.stems
      .map(s => s.audio_url)
      .filter(Boolean);
    
    if (audioUrls.length > 0) {
      prefetchedRef.current = true;
      
      // Prefetch waveforms in background
      waveformWorkerPool.prefetchMany(audioUrls).catch((error) => {
        logger.warn('Waveform prefetch failed', { error });
      });
    }
  }, [query.data?.stems]);
  
  // Reset prefetch flag when track changes
  useEffect(() => {
    prefetchedRef.current = false;
  }, [trackId]);
  
  // Memoized stems sorted by priority
  const sortedStems = useMemo(() => {
    if (!query.data?.stems) return [];
    
    const priority: Record<string, number> = {
      vocals: 1,
      vocal: 1,
      bass: 2,
      drums: 3,
      guitar: 4,
      piano: 5,
      keyboard: 5,
      instrumental: 6,
      other: 10,
    };
    
    return [...query.data.stems].sort((a, b) => {
      const pA = priority[a.stem_type.toLowerCase()] || 10;
      const pB = priority[b.stem_type.toLowerCase()] || 10;
      return pA - pB;
    });
  }, [query.data?.stems]);
  
  return {
    ...query,
    stems: query.data?.stems || [],
    sortedStems,
    transcriptions: query.data?.transcriptions || [],
    transcriptionsByStem: query.data?.transcriptionsByStem || {},
    stemsLoading: query.isLoading,
    transcriptionsLoading: query.isLoading,
  };
}
