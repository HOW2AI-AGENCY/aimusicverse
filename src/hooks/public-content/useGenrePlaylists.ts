/**
 * Genre Playlists Utility
 *
 * Generates auto-playlists from public tracks based on genre/style matching.
 *
 * @module hooks/public-content/useGenrePlaylists
 */

import type { PublicTrackWithCreator, GenrePlaylist } from './types';
import { GENRE_PLAYLISTS } from './constants';

/**
 * Generates auto-playlists from pre-fetched public content
 *
 * Matching priority:
 * 1. computed_genre (most reliable, server-set)
 * 2. style field (user-defined)
 * 3. tags field (comma-separated keywords)
 *
 * @param tracks - Array of public tracks with creator info
 * @returns Array of genre playlists with at least 2 tracks each
 *
 * @example
 * ```tsx
 * const { data } = usePublicContentBatch();
 * const playlists = getGenrePlaylists(data.allTracks);
 *
 * return (
 *   <div>
 *     {playlists.map(playlist => (
 *       <PlaylistCard
 *         key={playlist.id}
 *         title={playlist.title}
 *         tracks={playlist.tracks}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function getGenrePlaylists(tracks: PublicTrackWithCreator[]): GenrePlaylist[] {
  return GENRE_PLAYLISTS.map(({ genre, title, description, keywords }) => {
    const genreTracks = tracks.filter(track => {
      // Priority 1: computed_genre (most reliable)
      const computedGenre = (track.computed_genre || '').toLowerCase();
      if (keywords.some(keyword => computedGenre.includes(keyword))) {
        return true;
      }

      // Fallback: style and tags
      const style = (track.style || '').toLowerCase();
      const tags = (track.tags || '').toLowerCase();
      const searchText = `${style} ${tags}`;

      return keywords.some(keyword => searchText.includes(keyword));
    }).slice(0, 25);

    return {
      id: `auto-${genre}`,
      genre,
      title,
      description,
      tracks: genreTracks,
    };
  }).filter(p => p.tracks.length >= 2);
}
