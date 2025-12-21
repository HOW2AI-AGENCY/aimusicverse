/**
 * Media Callback Handlers (tracks, lyrics, remix, studio, playlist)
 */

import { answerCallbackQuery } from '../telegram-api.ts';

export async function handleMediaCallbacks(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  // Track details and actions
  if (data.startsWith('track_details_') || data.startsWith('play_track_') ||
      data.startsWith('toggle_like_') || data.startsWith('download_track_') ||
      data.startsWith('share_track_') || data.startsWith('copy_link_')) {
    const { handleTrackCallback } = await import('../handlers/track-details.ts');
    const handled = await handleTrackCallback(data, chatId, userId, messageId, queryId);
    return handled;
  }

  // Play/download/share/like
  if (data.startsWith('play_') || data.startsWith('dl_') || data.startsWith('share_') || 
      data.startsWith('like_') || data.startsWith('track_') || data.startsWith('share_link_')) {
    const { handleMediaCallback } = await import('../handlers/media.ts');
    await handleMediaCallback(data, chatId, messageId, queryId);
    return true;
  }

  // Lyrics
  if (data.startsWith('lyrics_')) {
    const trackId = data.replace('lyrics_', '');
    const { handleLyrics } = await import('../commands/lyrics.ts');
    await handleLyrics(chatId, trackId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  // Stats
  if (data.startsWith('stats_')) {
    const trackId = data.replace('stats_', '');
    const { handleTrackStats } = await import('../commands/stats.ts');
    await handleTrackStats(chatId, trackId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  // Remix handlers
  if (data.startsWith('remix_')) {
    const trackId = data.replace('remix_', '');
    const { handleRemix } = await import('../commands/remix.ts');
    await handleRemix(chatId, trackId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  if (data.startsWith('add_vocals_')) {
    const trackId = data.replace('add_vocals_', '');
    const { handleAddVocals } = await import('../commands/remix.ts');
    await handleAddVocals(chatId, userId, trackId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  if (data.startsWith('add_instrumental_')) {
    const trackId = data.replace('add_instrumental_', '');
    const { handleAddInstrumental } = await import('../commands/remix.ts');
    await handleAddInstrumental(chatId, userId, trackId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  // Studio handlers
  if (data.startsWith('studio_')) {
    const trackId = data.replace('studio_', '');
    const { handleStudio } = await import('../commands/studio.ts');
    await handleStudio(chatId, trackId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  if (data.startsWith('separate_stems_')) {
    const trackId = data.replace('separate_stems_', '');
    const { handleSeparateStems } = await import('../commands/studio.ts');
    await handleSeparateStems(chatId, userId, trackId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  if (data.startsWith('download_stems_')) {
    const trackId = data.replace('download_stems_', '');
    const { handleDownloadStems } = await import('../commands/studio.ts');
    await handleDownloadStems(chatId, trackId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  if (data.startsWith('stem_mode_')) {
    const parts = data.split('_');
    const mode = parts[2];
    const trackId = parts[3];
    const { handleStemSeparation } = await import('../commands/stems.ts');
    await handleStemSeparation(chatId, trackId, mode as 'simple' | 'detailed', messageId);
    await answerCallbackQuery(queryId, '🎛️ Запуск разделения...');
    return true;
  }

  // Playlist handlers
  if (data.startsWith('add_playlist_')) {
    const trackId = data.replace('add_playlist_', '');
    const { handleAddToPlaylist } = await import('../commands/playlist.ts');
    await handleAddToPlaylist(chatId, userId, trackId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  if (data.startsWith('playlist_add_')) {
    const [playlistId, trackId] = data.replace('playlist_add_', '').split('_');
    const { handlePlaylistAdd } = await import('../commands/playlist.ts');
    await handlePlaylistAdd(chatId, playlistId, trackId, queryId);
    return true;
  }

  if (data.startsWith('playlist_new_')) {
    const trackId = data.replace('playlist_new_', '');
    const { handlePlaylistNew } = await import('../commands/playlist.ts');
    await handlePlaylistNew(chatId, trackId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  // Share menu
  if (data.startsWith('share_menu_')) {
    const trackId = data.replace('share_menu_', '');
    const { handleShareTrack } = await import('../commands/share.ts');
    await handleShareTrack(chatId, trackId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  if (data.startsWith('send_to_chat_')) {
    const trackId = data.replace('send_to_chat_', '');
    const { handleSendTrackToChat } = await import('../commands/share.ts');
    await handleSendTrackToChat(chatId, userId, trackId);
    await answerCallbackQuery(queryId);
    return true;
  }

  if (data.startsWith('get_share_link_')) {
    const trackId = data.replace('get_share_link_', '');
    const { handleCopyTrackLink } = await import('../commands/share.ts');
    await handleCopyTrackLink(chatId, trackId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  // Video generation
  if (data.startsWith('video_')) {
    const trackId = data.replace('video_', '');
    const { handleVideoGeneration } = await import('../commands/video.ts');
    await handleVideoGeneration(chatId, userId, trackId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  // Check task
  if (data.startsWith('check_task_')) {
    const taskId = data.replace('check_task_', '');
    const { handleCheckTask } = await import('../commands/check-task.ts');
    await handleCheckTask(chatId, userId, taskId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  return false;
}
