import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ReferenceAudio {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  duration_seconds: number | null;
  source: string;
  has_vocals: boolean | null;
  detected_language: string | null;
  transcription: string | null;
  genre: string | null;
  mood: string | null;
  vocal_style: string | null;
  analysis_status: string | null;
  created_at: string;
}

export function useReferenceAudio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: audioList = [], isLoading } = useQuery({
    queryKey: ['reference-audio', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('reference_audio')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as ReferenceAudio[];
    },
    enabled: !!user,
  });

  const saveAudioMutation = useMutation({
    mutationFn: async (params: {
      fileName: string;
      fileUrl: string;
      fileSize?: number;
      mimeType?: string;
      durationSeconds?: number;
      source: string;
      hasVocals?: boolean;
      detectedLanguage?: string;
      transcription?: string;
      genre?: string;
      mood?: string;
      vocalStyle?: string;
      analysisStatus?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reference_audio')
        .insert({
          user_id: user.id,
          file_name: params.fileName,
          file_url: params.fileUrl,
          file_size: params.fileSize,
          mime_type: params.mimeType,
          duration_seconds: params.durationSeconds,
          source: params.source,
          has_vocals: params.hasVocals,
          detected_language: params.detectedLanguage,
          transcription: params.transcription,
          genre: params.genre,
          mood: params.mood,
          vocal_style: params.vocalStyle,
          analysis_status: params.analysisStatus ?? 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data as ReferenceAudio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-audio', user?.id] });
    },
  });

  const updateAnalysisMutation = useMutation({
    mutationFn: async (params: {
      id: string;
      hasVocals?: boolean;
      transcription?: string;
      genre?: string;
      mood?: string;
      vocalStyle?: string;
      analysisStatus?: string;
    }) => {
      const { error } = await supabase
        .from('reference_audio')
        .update({
          has_vocals: params.hasVocals,
          transcription: params.transcription,
          genre: params.genre,
          mood: params.mood,
          vocal_style: params.vocalStyle,
          analysis_status: params.analysisStatus,
          analyzed_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-audio', user?.id] });
    },
  });

  const deleteAudioMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reference_audio')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-audio', user?.id] });
    },
  });

  return {
    audioList,
    isLoading,
    saveAudio: saveAudioMutation.mutateAsync,
    updateAnalysis: updateAnalysisMutation.mutateAsync,
    deleteAudio: deleteAudioMutation.mutateAsync,
    isSaving: saveAudioMutation.isPending,
  };
}
