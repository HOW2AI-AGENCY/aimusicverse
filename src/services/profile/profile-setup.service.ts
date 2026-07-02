/**
 * Profile Setup Service
 *
 * Wraps the generate-profile-image edge function invocations used by
 * ImageGeneratorDialog during the profile-setup flow (C3 Batch C).
 */

import { supabase } from "@/integrations/supabase/client";

export type ProfileImageType = "avatar" | "cover" | "banner";

export interface GenerateProfileImageParams {
  type: ProfileImageType;
  prompt: string;
  displayName?: string;
  bio?: string;
  genres?: string[];
}

export interface GenerateProfileImageResponse {
  data: { imageUrl?: string } | null;
  error: { message: string } | null;
}

/**
 * Invoke the generate-profile-image edge function to create a profile
 * avatar / cover / banner image.
 */
export async function invokeGenerateProfileImage(
  params: GenerateProfileImageParams,
): Promise<GenerateProfileImageResponse> {
  return supabase.functions.invoke("generate-profile-image", {
    body: {
      type: params.type,
      prompt: params.prompt,
      displayName: params.displayName,
      bio: params.bio,
      genres: params.genres,
    },
  });
}
