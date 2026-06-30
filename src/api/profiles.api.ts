/**
 * Profiles API Layer
 * Raw Supabase database operations for user profiles
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

/**
 * Fetch a public profile by user ID
 */
export async function fetchPublicProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update a user's profile fields
 */
export async function updateUserProfile(userId: string, updates: ProfileUpdate): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Count profiles matching an optional filter
 */
export async function fetchProfileCount(filter?: { isPublic?: boolean; subscriptionTier?: string }): Promise<number> {
  let query = supabase.from("profiles").select("user_id", { count: "exact", head: true });
  if (filter?.isPublic !== undefined) query = query.eq("is_public", filter.isPublic);
  if (filter?.subscriptionTier) query = query.eq("subscription_tier", filter.subscriptionTier);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}
