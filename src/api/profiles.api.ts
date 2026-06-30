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
 * Fetch full profile (single) — used by onboarding flow to detect whether
 * the user has completed initial setup (is_public !== null).
 */
export async function fetchProfileByUserId(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Fetch only the subscription tier — cheaper than full profile.
 */
export async function fetchUserSubscriptionTier(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.subscription_tier ?? null;
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
  if (filter?.subscriptionTier) {
    query = query.eq("subscription_tier", filter.subscriptionTier as "free" | "premium" | "enterprise");
  }
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * Count profiles created within a date range.
 */
export async function fetchProfileCountInRange(params: {
  startDate: Date;
  endDate?: Date;
}): Promise<number> {
  let query = supabase
    .from("profiles")
    .select("user_id", { count: "exact", head: true })
    .gte("created_at", params.startDate.toISOString());
  if (params.endDate) {
    query = query.lt("created_at", params.endDate.toISOString());
  }
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}
