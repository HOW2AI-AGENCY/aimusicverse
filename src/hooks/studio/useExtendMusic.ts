/**
 * useExtendMusic - Mutation hook for extending a track via the suno-music-extend edge function.
 *
 * Used by ExtendTrackDialog. Differs from useExtendTrack (which uses the simpler suno-extend) by
 * accepting the full custom-parameter surface (style weight, audio weight, weirdness constraint,
 * vocal gender, project id, etc.).
 */

import { useMutation } from "@tanstack/react-query";
import { extendMusic, type ExtendMusicParams } from "@/services/studio.service";

export type ExtendMusicInput = ExtendMusicParams;

export function useExtendMusic() {
  return useMutation({
    mutationFn: (input: ExtendMusicInput) => extendMusic(input),
  });
}
