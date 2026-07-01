/**
 * useAddVocals - Mutation hook for adding vocals to a track via suno-add-vocals edge function.
 *
 * Used by AddVocalsDrawer to add AI-generated vocal layer to an instrumental track.
 */

import { useMutation } from "@tanstack/react-query";
import { addVocals } from "@/services/studio.service";

interface AddVocalsInput {
  trackId: string;
  audioUrl?: string | null;
  style?: string;
  title?: string;
  negativeTags?: string;
  audioWeight?: number;
  styleWeight?: number;
}

export function useAddVocals() {
  return useMutation({
    mutationFn: (input: AddVocalsInput) =>
      addVocals({
        trackId: input.trackId,
        audioUrl: input.audioUrl,
        style: input.style,
        title: input.title,
        negativeTags: input.negativeTags,
        audioWeight: input.audioWeight,
        styleWeight: input.styleWeight,
      }),
  });
}
