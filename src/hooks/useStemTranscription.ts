/**
 * Hook for managing stem transcriptions (MIDI, PDF, MusicXML, etc.)
 * Integrates with stem_transcriptions table
 */
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

const log = logger.child({ module: 'StemTranscription' });

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

export interface SaveTranscriptionParams {
  stemId: string;
  trackId: string;
  midiUrl?: string | null;
  midiQuantUrl?: string | null;
  mxmlUrl?: string | null;
  gp5Url?: string | null;
  pdfUrl?: string | null;
  model: string;
  notes?: any[] | null;
  notesCount?: number | null;
  bpm?: number | null;
  keyDetected?: string | null;
  timeSignature?: string | null;
  durationSeconds?: number | null;
  klangioLogId?: string | null;
}

/**
 * Fetch transcriptions for a specific stem
 */
export function useStemTranscription(stemId: string | undefined) {
  const queryClient = useQueryClient();

  const {
    data: transcriptions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['stem-transcriptions', stemId],
    queryFn: async (): Promise<StemTranscription[]> => {
      if (!stemId) return [];

      const { data, error } = await supabase
        .from('stem_transcriptions')
        .select('*')
        .eq('stem_id', stemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as StemTranscription[]) || [];
    },
    enabled: !!stemId,
    staleTime: 30000,
  });

  // Latest transcription for this stem
  const latestTranscription = useMemo(() => {
    return transcriptions?.[0] || null;
  }, [transcriptions]);

  // Has any transcription files (MIDI, PDF, MusicXML, GP5)
  const hasTranscription = useMemo(() => {
    if (!latestTranscription) return false;
    return !!(
      latestTranscription.midi_url ||
      latestTranscription.pdf_url ||
      latestTranscription.mxml_url ||
      latestTranscription.gp5_url
    );
  }, [latestTranscription]);

  return {
    transcriptions,
    latestTranscription,
    hasTranscription,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Fetch all transcriptions for a track
 */
export function useTrackTranscriptions(trackId: string | undefined) {
  const {
    data: transcriptions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['track-transcriptions', trackId],
    queryFn: async (): Promise<StemTranscription[]> => {
      if (!trackId) return [];

      const { data, error } = await supabase
        .from('stem_transcriptions')
        .select('*')
        .eq('track_id', trackId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as StemTranscription[]) || [];
    },
    enabled: !!trackId,
    staleTime: 30000,
  });

  // Group by stem_id
  const transcriptionsByStem = useMemo(() => {
    const grouped: Record<string, StemTranscription> = {};
    transcriptions?.forEach((t) => {
      if (!grouped[t.stem_id]) {
        grouped[t.stem_id] = t;
      }
    });
    return grouped;
  }, [transcriptions]);

  return {
    transcriptions,
    transcriptionsByStem,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Save or update stem transcription
 */
export function useSaveTranscription() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: SaveTranscriptionParams): Promise<StemTranscription> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизован');

      // Check if transcription exists for this stem
      const { data: existing } = await supabase
        .from('stem_transcriptions')
        .select('id')
        .eq('stem_id', params.stemId)
        .eq('model', params.model)
        .maybeSingle();

      const transcriptionData = {
        stem_id: params.stemId,
        track_id: params.trackId,
        user_id: user.id,
        midi_url: params.midiUrl,
        midi_quant_url: params.midiQuantUrl,
        mxml_url: params.mxmlUrl,
        gp5_url: params.gp5Url,
        pdf_url: params.pdfUrl,
        model: params.model,
        notes: params.notes,
        notes_count: params.notesCount,
        bpm: params.bpm,
        key_detected: params.keyDetected,
        time_signature: params.timeSignature,
        duration_seconds: params.durationSeconds,
        klangio_log_id: params.klangioLogId,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('stem_transcriptions')
          .update(transcriptionData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        log.info('Transcription updated', { id: existing.id });
        return data as StemTranscription;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('stem_transcriptions')
          .insert(transcriptionData)
          .select()
          .single();

        if (error) throw error;
        log.info('Transcription saved', { stemId: params.stemId });
        return data as StemTranscription;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stem-transcriptions', data.stem_id] });
      queryClient.invalidateQueries({ queryKey: ['track-transcriptions', data.track_id] });
      toast.success('Транскрипция сохранена');
    },
    onError: (error) => {
      log.error('Failed to save transcription', { error });
      toast.error('Ошибка сохранения транскрипции');
    },
  });

  return {
    saveTranscription: mutation.mutateAsync,
    isSaving: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Delete stem transcription
 */
export function useDeleteTranscription() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (transcriptionId: string): Promise<void> => {
      const { error } = await supabase
        .from('stem_transcriptions')
        .delete()
        .eq('id', transcriptionId);

      if (error) throw error;
      log.info('Transcription deleted', { id: transcriptionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stem-transcriptions'] });
      queryClient.invalidateQueries({ queryKey: ['track-transcriptions'] });
      toast.success('Транскрипция удалена');
    },
    onError: (error) => {
      log.error('Failed to delete transcription', { error });
      toast.error('Ошибка удаления');
    },
  });

  return {
    deleteTranscription: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}
