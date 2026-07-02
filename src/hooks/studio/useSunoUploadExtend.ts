/**
 * useSunoUploadExtend - Mutation hook for extending a track from uploaded audio via suno-upload-extend edge function.
 *
 * Used by AudioExtendDialog to upload an audio file and extend it from a given timestamp.
 */

import { useMutation } from "@tanstack/react-query";
import { sunoUploadExtend, type SunoUploadExtendParams } from "@/services/studio.service";

export type SunoUploadExtendInput = SunoUploadExtendParams;

export function useSunoUploadExtend() {
  return useMutation({
    mutationFn: (input: SunoUploadExtendInput) => sunoUploadExtend(input),
  });
}
