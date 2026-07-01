/**
 * useAddInstrumental - Mutation hook for adding instrumental layer to a track via suno-add-instrumental edge function.
 *
 * Used by AddInstrumentalDrawer and StudioArrangementDialog to add AI-generated
 * instrumental accompaniment or create a new arrangement.
 */

import { useMutation } from "@tanstack/react-query";
import { addInstrumental } from "@/services/studio.service";

interface AddInstrumentalInput {
  trackId?: string;
  audioUrl?: string | null;
  style: string;
  title?: string;
  negativeTags?: string;
  audioWeight?: number;
  styleWeight?: number;
  weirdnessConstraint?: number;
  model?: string;
}

export function useAddInstrumental() {
  return useMutation({
    mutationFn: (input: AddInstrumentalInput) =>
      addInstrumental({
        trackId: input.trackId,
        audioUrl: input.audioUrl,
        style: input.style,
        title: input.title,
        negativeTags: input.negativeTags,
        audioWeight: input.audioWeight,
        styleWeight: input.styleWeight,
        weirdnessConstraint: input.weirdnessConstraint,
        model: input.model,
      }),
  });
}
