/**
 * useReplicateMidiTranscription - Mutation hook for invoking the Replicate
 * Basic Pitch MIDI transcription edge function. Wraps studio.service.invokeReplicateMidiTranscription.
 */

import { useMutation } from "@tanstack/react-query";
import { invokeReplicateMidiTranscription } from "@/services/studio.service";

export interface ReplicateMidiInput {
  audioUrl: string;
  trackId?: string;
  stemId?: string | null;
  model?: string;
}

export function useReplicateMidiTranscription() {
  return useMutation({
    mutationFn: (input: ReplicateMidiInput) =>
      invokeReplicateMidiTranscription({ ...input, stemId: input.stemId ?? undefined }),
  });
}
