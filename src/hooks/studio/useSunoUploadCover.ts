/**
 * useSunoUploadCover - Mutation hook for creating an audio cover via suno-upload-cover edge function.
 *
 * Used by AudioCoverDialog to upload a reference audio and create a Suno cover track.
 */

import { useMutation } from "@tanstack/react-query";
import { sunoUploadCover, type SunoUploadParams } from "@/services/studio.service";

export type SunoUploadCoverInput = SunoUploadParams;

export function useSunoUploadCover() {
  return useMutation({
    mutationFn: (input: SunoUploadCoverInput) => sunoUploadCover(input),
  });
}
