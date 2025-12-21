/**
 * Artist Callback Handlers
 */

export async function handleArtistCallbacks(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  if (!data.startsWith('artist_') && !data.startsWith('artists_page_') && data !== 'nav_artists') {
    return false;
  }

  const { 
    handleArtistsCallback, 
    handleArtistDetails, 
    handleArtistEdit, 
    handleArtistTogglePublic, 
    handleArtistDeleteConfirm, 
    handleArtistDelete, 
    handleArtistTracks 
  } = await import('../handlers/artists.ts');
  
  if (data === 'nav_artists' || data.startsWith('artists_page_')) {
    const page = data.startsWith('artists_page_') ? parseInt(data.split('_')[2]) : 0;
    await handleArtistsCallback(chatId, userId, messageId, queryId, page);
    return true;
  }

  if (data.startsWith('artist_details_')) {
    await handleArtistDetails(chatId, data.replace('artist_details_', ''), messageId, queryId);
    return true;
  }

  if (data.startsWith('artist_edit_')) {
    await handleArtistEdit(chatId, data.replace('artist_edit_', ''), userId, messageId, queryId);
    return true;
  }

  if (data.startsWith('artist_toggle_public_')) {
    await handleArtistTogglePublic(chatId, data.replace('artist_toggle_public_', ''), userId, messageId, queryId);
    return true;
  }

  if (data.startsWith('artist_delete_confirm_')) {
    await handleArtistDeleteConfirm(chatId, data.replace('artist_delete_confirm_', ''), messageId, queryId);
    return true;
  }

  if (data.startsWith('artist_delete_')) {
    await handleArtistDelete(chatId, data.replace('artist_delete_', ''), userId, messageId, queryId);
    return true;
  }

  if (data.startsWith('artist_tracks_')) {
    const parts = data.replace('artist_tracks_', '').split('_');
    const artistId = parts[0];
    const page = parts.length > 2 ? parseInt(parts[2]) : 0;
    await handleArtistTracks(chatId, artistId, messageId, queryId, page);
    return true;
  }

  return false;
}
