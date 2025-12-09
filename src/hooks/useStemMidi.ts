import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'StemMidi' });

export type MidiModelType = 'mt3' | 'basic-pitch' | 'pop2piano';

interface StemMidiVersion {
  id: string;
  audio_url: string;
  created_at: string;
  version_label: string | null;
  metadata: {
    model_type?: string;
    model_name?: string;
    stem_id?: string;
    stem_type?: string;
    transcribed_at?: string;
    output_type?: 'midi' | 'audio';
    auto_selected?: boolean;
  } | null;
}

export const MIDI_MODELS = {
  'mt3': {
    name: 'MT3 (Multi-Task)',
    description: 'Высокая точность для барабанов и сложных партий',
    icon: '🎹',
    bestFor: ['drums', 'percussion', 'complex'],
  },
  'basic-pitch': {
    name: 'Basic Pitch (Spotify)',
    description: 'Быстрый и точный для мелодических инструментов',
    icon: '⚡',
    bestFor: ['vocals', 'guitar', 'bass', 'melody'],
  },
  'pop2piano': {
    name: 'Pop2Piano',
    description: 'Создаёт фортепианную аранжировку из любого аудио',
    icon: '🎹',
    bestFor: ['arrangement', 'piano cover'],
    outputType: 'audio',
  },
} as const;

export function useStemMidi(trackId: string, stemId?: string) {
  const queryClient = useQueryClient();
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Fetch existing MIDI/piano versions for stem
  const { data: midiVersions, isLoading } = useQuery({
    queryKey: ['stem-midi', trackId, stemId],
    queryFn: async () => {
      const versionTypes = ['midi_transcription', 'stem_midi_transcription', 'piano_arrangement'];
      
      let query = supabase
        .from('track_versions')
        .select('id, audio_url, created_at, version_label, metadata')
        .eq('track_id', trackId)
        .in('version_type', versionTypes)
        .order('created_at', { ascending: false });

      // Filter by stem_id in metadata if provided
      if (stemId) {
        query = query.filter('metadata->>stem_id', 'eq', stemId);
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
      modelType,
      stemType,
      autoSelect = true,
      pop2pianoComposer = 'composer1',
    }: {
      audioUrl: string;
      modelType?: MidiModelType;
      stemType?: string;
      autoSelect?: boolean;
      pop2pianoComposer?: string;
    }) => {
      log.info('Starting MIDI transcription', { trackId, stemId, modelType, stemType, autoSelect });

      const { data, error } = await supabase.functions.invoke('transcribe-midi', {
        body: {
          track_id: trackId,
          audio_url: audioUrl,
          model_type: modelType,
          stem_id: stemId,
          stem_type: stemType,
          auto_select: autoSelect,
          pop2piano_composer: pop2pianoComposer,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Transcription failed');

      return data;
    },
    onSuccess: (data) => {
      const isPianoArrangement = data.model_used === 'pop2piano';
      
      toast.success(
        isPianoArrangement ? 'Фортепианная аранжировка готова' : 'MIDI транскрипция завершена', 
        {
          description: data.auto_selected 
            ? `Автоматически выбрана модель: ${data.model_name}`
            : `Модель: ${data.model_name}`,
          action: {
            label: 'Скачать',
            onClick: () => downloadFile(
              data.output_url, 
              data.stem_type || 'track',
              data.output_type
            ),
          },
        }
      );
      queryClient.invalidateQueries({ queryKey: ['stem-midi', trackId] });
      queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });
    },
    onError: (error: Error) => {
      log.error('MIDI transcription error', { error: error.message });
      toast.error(`Ошибка транскрипции: ${error.message}`);
    },
  });

  const transcribeToMidi = useCallback(async (
    audioUrl: string,
    modelType?: MidiModelType,
    stemType?: string,
    options?: { autoSelect?: boolean; pop2pianoComposer?: string }
  ) => {
    setIsTranscribing(true);
    try {
      await transcribeMutation.mutateAsync({ 
        audioUrl, 
        modelType, 
        stemType,
        autoSelect: options?.autoSelect ?? true,
        pop2pianoComposer: options?.pop2pianoComposer,
      });
    } finally {
      setIsTranscribing(false);
    }
  }, [transcribeMutation]);

  const downloadFile = useCallback((url: string, filename: string, outputType?: string) => {
    const link = document.createElement('a');
    link.href = url;
    const ext = outputType === 'audio' ? 'mp3' : 'mid';
    link.download = `${filename.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Backward compatibility
  const downloadMidi = useCallback((midiUrl: string, filename: string) => {
    downloadFile(midiUrl, filename, 'midi');
  }, [downloadFile]);

  // Separate MIDI and piano arrangement versions
  const midiOnly = midiVersions?.filter(v => v.metadata?.output_type !== 'audio') || [];
  const pianoArrangements = midiVersions?.filter(v => 
    v.metadata?.model_type === 'pop2piano' || v.metadata?.output_type === 'audio'
  ) || [];

  return {
    midiVersions,
    midiOnly,
    pianoArrangements,
    isLoading,
    isTranscribing,
    transcribeToMidi,
    downloadMidi,
    downloadFile,
    hasMidi: (midiOnly?.length || 0) > 0,
    hasPianoArrangement: (pianoArrangements?.length || 0) > 0,
    latestMidi: midiOnly?.[0],
    latestPianoArrangement: pianoArrangements?.[0],
  };
}
