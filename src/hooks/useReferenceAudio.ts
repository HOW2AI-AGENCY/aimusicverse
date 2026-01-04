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
  telegram_file_id: string | null;
  has_vocals: boolean | null;
  has_instrumentals: boolean | null;
  detected_language: string | null;
  transcription: string | null;
  genre: string | null;
  mood: string | null;
  vocal_style: string | null;
  bpm: number | null;
  tempo: string | null;
  energy: string | null;
  instruments: string[] | null;
  style_description: string | null;
  vocal_stem_url: string | null;
  instrumental_stem_url: string | null;
  drums_stem_url: string | null;
  bass_stem_url: string | null;
  other_stem_url: string | null;
  stems_status: string | null;
  analysis_status: string | null;
  processing_time_ms: number | null;
  analysis_metadata: Record<string, unknown> | null;
  created_at: string;
  analyzed_at: string | null;
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
        .limit(200);

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
      telegramFileId?: string;
      hasVocals?: boolean;
      hasInstrumentals?: boolean;
      detectedLanguage?: string;
      transcription?: string;
      genre?: string;
      mood?: string;
      vocalStyle?: string;
      bpm?: number;
      tempo?: string;
      energy?: string;
      instruments?: string[];
      styleDescription?: string;
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
          telegram_file_id: params.telegramFileId,
          has_vocals: params.hasVocals,
          has_instrumentals: params.hasInstrumentals,
          detected_language: params.detectedLanguage,
          transcription: params.transcription,
          genre: params.genre,
          mood: params.mood,
          vocal_style: params.vocalStyle,
          bpm: params.bpm,
          tempo: params.tempo,
          energy: params.energy,
          instruments: params.instruments,
          style_description: params.styleDescription,
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
      hasInstrumentals?: boolean;
      transcription?: string;
      genre?: string;
      mood?: string;
      vocalStyle?: string;
      bpm?: number;
      tempo?: string;
      energy?: string;
      instruments?: string[];
      styleDescription?: string;
      vocalStemUrl?: string;
      instrumentalStemUrl?: string;
      drumsStemUrl?: string;
      bassStemUrl?: string;
      otherStemUrl?: string;
      stemsStatus?: string;
      analysisStatus?: string;
      processingTimeMs?: number;
      analysisMetadata?: Record<string, unknown>;
    }) => {
      const updateData: Record<string, unknown> = {
        analyzed_at: new Date().toISOString(),
      };

      if (params.hasVocals !== undefined) updateData.has_vocals = params.hasVocals;
      if (params.hasInstrumentals !== undefined) updateData.has_instrumentals = params.hasInstrumentals;
      if (params.transcription !== undefined) updateData.transcription = params.transcription;
      if (params.genre !== undefined) updateData.genre = params.genre;
      if (params.mood !== undefined) updateData.mood = params.mood;
      if (params.vocalStyle !== undefined) updateData.vocal_style = params.vocalStyle;
      if (params.bpm !== undefined) updateData.bpm = params.bpm;
      if (params.tempo !== undefined) updateData.tempo = params.tempo;
      if (params.energy !== undefined) updateData.energy = params.energy;
      if (params.instruments !== undefined) updateData.instruments = params.instruments;
      if (params.styleDescription !== undefined) updateData.style_description = params.styleDescription;
      if (params.vocalStemUrl !== undefined) updateData.vocal_stem_url = params.vocalStemUrl;
      if (params.instrumentalStemUrl !== undefined) updateData.instrumental_stem_url = params.instrumentalStemUrl;
      if (params.drumsStemUrl !== undefined) updateData.drums_stem_url = params.drumsStemUrl;
      if (params.bassStemUrl !== undefined) updateData.bass_stem_url = params.bassStemUrl;
      if (params.otherStemUrl !== undefined) updateData.other_stem_url = params.otherStemUrl;
      if (params.stemsStatus !== undefined) updateData.stems_status = params.stemsStatus;
      if (params.analysisStatus !== undefined) updateData.analysis_status = params.analysisStatus;
      if (params.processingTimeMs !== undefined) updateData.processing_time_ms = params.processingTimeMs;
      if (params.analysisMetadata !== undefined) updateData.analysis_metadata = params.analysisMetadata;

      const { error } = await supabase
        .from('reference_audio')
        .update(updateData)
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

  // Trigger full processing pipeline for an audio file
  const processAudioMutation = useMutation({
    mutationFn: async (params: {
      audioUrl: string;
      fileName?: string;
      fileSize?: number;
      durationSeconds?: number;
      source?: string;
      telegramFileId?: string;
      skipStems?: boolean;
      skipLyrics?: boolean;
      forceReprocess?: boolean;
      referenceId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('process-audio-pipeline', {
        body: {
          audio_url: params.audioUrl,
          user_id: user.id,
          file_name: params.fileName,
          file_size: params.fileSize,
          duration_seconds: params.durationSeconds,
          source: params.source ?? 'web',
          telegram_file_id: params.telegramFileId,
          skip_stems: params.skipStems,
          skip_lyrics: params.skipLyrics,
          force_reprocess: params.forceReprocess,
          reference_id: params.referenceId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-audio', user?.id] });
    },
  });

  // Get analyzed audio ready for reference use
  const analyzedAudio = audioList.filter(a => a.analysis_status === 'completed');
  
  // Get audio with available stems
  const audioWithStems = audioList.filter(a => a.stems_status === 'completed');

  return {
    audioList,
    analyzedAudio,
    audioWithStems,
    isLoading,
    saveAudio: saveAudioMutation.mutateAsync,
    updateAnalysis: updateAnalysisMutation.mutateAsync,
    deleteAudio: deleteAudioMutation.mutateAsync,
    processAudio: processAudioMutation.mutateAsync,
    isSaving: saveAudioMutation.isPending,
    isProcessing: processAudioMutation.isPending,
  };
}
