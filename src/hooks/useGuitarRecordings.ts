import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { GuitarAnalysisResult } from './useGuitarAnalysis';

const log = logger.child({ module: 'GuitarRecordings' });

export interface GuitarRecording {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  audio_url: string;
  title: string | null;
  duration_seconds: number | null;
  bpm: number | null;
  time_signature: string | null;
  beats: any[];
  downbeats: number[];
  key: string | null;
  chords: any[];
  strumming: any[];
  midi_url: string | null;
  midi_quant_url: string | null;
  pdf_url: string | null;
  gp5_url: string | null;
  musicxml_url: string | null;
  notes: any[];
  generated_tags: string[];
  style_description: string | null;
  style_analysis: any;
  analysis_status: {
    beats: boolean;
    chords: boolean;
    transcription: boolean;
  };
  track_id: string | null;
}

export function useGuitarRecordings() {
  const queryClient = useQueryClient();

  const { data: recordings, isLoading } = useQuery({
    queryKey: ['guitar-recordings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('guitar_recordings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        log.error('Failed to fetch guitar recordings', error);
        throw error;
      }

      return data as unknown as GuitarRecording[];
    },
  });

  const saveRecording = useMutation({
    mutationFn: async ({
      analysis,
      audioUrl,
      title,
      durationSeconds,
    }: {
      analysis: GuitarAnalysisResult;
      audioUrl: string;
      title?: string;
      durationSeconds?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const recording = {
        user_id: user.id,
        audio_url: audioUrl,
        title: title || `Запись ${new Date().toLocaleDateString('ru-RU')}`,
        duration_seconds: durationSeconds ?? analysis.totalDuration ?? null,
        bpm: analysis.bpm || null,
        time_signature: analysis.timeSignature || null,
        beats: JSON.parse(JSON.stringify(analysis.beats || [])),
        downbeats: JSON.parse(JSON.stringify(analysis.downbeats || [])),
        key: analysis.key || null,
        chords: JSON.parse(JSON.stringify(analysis.chords || [])),
        strumming: JSON.parse(JSON.stringify(analysis.strumming || [])),
        midi_url: analysis.transcriptionFiles?.midiUrl || analysis.midiUrl || null,
        midi_quant_url: analysis.transcriptionFiles?.midiQuantUrl || null,
        pdf_url: analysis.transcriptionFiles?.pdfUrl || null,
        gp5_url: analysis.transcriptionFiles?.gp5Url || null,
        musicxml_url: analysis.transcriptionFiles?.musicXmlUrl || null,
        notes: JSON.parse(JSON.stringify(analysis.notes || [])),
        generated_tags: analysis.generatedTags || [],
        style_description: analysis.styleDescription || null,
        style_analysis: JSON.parse(JSON.stringify(analysis.style || {})),
        analysis_status: JSON.parse(JSON.stringify(analysis.analysisComplete || { beats: false, chords: false, transcription: false })),
      };

      const { data, error } = await supabase
        .from('guitar_recordings')
        .insert([recording] as any)
        .select()
        .single();

      if (error) {
        log.error('Failed to save guitar recording', error);
        throw error;
      }

      log.info('Guitar recording saved', { id: data.id });
      return data as unknown as GuitarRecording;
    },
    onSuccess: () => {
      toast.success('Запись сохранена');
      queryClient.invalidateQueries({ queryKey: ['guitar-recordings'] });
    },
    onError: (error: Error) => {
      toast.error(`Ошибка сохранения: ${error.message}`);
    },
  });

  const deleteRecording = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('guitar_recordings')
        .delete()
        .eq('id', id);

      if (error) {
        log.error('Failed to delete guitar recording', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Запись удалена');
      queryClient.invalidateQueries({ queryKey: ['guitar-recordings'] });
    },
    onError: (error: Error) => {
      toast.error(`Ошибка удаления: ${error.message}`);
    },
  });

  const updateRecording = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { data, error } = await supabase
        .from('guitar_recordings')
        .update({ title })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        log.error('Failed to update guitar recording', error);
        throw error;
      }

      return data as unknown as GuitarRecording;
    },
    onSuccess: () => {
      toast.success('Запись обновлена');
      queryClient.invalidateQueries({ queryKey: ['guitar-recordings'] });
    },
    onError: (error: Error) => {
      toast.error(`Ошибка обновления: ${error.message}`);
    },
  });

  // Convert database recording to GuitarAnalysisResult format
  const toAnalysisResult = (recording: GuitarRecording): GuitarAnalysisResult => ({
    beats: recording.beats || [],
    downbeats: recording.downbeats || [],
    bpm: recording.bpm || 120,
    timeSignature: recording.time_signature || '4/4',
    notes: recording.notes || [],
    midiUrl: recording.midi_url || undefined,
    chords: recording.chords || [],
    key: recording.key || 'Unknown',
    strumming: recording.strumming || [],
    transcriptionFiles: {
      midiUrl: recording.midi_url || undefined,
      midiQuantUrl: recording.midi_quant_url || undefined,
      pdfUrl: recording.pdf_url || undefined,
      gp5Url: recording.gp5_url || undefined,
      musicXmlUrl: recording.musicxml_url || undefined,
    },
    generatedTags: recording.generated_tags || [],
    styleDescription: recording.style_description || '',
    style: recording.style_analysis || {},
    totalDuration: recording.duration_seconds || 0,
    audioUrl: recording.audio_url,
    analysisComplete: recording.analysis_status || { beats: false, chords: false, transcription: false },
  });

  return {
    recordings: recordings || [],
    isLoading,
    saveRecording,
    deleteRecording,
    updateRecording,
    toAnalysisResult,
  };
}
