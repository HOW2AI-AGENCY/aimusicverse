/**
 * useGenerateSfx - Mutation hook for generating a sound effect via generate-sfx.
 *
 * Used by SFXGeneratorPanel to invoke Replicate/fal.ai SFX generation.
 */

import { useMutation } from "@tanstack/react-query";
import { generateSfx } from "@/services/studio.service";

export function useGenerateSfx() {
  return useMutation<string, Error, { prompt: string; duration: number }>({
    mutationFn: (input) => generateSfx(input),
  });
}
