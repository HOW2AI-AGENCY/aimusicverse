/**
 * useAddInstrumental - Mutation hook for adding instrumental layer to a track via suno-add-instrumental edge function.
 *
 * Used by AddInstrumentalDrawer and StudioArrangementDialog to add AI-generated
 * instrumental accompaniment or create a new arrangement.
 */

import { useMutation } from "@tanstack/react-query";
import { addInstrumental } from "@/services/studio.service";

export interface AddInstrumentalInput {
  trackId?: string;
  audioUrl?: string | null;
  style: string;
  title?: string;
  negativeTags?: string;
  audioWeight?: number;
  styleWeight?: number;
  weirdnessConstraint?: number;
  model?: string;
  /** Extra fields forwarded to the edge function (e.g. customMode, projectId, openInStudio, originalTrackId). */
  extras?: Record<string, unknown>;
}

export function useAddInstrumental() {
  return useMutation({
    mutationFn: (input: AddInstrumentalInput) => {
      const { extras, ...rest } = input;
      return addInstrumental({
        ...rest,
        ...(extras ?? {}),
      }) as ReturnType<typeof addInstrumental>;
    },
  });
}
