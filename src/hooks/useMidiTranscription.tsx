import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'MidiTranscription' });

export function useMidiTranscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      trackId, 
      audioUrl,
      modelType = 'mt3'
    }: { 
      trackId: string; 
      audioUrl: string;
      modelType?: 'ismir2021' | 'mt3';
    }) => {
      log.info('Starting MIDI transcription', { trackId, modelType });
      
      const { data, error } = await supabase.functions.invoke('transcribe-midi', {
        body: {
          track_id: trackId,
          audio_url: audioUrl,
          model_type: modelType,
        },
      });

      if (error) {
        log.error('MIDI transcription error', { error });
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Transcription failed');
      }

      log.info('MIDI transcription completed', { trackId });
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success('MIDI транскрипция завершена', {
        description: 'MIDI файл создан и сохранен',
        action: data.midi_url ? {
          label: 'Скачать',
          onClick: () => window.open(data.midi_url, '_blank'),
        } : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['track-versions', variables.trackId] });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
    onError: (error: Error) => {
      log.error('Error transcribing to MIDI', { error: error.message });
      toast.error(`Ошибка транскрипции: ${error.message}`);
    },
  });
}
