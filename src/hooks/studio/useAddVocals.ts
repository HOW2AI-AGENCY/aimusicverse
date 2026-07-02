/**
 * useAddVocals - Mutation hook for adding vocals to a track via suno-add-vocals edge function.
 *
 * Used by AddVocalsDrawer to add AI-generated vocal layer to an instrumental track.
 */

import { useMutation } from "@tanstack/react-query";
import { addVocals } from "@/services/studio.service";

export interface AddVocalsInput {
  trackId: string;
  audioUrl?: string | null;
  style?: string;
  title?: string;
  negativeTags?: string;
  audioWeight?: number;
  styleWeight?: number;
  weirdnessConstraint?: number;
  model?: string;
  prompt?: string;
  customMode?: boolean;
  projectId?: string | null;
  vocalGender?: string;
  /** Extra fields forwarded to the edge function. */
  extras?: Record<string, unknown>;
}

export function useAddVocals() {
  return useMutation({
    mutationFn: (input: AddVocalsInput) => {
      const { extras, ...rest } = input;
      return addVocals({
        ...rest,
        ...(extras ?? {}),
      }) as ReturnType<typeof addVocals>;
    },
  });
}
