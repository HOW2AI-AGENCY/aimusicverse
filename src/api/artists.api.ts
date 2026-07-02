/**
 * Artists API Layer
 * Raw Supabase database operations for AI artists
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ArtistRow = Database["public"]["Tables"]["artists"]["Row"];
export type ArtistInsert = Database["public"]["Tables"]["artists"]["Insert"];
export type ArtistUpdate = Database["public"]["Tables"]["artists"]["Update"];

/**
 * Fetch all artists for a user
 */
export async function fetchUserArtists(userId: string): Promise<ArtistRow[]> {
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Fetch public artists
 */
export async function fetchPublicArtists(limit?: number): Promise<ArtistRow[]> {
  let query = supabase.from("artists").select("*").eq("is_public", true).order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Fetch single artist by ID
 */
export async function fetchArtistById(artistId: string): Promise<ArtistRow | null> {
  const { data, error } = await supabase.from("artists").select("*").eq("id", artistId).maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Fetch a minimal artist summary (id, name, avatar_url, genre_tags).
 */
export async function fetchArtistSummary(
  artistId: string,
): Promise<{ id: string; name: string; avatar_url: string | null; genre_tags: string[] | null } | null> {
  const { data, error } = await supabase
    .from("artists")
    .select("id, name, avatar_url, genre_tags")
    .eq("id", artistId)
    .maybeSingle();

  if (error) return null;
  return data ?? null;
}

/**
 * Create a new artist
 */
export async function createArtist(artist: ArtistInsert): Promise<ArtistRow> {
  const { data, error } = await supabase.from("artists").insert(artist).select().single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update artist
 */
export async function updateArtist(artistId: string, updates: ArtistUpdate): Promise<ArtistRow> {
  const { data, error } = await supabase.from("artists").update(updates).eq("id", artistId).select().single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete artist
 */
export async function deleteArtist(artistId: string): Promise<void> {
  const { error } = await supabase.from("artists").delete().eq("id", artistId);

  if (error) throw new Error(error.message);
}

/**
 * Count the number of AI artists owned by the user.
 */
export async function countUserArtists(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("artists")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * Generate artist portrait
 */
export async function generateArtistPortrait(
  artistName: string,
  styleDescription?: string,
  referenceImageUrl?: string,
): Promise<{ imageUrl: string }> {
  const { data, error } = await supabase.functions.invoke("generate-artist-portrait", {
    body: { artistName, styleDescription, referenceImageUrl },
  });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Aggregate stats for an artist's published tracks (count, total plays, likes).
 */
export async function fetchArtistTrackStats(
  artistId: string,
  trackIds?: string[],
): Promise<{ tracks: number; totalPlays: number; totalLikes: number }> {
  const [tracksResult, likesResult] = await Promise.all([
    supabase.from("tracks").select("id, play_count", { count: "exact" }).eq("artist_id", artistId),
    supabase
      .from("track_likes")
      .select("id", { count: "exact", head: true })
      .in("track_id", trackIds && trackIds.length > 0 ? trackIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const totalPlays = tracksResult.data?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;

  return {
    tracks: tracksResult.count || 0,
    totalPlays,
    totalLikes: likesResult.count || 0,
  };
}
