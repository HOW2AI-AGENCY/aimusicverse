/**
 * useReferenceAudioAnalysis
 *
 * Mutation hook for analyzing an uploaded reference audio file. Replaces
 * direct `supabase.functions.invoke('analyze-reference-audio')` calls in
 * AudioReferenceRecorder.
 */

import { useMutation } from "@tanstack/react-query";
import {
  analyzeReferenceAudio,
  type AnalyzeReferenceParams,
} from "@/services/audio-reference/reference-analysis.service";
import type { ReferenceAnalysis } from "@/hooks/useSectionNotes";

export function useReferenceAudioAnalysis() {
  const mutation = useMutation<ReferenceAnalysis | null, Error, AnalyzeReferenceParams>({
    mutationFn: (params) => analyzeReferenceAudio(params),
  });

  return {
    analyze: mutation.mutateAsync,
    isAnalyzing: mutation.isPending,
  };
}
