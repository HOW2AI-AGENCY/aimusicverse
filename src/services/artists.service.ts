/**
 * Artists Service
 * Business logic for AI artist operations
 */

import * as artistsApi from '@/api/artists.api';

export type { ArtistRow } from '@/api/artists.api';

/**
 * Create artist with optional portrait generation
 */
export async function createArtistWithPortrait(
  userId: string,
  name: string,
  options?: {
    bio?: string;
    styleDescription?: string;
    genreTags?: string[];
    moodTags?: string[];
    isPublic?: boolean;
    generatePortrait?: boolean;
  }
): Promise<artistsApi.ArtistRow> {
  let avatarUrl: string | null = null;
  
  // Generate portrait if requested
  if (options?.generatePortrait) {
    try {
      const { imageUrl } = await artistsApi.generateArtistPortrait(
        name,
        options.styleDescription
      );
      avatarUrl = imageUrl;
    } catch (error) {
      // Continue without portrait if generation fails
      console.warn('Portrait generation failed:', error);
    }
  }
  
  return artistsApi.createArtist({
    user_id: userId,
    name,
    bio: options?.bio || null,
    style_description: options?.styleDescription || null,
    genre_tags: options?.genreTags || null,
    mood_tags: options?.moodTags || null,
    is_public: options?.isPublic ?? true,
    is_ai_generated: true,
    avatar_url: avatarUrl,
  });
}

/**
 * Update artist portrait
 */
export async function updateArtistPortrait(
  artistId: string,
  artistName: string,
  styleDescription?: string
): Promise<artistsApi.ArtistRow> {
  const { imageUrl } = await artistsApi.generateArtistPortrait(artistName, styleDescription);
  return artistsApi.updateArtist(artistId, { avatar_url: imageUrl });
}

/**
 * Get artist statistics
 */
export async function getArtistStats(artistId: string): Promise<{
  trackCount: number;
  totalPlays: number;
  totalLikes: number;
}> {
  // This would need additional API calls to tracks table
  // For now, return placeholder
  return {
    trackCount: 0,
    totalPlays: 0,
    totalLikes: 0,
  };
}

/**
 * Search artists by name or style
 */
export async function searchArtists(
  query: string,
  options?: { publicOnly?: boolean; limit?: number }
): Promise<artistsApi.ArtistRow[]> {
  if (options?.publicOnly) {
    const artists = await artistsApi.fetchPublicArtists(options.limit);
    return artists.filter(a => 
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.style_description?.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  // For user's own artists, we'd need to add a search API
  return [];
}
