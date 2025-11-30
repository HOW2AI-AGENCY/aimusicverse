import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AudioAnalysis {
  id: string;
  track_id: string;
  user_id: string;
  analysis_type: string;
  full_response: string;
  genre: string | null;
  mood: string | null;
  instruments: string[] | null;
  tempo: string | null;
  key_signature: string | null;
  structure: string | null;
  style_description: string | null;
  bpm: number | null;
  beats_data: any[] | null;
  arousal: number | null;
  valence: number | null;
  approachability: string | null;
  engagement: string | null;
  analysis_metadata: any | null;
  created_at: string;
  updated_at: string;
}

export function useAudioAnalysis(trackId: string | null) {
  return useQuery({
    queryKey: ['audio-analysis', trackId],
    queryFn: async () => {
      if (!trackId) return null;

      const { data, error } = await supabase
        .from('audio_analysis')
        .select('*')
        .eq('track_id', trackId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as AudioAnalysis | null;
    },
    enabled: !!trackId,
  });
}

export function useAnalyzeAudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      trackId, 
      audioUrl, 
      analysisType = 'auto',
      customPrompt 
    }: { 
      trackId: string; 
      audioUrl: string;
      analysisType?: string;
      customPrompt?: string;
    }) => {
      console.log('Starting audio analysis:', { trackId, audioUrl, analysisType });
      
      const { data, error } = await supabase.functions.invoke('analyze-audio-flamingo', {
        body: {
          track_id: trackId,
          audio_url: audioUrl,
          analysis_type: analysisType,
          custom_prompt: customPrompt,
        },
      });

      if (error) {
        console.error('Audio analysis error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      console.log('Audio analysis completed:', data);
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success('Анализ аудио завершен');
      queryClient.invalidateQueries({ queryKey: ['audio-analysis', variables.trackId] });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
    onError: (error: Error) => {
      console.error('Error analyzing audio:', error);
      toast.error(`Ошибка анализа: ${error.message}`);
    },
  });
}
