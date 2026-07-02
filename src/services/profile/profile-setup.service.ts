/**
 * Profile Setup Service
 *
 * Wraps the generate-profile-image edge function invocations used by
 * ImageGeneratorDialog during the profile-setup flow, and the profile
 * upsert used by EnhancedProfileSetup (C3 Batch C).
 */

import { supabase } from "@/integrations/supabase/client";
import { updateUserProfile, type ProfileRow, type ProfileUpdate } from "@/api/profiles.api";

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

// ==========================================
// EnhancedProfileSetup
// ==========================================

export interface CompleteProfileSetupParams {
  userId: string;
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  socialLinks: Record<string, string>;
}

/**
 * Persist the profile-setup form fields via the profiles api.
 * Returns the updated profile row.
 */
export async function completeProfileSetup(params: CompleteProfileSetupParams): Promise<ProfileRow> {
  const nameParts = params.displayName.trim().split(/\s+/);
  const firstName = nameParts[0] || params.displayName;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

  // Filter out empty social links
  const filteredSocialLinks = Object.fromEntries(
    Object.entries(params.socialLinks).filter(([_, value]) => value && value.trim()),
  );

  const updates: ProfileUpdate = {
    first_name: firstName,
    last_name: lastName,
    display_name: params.displayName.trim(),
    username: params.username.trim() || null,
    photo_url: params.avatarUrl || null,
    bio: params.bio.trim() || null,
    social_links: filteredSocialLinks,
    banner_url: params.bannerUrl || null,
    is_public: true,
    updated_at: new Date().toISOString(),
  };

  return updateUserProfile(params.userId, updates);
}
