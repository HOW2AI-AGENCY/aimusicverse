/**
 * Artists API Layer
 * Raw Supabase database operations for AI artists
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ArtistRow = Database['public']['Tables']['artists']['Row'];
export type ArtistInsert = Database['public']['Tables']['artists']['Insert'];
export type ArtistUpdate = Database['public']['Tables']['artists']['Update'];

/**
 * Fetch all artists for a user
 */
export async function fetchUserArtists(userId: string): Promise<ArtistRow[]> {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Fetch public artists
 */
export async function fetchPublicArtists(limit?: number): Promise<ArtistRow[]> {
  let query = supabase
    .from('artists')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

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
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('id', artistId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Create a new artist
 */
export async function createArtist(artist: ArtistInsert): Promise<ArtistRow> {
  const { data, error } = await supabase
    .from('artists')
    .insert(artist)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update artist
 */
export async function updateArtist(artistId: string, updates: ArtistUpdate): Promise<ArtistRow> {
  const { data, error } = await supabase
    .from('artists')
    .update(updates)
    .eq('id', artistId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete artist
 */
export async function deleteArtist(artistId: string): Promise<void> {
  const { error } = await supabase
    .from('artists')
    .delete()
    .eq('id', artistId);

  if (error) throw new Error(error.message);
}

/**
 * Generate artist portrait
 */
export async function generateArtistPortrait(
  artistName: string,
  styleDescription?: string
): Promise<{ imageUrl: string }> {
  const { data, error } = await supabase.functions.invoke('generate-artist-portrait', {
    body: { artistName, styleDescription },
  });

  if (error) throw new Error(error.message);
  return data;
}
