/**
 * useAudioActionAnalysis
 *
 * Hook wrapper for the audio analysis + lyrics transcription flows used by
 * the AudioActionDialog. Replaces direct `supabase.functions.invoke(...)`
 * calls in the component.
 */

import { useMutation } from "@tanstack/react-query";
import {
  analyzeAudioAction,
  transcribeAudioLyrics,
  type AudioAnalysisResult,
  type LyricsExtractionResult,
} from "@/services/audio-reference/audio-analysis.service";

interface AnalyzeAudioInput {
  publicUrl: string;
  analysisType?: string;
}

interface TranscribeLyricsInput {
  publicUrl: string;
}

export function useAudioActionAnalysis() {
  const analyzeMutation = useMutation({
    mutationFn: async (input: AnalyzeAudioInput): Promise<AudioAnalysisResult> => {
      const { data, error } = await analyzeAudioAction(input);
      if (error) throw new Error(error.message || "Network error");
      if (data?.error) throw new Error(data.error);
      if (data?.success && data.parsed) {
        return {
          style: data.parsed.style_description,
          genre: data.parsed.genre,
          mood: data.parsed.mood,
        };
      }
      throw new Error("Не удалось проанализировать аудио");
    },
  });

  const transcribeMutation = useMutation({
    mutationFn: async (input: TranscribeLyricsInput): Promise<LyricsExtractionResult> => {
      const { data, error } = await transcribeAudioLyrics(input);
      if (error) throw new Error(error.message || "Network error");
      if (data?.error) throw new Error(data.error);
      return {
        hasVocals: data?.has_vocals ?? false,
        lyrics: data?.lyrics,
      };
    },
  });

  return {
    analyzeAudio: analyzeMutation.mutateAsync,
    isAnalyzing: analyzeMutation.isPending,
    transcribeLyrics: transcribeMutation.mutateAsync,
    isTranscribing: transcribeMutation.isPending,
  };
}
