/**
 * useRemixTrack - Mutation hook for creating a remix via suno-remix edge function.
 *
 * Used by RemixDialog to invoke AI track remixing in a new style.
 */

import { useMutation } from "@tanstack/react-query";
import { remixTrack } from "@/services/studio.service";

export interface RemixTrackInput {
  audioId: string;
  /** Audio URL of the active version (reference source). */
  audioUrl?: string | null;
  prompt: string;
  style: string;
  title: string;
  instrumental: boolean;
  model?: string;
  audioWeight?: number;
  negativeTags?: string;
  vocalGender?: string;
  styleWeight?: number;
  weirdnessConstraint?: number;
}

export function useRemixTrack() {
  return useMutation({
    mutationFn: (input: RemixTrackInput) => remixTrack(input),
  });
}
