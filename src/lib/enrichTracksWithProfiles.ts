/**
 * Shared creator-profile enrichment for public track queries.
 *
 * Consolidates logic that was previously duplicated across
 * usePublicContentBatch, useInfinitePublicTracks, and useInfiniteGenreTracks.
 *
 * @module lib/enrichTracksWithProfiles
 */

import { supabase } from "@/integrations/supabase/client";
import type { PublicTrackWithCreator } from "@/hooks/public-content/types";

interface ProfileLite {
  user_id: string;
  username: string | null;
  photo_url: string | null;
  first_name: string | null;
}

type CreatorFields = Pick<
  PublicTrackWithCreator,
  "creator_name" | "creator_username" | "creator_photo_url" | "like_count" | "user_liked"
>;

/** Fetches profiles for the given user ids and returns a lookup map. */
export async function fetchProfilesMap(userIds: string[]): Promise<Map<string, ProfileLite>> {
  const uniqueIds = [...new Set(userIds)];
  if (!uniqueIds.length) return new Map();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, photo_url, first_name")
    .in("user_id", uniqueIds);

  return new Map(profiles?.map((p) => [p.user_id, p]) || []);
}

/** Enriches a single track with creator info from an already-fetched profile map. */
export function enrichTrackWithProfile<T extends { user_id: string }>(
  track: T,
  profileMap: Map<string, ProfileLite>,
): T & CreatorFields {
  const profile = profileMap.get(track.user_id);
  return {
    ...track,
    creator_name: profile?.first_name || profile?.username || undefined,
    creator_username: profile?.username || undefined,
    creator_photo_url: profile?.photo_url || undefined,
    like_count: 0,
    user_liked: false,
  };
}

/** Fetches creator profiles and enriches a list of tracks in one call. */
export async function enrichTracksWithProfiles<T extends { user_id: string }>(
  tracks: T[],
): Promise<(T & CreatorFields)[]> {
  if (!tracks.length) return [];
  const profileMap = await fetchProfilesMap(tracks.map((t) => t.user_id));
  return tracks.map((t) => enrichTrackWithProfile(t, profileMap));
}
