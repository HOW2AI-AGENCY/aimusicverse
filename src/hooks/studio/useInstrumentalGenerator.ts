/**
 * useInstrumentalGenerator - Hooks for the InstrumentalGeneratorPanel.
 *
 * - `useTrackContextAnalysis` queries the analyze-track-context edge function.
 * - `useGenerateInstrumental` mutates musicgen-generate with caller-provided inputs.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  analyzeTrackContext,
  generateInstrumental,
  type InstrumentalGenerationResult,
  type TrackContextAnalysis,
} from "@/services/studio.service";
import { queryKeys } from "@/lib/queryKeys";

export function useTrackContextAnalysis(audioUrl: string, trackId?: string) {
  return useQuery<TrackContextAnalysis>({
    queryKey: queryKeys.tracks.context(trackId ?? audioUrl),
    queryFn: () => analyzeTrackContext(audioUrl, trackId),
    enabled: Boolean(audioUrl),
    staleTime: 30_000,
  });
}

export interface GenerateInstrumentalInput {
  prompt: string;
  duration: number;
}

export function useGenerateInstrumental() {
  return useMutation<InstrumentalGenerationResult, Error, GenerateInstrumentalInput>({
    mutationFn: (input) => generateInstrumental(input),
  });
}
