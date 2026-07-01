/**
 * useKlangioAnalyze - Mutation hook for invoking the Klangio transcription edge function.
 * Wraps studio.service.invokeKlangioAnalyze.
 */

import { useMutation } from "@tanstack/react-query";
import { invokeKlangioAnalyze } from "@/services/studio.service";

export interface KlangioAnalyzeInput {
  audio_url: string;
  mode?: string;
  model?: string;
  outputs?: string[];
  title?: string;
  stem_type?: string;
  user_id?: string;
}

export function useKlangioAnalyze() {
  return useMutation({
    mutationFn: (input: KlangioAnalyzeInput) => invokeKlangioAnalyze(input),
  });
}