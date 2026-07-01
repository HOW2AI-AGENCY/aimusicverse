/**
 * useRemixTrack - Mutation hook for creating a remix via suno-remix edge function.
 *
 * Used by RemixDialog to invoke AI track remixing in a new style.
 */

import { useMutation } from "@tanstack/react-query";
import { remixTrack } from "@/services/studio.service";

interface RemixTrackInput {
  audioId: string;
  prompt: string;
  style: string;
  title: string;
  instrumental: boolean;
  model?: string;
}

export function useRemixTrack() {
  return useMutation({
    mutationFn: (input: RemixTrackInput) =>
      remixTrack({
        audioId: input.audioId,
        prompt: input.prompt,
        style: input.style,
        title: input.title,
        instrumental: input.instrumental,
        model: input.model,
      }),
  });
}
