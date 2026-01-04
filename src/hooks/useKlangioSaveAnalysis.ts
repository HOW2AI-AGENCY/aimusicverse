/**
 * Hook for saving Klangio analysis results to the database
 */

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ChordResult, BeatResult, TranscriptionResult } from '@/hooks/useKlangioAnalysis';
import { logger } from '@/lib/logger';

interface SaveAnalysisParams {
  trackId: string;
  analysisType: 'transcription' | 'chord-recognition' | 'beat-tracking' | 'full';
  chords?: ChordResult;
  beats?: BeatResult;
  transcription?: TranscriptionResult;
}

export function useKlangioSaveAnalysis() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (params: SaveAnalysisParams) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { trackId, analysisType, chords, beats, transcription } = params;

      // Build the analysis data object
      const analysisData: Record<string, any> = {
        track_id: trackId,
        user_id: user.id,
        analysis_type: analysisType,
        updated_at: new Date().toISOString(),
      };

      // Add chord data if available
      if (chords) {
        analysisData.key_signature = chords.key || null;
        analysisData.analysis_metadata = {
          ...(analysisData.analysis_metadata || {}),
          chords: chords.chords,
          strumming: chords.strumming,
          chord_count: chords.chords?.length || 0,
        };
      }

      // Add beat data if available
      if (beats) {
        analysisData.bpm = beats.bpm || null;
        analysisData.beats_data = {
          beats: beats.beats,
          downbeats: beats.downbeats,
          time_signature: beats.time_signature,
        };
        if (beats.time_signature) {
          analysisData.analysis_metadata = {
            ...(analysisData.analysis_metadata || {}),
            time_signature: beats.time_signature,
          };
        }
      }

      // Add transcription data if available
      if (transcription) {
        analysisData.analysis_metadata = {
          ...(analysisData.analysis_metadata || {}),
          notes_count: transcription.notes?.length || 0,
          files: transcription.files,
        };
      }

      // Check if analysis already exists for this track
      const { data: existing } = await supabase
        .from('audio_analysis')
        .select('id')
        .eq('track_id', trackId)
        .eq('user_id', user.id)
        .maybeSingle();

      let result;
      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('audio_analysis')
          .update(analysisData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
        logger.info('Updated existing audio analysis', { trackId, analysisType });
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('audio_analysis')
          .insert(analysisData as any)
          .select()
          .single();

        if (error) throw error;
        result = data;
        logger.info('Created new audio analysis', { trackId, analysisType });
      }

      return result;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['audio-analysis', params.trackId] });
      queryClient.invalidateQueries({ queryKey: ['beat-grid', params.trackId] });
      toast.success('Анализ сохранён');
    },
    onError: (error) => {
      logger.error('Failed to save analysis', { error });
      toast.error('Ошибка сохранения анализа');
    },
  });

  const saveAnalysis = useCallback((params: SaveAnalysisParams) => {
    return saveMutation.mutateAsync(params);
  }, [saveMutation]);

  return {
    saveAnalysis,
    isSaving: saveMutation.isPending,
  };
}

/**
 * Hook for loading saved analysis data
 */
export function useKlangioLoadAnalysis(trackId: string | null) {
  return useQueryClient().getQueryData(['audio-analysis', trackId]);
}
