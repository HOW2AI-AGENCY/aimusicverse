import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'StemMidi' });

interface StemMidiVersion {
  id: string;
  audio_url: string;
  created_at: string;
  metadata: {
    model_type?: string;
    stem_id?: string;
    stem_type?: string;
    transcribed_at?: string;
  } | null;
}

export function useStemMidi(trackId: string, stemId?: string) {
  const queryClient = useQueryClient();
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Fetch existing MIDI versions for stem
  const { data: midiVersions, isLoading } = useQuery({
    queryKey: ['stem-midi', trackId, stemId],
    queryFn: async () => {
      const query = supabase
        .from('track_versions')
        .select('id, audio_url, created_at, metadata')
        .eq('track_id', trackId)
        .eq('version_type', stemId ? 'stem_midi_transcription' : 'midi_transcription')
        .order('created_at', { ascending: false });

      // Filter by stem_id in metadata if provided
      if (stemId) {
        query.filter('metadata->>stem_id', 'eq', stemId);
      }

      const { data, error } = await query;
      
      if (error) {
        log.error('Error fetching stem MIDI versions', error);
        return [];
      }
      
      return (data || []) as StemMidiVersion[];
    },
    enabled: !!trackId,
  });

  // Transcribe mutation
  const transcribeMutation = useMutation({
    mutationFn: async ({
      audioUrl,
      modelType = 'mt3',
      stemType,
    }: {
      audioUrl: string;
      modelType?: 'mt3' | 'basic-pitch';
      stemType?: string;
    }) => {
      log.info('Starting stem MIDI transcription', { trackId, stemId, modelType, stemType });

      const { data, error } = await supabase.functions.invoke('transcribe-midi', {
        body: {
          track_id: trackId,
          audio_url: audioUrl,
          model_type: modelType,
          stem_id: stemId,
          stem_type: stemType,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Transcription failed');

      return data;
    },
    onSuccess: (data) => {
      toast.success('MIDI транскрипция завершена', {
        description: data.stem_type 
          ? `MIDI для ${data.stem_type} создан`
          : 'MIDI файл готов к скачиванию',
        action: {
          label: 'Скачать',
          onClick: () => downloadMidi(data.midi_url, data.stem_type || 'stem'),
        },
      });
      queryClient.invalidateQueries({ queryKey: ['stem-midi', trackId] });
      queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });
    },
    onError: (error: Error) => {
      log.error('Stem MIDI transcription error', { error: error.message });
      toast.error(`Ошибка транскрипции: ${error.message}`);
    },
  });

  const transcribeToMidi = useCallback(async (
    audioUrl: string,
    modelType: 'mt3' | 'basic-pitch' = 'mt3',
    stemType?: string
  ) => {
    setIsTranscribing(true);
    try {
      await transcribeMutation.mutateAsync({ audioUrl, modelType, stemType });
    } finally {
      setIsTranscribing(false);
    }
  }, [transcribeMutation]);

  const downloadMidi = useCallback((midiUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = midiUrl;
    link.download = `${filename.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.mid`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return {
    midiVersions,
    isLoading,
    isTranscribing,
    transcribeToMidi,
    downloadMidi,
    hasMidi: (midiVersions?.length || 0) > 0,
    latestMidi: midiVersions?.[0],
  };
}
