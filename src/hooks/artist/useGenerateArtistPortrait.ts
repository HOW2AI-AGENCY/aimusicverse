/**
 * useGenerateArtistPortrait - Mutation hook for generating an AI artist portrait via the
 * generate-artist-portrait edge function. Used by CreateArtistDialog to preview a portrait
 * before persisting a new artist row.
 */

import { useMutation } from "@tanstack/react-query";
import { generateArtistPortraitForPreview } from "@/services/artists.service";

export interface GenerateArtistPortraitInput {
  artistName: string;
  styleDescription?: string;
  referenceImageUrl?: string;
}

export function useGenerateArtistPortrait() {
  return useMutation({
    mutationFn: (input: GenerateArtistPortraitInput) =>
      generateArtistPortraitForPreview(input.artistName, input.styleDescription, input.referenceImageUrl),
  });
}
