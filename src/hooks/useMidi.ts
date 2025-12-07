import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MidiVersion {
  id: string;
  track_id: string;
  audio_url: string;
  version_type: string;
  metadata: {
    model_type?: string;
    original_audio_url?: string;
    transcribed_at?: string;
  } | null;
  created_at: string;
}

interface TranscribeMidiParams {
  trackId: string;
  audioUrl: string;
  modelType?: 'mt3' | 'basic-pitch';
}

export const useMidi = (trackId: string) => {
  const queryClient = useQueryClient();
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Fetch existing MIDI versions for this track
  const { data: midiVersions, isLoading } = useQuery({
    queryKey: ['midi-versions', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_versions')
        .select('*')
        .eq('track_id', trackId)
        .eq('version_type', 'midi_transcription')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MidiVersion[];
    },
    enabled: !!trackId,
  });

  // Transcribe track to MIDI
  const transcribeMutation = useMutation({
    mutationFn: async ({ trackId, audioUrl, modelType = 'mt3' }: TranscribeMidiParams) => {
      setIsTranscribing(true);
      
      const { data, error } = await supabase.functions.invoke('transcribe-midi', {
        body: { 
          track_id: trackId, 
          audio_url: audioUrl,
          model_type: modelType,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Transcription failed');
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['midi-versions', trackId] });
      toast.success('MIDI файл создан успешно');
    },
    onError: (error) => {
      console.error('MIDI transcription error:', error);
      toast.error('Ошибка создания MIDI');
    },
    onSettled: () => {
      setIsTranscribing(false);
    },
  });

  const transcribeToMidi = useCallback((audioUrl: string, modelType?: 'mt3' | 'basic-pitch') => {
    return transcribeMutation.mutateAsync({ trackId, audioUrl, modelType });
  }, [trackId, transcribeMutation]);

  const downloadMidi = useCallback((midiUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = midiUrl;
    link.download = `${filename}.mid`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return {
    midiVersions,
    isLoading,
    isTranscribing: isTranscribing || transcribeMutation.isPending,
    transcribeToMidi,
    downloadMidi,
    hasMidi: (midiVersions?.length ?? 0) > 0,
    latestMidi: midiVersions?.[0] || null,
  };
};
