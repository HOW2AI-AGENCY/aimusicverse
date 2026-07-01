/**
 * useExtendTrack - Mutation hook for extending a track via suno-extend edge function.
 *
 * Used by ExtendDialog to invoke AI track continuation or intro insertion.
 */

import { useMutation } from "@tanstack/react-query";
import { extendTrack } from "@/services/studio.service";

interface ExtendTrackInput {
  audioId: string;
  prompt: string;
  continueAt: number;
  model?: string;
}

export function useExtendTrack() {
  return useMutation({
    mutationFn: (input: ExtendTrackInput) =>
      extendTrack({
        audioId: input.audioId,
        prompt: input.prompt,
        continueAt: input.continueAt,
        model: input.model,
      }),
  });
}
