/**
 * useSunoMashup — mutation hook for blending two existing tracks into a
 * mashup via the suno-mashup edge function (Sprint 052-B1).
 *
 * Used by MashupDialog to start a mashup generation. The result lands
 * asynchronously via suno-music-callback; this hook only signals that the
 * task was accepted by Suno and returns the new (trackId, taskId) pair.
 */

import { useMutation } from "@tanstack/react-query";
import { sunoMashup, type SunoMashupParams, type SunoMashupResult } from "@/services/studio.service";

export type SunoMashupInput = SunoMashupParams;

export function useSunoMashup() {
  return useMutation<SunoMashupResult, Error, SunoMashupInput>({
    mutationFn: async (input) => {
      const { data, error } = await sunoMashup(input);
      if (error) throw error;
      if (!data) throw new Error("Mashup returned no data");
      return data;
    },
  });
}
