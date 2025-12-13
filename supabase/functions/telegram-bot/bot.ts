/**
 * Main Telegram bot handler with dynamic imports for reduced bundle size
 */

import { sendMessage, parseCommand, answerCallbackQuery, editMessageText, type TelegramUpdate } from './telegram-api.ts';
import { escapeMarkdownV2 } from './utils/text-processor.ts';
import { BOT_CONFIG } from './config.ts';
import { logger, checkRateLimit, trackMetric } from './utils/index.ts';

export async function handleUpdate(update: TelegramUpdate) {
  const startTime = Date.now();
  
  try {
    // Handle pre-checkout query (payment validation)
    if (update.pre_checkout_query) {
      const { handlePreCheckoutQuery } = await import('./handlers/payment.ts');
      await handlePreCheckoutQuery(update.pre_checkout_query);
      return;
    }

    // Handle inline queries for sharing tracks
    if (update.inline_query) {
      const { handleInlineQuery } = await import('./commands/inline.ts');
      await handleInlineQuery(update.inline_query);
      return;
    }

    // Handle callback queries from inline buttons
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return;
    }

    // Handle message updates
    const message = update.message;
    if (!message) return;

    const { chat, from, text } = message;
    if (!from) return;

    // Rate limiting
    if (!checkRateLimit(from.id, 20, 60000)) {
      await sendMessage(chat.id, '⏳ Слишком много запросов. Подождите немного.', undefined, null);
      trackMetric({
        eventType: 'rate_limited',
        success: false,
        telegramChatId: chat.id,
        metadata: { type: 'message' },
      });
      return;
    }

    logger.info('message', { userId: from.id, chatId: chat.id, text: text?.substring(0, 50) });

    // Handle successful payment
    if (message.successful_payment) {
      const { handleSuccessfulPayment } = await import('./handlers/payment.ts');
      await handleSuccessfulPayment(chat.id, from.id, message.successful_payment);
      return;
    }

    // Handle audio messages
    const { isAudioMessage, handleAudioMessage } = await import('./handlers/audio.ts');
    if (isAudioMessage(message)) {
      const audio = message.audio || message.voice || message.document;
      const type = message.audio ? 'audio' : message.voice ? 'voice' : 'document';
      await handleAudioMessage(chat.id, from.id, audio as any, type);
      return;
    }

    // Handle text messages
    if (!text) return;

    // Parse command
    const cmd = parseCommand(text);

    // Handle non-command text
    if (!cmd) {
      const { handleTextMessage, sendDefaultResponse } = await import('./handlers/text.ts');
      const handled = await handleTextMessage(chat.id, from.id, text);
      if (!handled) {
        await sendDefaultResponse(chat.id);
      }
      return;
    }

    // Handle commands
    await handleCommand(cmd.command, cmd.args, chat.id, from.id);

    trackMetric({
      eventType: 'message_sent',
      success: true,
      telegramChatId: chat.id,
      responseTimeMs: Date.now() - startTime,
      metadata: { command: cmd.command },
    });

  } catch (error) {
    logger.error('Error handling update', error);
    trackMetric({
      eventType: 'message_failed',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle command messages
 */
async function handleCommand(command: string, args: string, chatId: number, userId: number) {
  switch (command) {
    case 'start': {
      const { handleStart } = await import('./commands/start.ts');
      await handleStart(chatId, args);
      break;
    }
    case 'help': {
      const { handleHelp } = await import('./commands/help.ts');
      await handleHelp(chatId);
      break;
    }
    case 'app': {
      const { handleApp } = await import('./commands/app.ts');
      await handleApp(chatId);
      break;
    }
    case 'generate': {
      const { handleGenerate } = await import('./commands/generate.ts');
      await handleGenerate(chatId, userId, args);
      break;
    }
    case 'library': {
      const { handleLibrary } = await import('./commands/library.ts');
      await handleLibrary(chatId, userId);
      break;
    }
    case 'projects': {
      const { handleProjects } = await import('./commands/projects.ts');
      await handleProjects(chatId, userId);
      break;
    }
    case 'status': {
      const { handleStatus } = await import('./commands/status.ts');
      await handleStatus(chatId, userId);
      break;
    }
    case 'cover': {
      const { handleCoverCommand } = await import('./commands/audio-upload.ts');
      await handleCoverCommand(chatId, userId, args);
      break;
    }
    case 'extend': {
      const { handleExtendCommand } = await import('./commands/audio-upload.ts');
      await handleExtendCommand(chatId, userId, args);
      break;
    }
    case 'cancel': {
      const { handleCancelCommand } = await import('./commands/audio-upload.ts');
      await handleCancelCommand(chatId, userId);
      break;
    }
    case 'upload': {
      const { handleUploadCommand } = await import('./commands/upload.ts');
      await handleUploadCommand(chatId, userId, args);
      break;
    }
    case 'uploads': {
      const { handleMyUploads } = await import('./commands/upload.ts');
      await handleMyUploads(chatId, userId);
      break;
    }
    case 'recognize': {
      const { handleRecognizeCommand } = await import('./commands/recognize.ts');
      await handleRecognizeCommand(chatId, userId);
      break;
    }
    case 'midi': {
      const { handleMidiCommand } = await import('./commands/midi.ts');
      await handleMidiCommand(chatId, userId);
      break;
    }
    case 'piano': {
      const { handlePianoCommand } = await import('./commands/midi.ts');
      await handlePianoCommand(chatId, userId);
      break;
    }
    case 'guitar': {
      const { handleGuitarCommand } = await import('./commands/guitar.ts');
      await handleGuitarCommand(chatId, userId);
      break;
    }
    case 'analyze': {
      const { handleAnalyzeCommand } = await import('./commands/analyze.ts');
      await handleAnalyzeCommand(chatId, userId, args);
      break;
    }
    case 'feedback': {
      const { handleFeedback } = await import('./commands/feedback.ts');
      await handleFeedback(chatId, userId);
      break;
    }
    case 'buy': {
      const { handleBuyCommand } = await import('./handlers/payment.ts');
      await handleBuyCommand(chatId);
      break;
    }
    case 'terms': {
      const { handleTerms } = await import('./commands/legal.ts');
      await handleTerms(chatId);
      break;
    }
    case 'privacy': {
      const { handlePrivacy } = await import('./commands/legal.ts');
      await handlePrivacy(chatId);
      break;
    }
    default:
      await sendMessage(chatId, '❓ Неизвестная команда. Используйте /help для списка команд.', undefined, null);
  }
}

/**
 * Handle callback queries from inline buttons
 */
async function handleCallbackQuery(callbackQuery: NonNullable<TelegramUpdate['callback_query']>) {
  const { id, data, message, from } = callbackQuery;
  const chatId = message?.chat?.id;
  if (!chatId || !data) return;

  const messageId = message?.message_id;

  // Rate limiting
  if (!checkRateLimit(from.id, 30, 60000)) {
    await answerCallbackQuery(id, '⏳ Слишком много запросов.');
    return;
  }

  logger.info('callback_query', { userId: from.id, data, chatId });

  try {
    // Feedback handlers
    if (data.startsWith('feedback_')) {
      const { handleFeedbackTypeCallback, handleFeedbackRating, handleFeedbackSkipRating, handleFeedbackCancel } = await import('./commands/feedback.ts');
      
      if (data.startsWith('feedback_type_')) {
        const type = data.replace('feedback_type_', '');
        await handleFeedbackTypeCallback(chatId, from.id, type, messageId!);
        await answerCallbackQuery(id);
      } else if (data.startsWith('feedback_rate_')) {
        const rating = parseInt(data.replace('feedback_rate_', ''));
        await handleFeedbackRating(chatId, from.id, rating);
        await answerCallbackQuery(id, '✅ Спасибо за оценку!');
      } else if (data === 'feedback_skip_rating') {
        await handleFeedbackSkipRating(chatId);
        await answerCallbackQuery(id);
      } else if (data === 'feedback_cancel') {
        await handleFeedbackCancel(chatId);
        await answerCallbackQuery(id);
      }
      return;
    }
    
    // Navigation handlers
    if (data.startsWith('nav_') || data.startsWith('lib_page_') || data.startsWith('project_page_')) {
      const { handleNavigationCallback } = await import('./handlers/navigation.ts');
      await handleNavigationCallback(data, chatId, from.id, messageId!, id);
      return;
    }

    // Artist handlers
    if (data.startsWith('artist_') || data.startsWith('artists_page_')) {
      const { handleArtistsCallback, handleArtistDetails, handleArtistEdit, handleArtistTogglePublic, handleArtistDeleteConfirm, handleArtistDelete, handleArtistTracks } = await import('./handlers/artists.ts');
      
      if (data === 'nav_artists' || data.startsWith('artists_page_')) {
        const page = data.startsWith('artists_page_') ? parseInt(data.split('_')[2]) : 0;
        await handleArtistsCallback(chatId, from.id, messageId!, id, page);
      } else if (data.startsWith('artist_details_')) {
        await handleArtistDetails(chatId, data.replace('artist_details_', ''), messageId!, id);
      } else if (data.startsWith('artist_edit_')) {
        await handleArtistEdit(chatId, data.replace('artist_edit_', ''), from.id, messageId!, id);
      } else if (data.startsWith('artist_toggle_public_')) {
        await handleArtistTogglePublic(chatId, data.replace('artist_toggle_public_', ''), from.id, messageId!, id);
      } else if (data.startsWith('artist_delete_confirm_')) {
        await handleArtistDeleteConfirm(chatId, data.replace('artist_delete_confirm_', ''), messageId!, id);
      } else if (data.startsWith('artist_delete_')) {
        await handleArtistDelete(chatId, data.replace('artist_delete_', ''), from.id, messageId!, id);
      } else if (data.startsWith('artist_tracks_')) {
        const parts = data.replace('artist_tracks_', '').split('_');
        const artistId = parts[0];
        const page = parts.length > 2 ? parseInt(parts[2]) : 0;
        await handleArtistTracks(chatId, artistId, messageId!, id, page);
      }
      return;
    }

    // Project handlers
    if (data.startsWith('project_') || data.startsWith('projects_page_')) {
      const { handleProjectsCallback, handleProjectDetails, handleProjectEdit, handleProjectStatusChange, handleProjectDeleteConfirm, handleProjectDelete, handleProjectTracks } = await import('./handlers/projects.ts');
      
      if (data === 'nav_projects' || data.startsWith('projects_page_')) {
        const page = data.startsWith('projects_page_') ? parseInt(data.split('_')[2]) : 0;
        await handleProjectsCallback(chatId, from.id, messageId!, id, page);
      } else if (data.startsWith('project_details_')) {
        await handleProjectDetails(chatId, data.replace('project_details_', ''), messageId!, id);
      } else if (data.startsWith('project_edit_')) {
        await handleProjectEdit(chatId, data.replace('project_edit_', ''), from.id, messageId!, id);
      } else if (data.startsWith('project_status_')) {
        const parts = data.replace('project_status_', '').split('_');
        await handleProjectStatusChange(chatId, parts[0], parts[1], from.id, messageId!, id);
      } else if (data.startsWith('project_delete_confirm_')) {
        await handleProjectDeleteConfirm(chatId, data.replace('project_delete_confirm_', ''), messageId!, id);
      } else if (data.startsWith('project_delete_')) {
        await handleProjectDelete(chatId, data.replace('project_delete_', ''), from.id, messageId!, id);
      } else if (data.startsWith('project_tracks_')) {
        await handleProjectTracks(chatId, data.replace('project_tracks_', ''), messageId!, id);
      }
      return;
    }

    // Media handlers
    if (data.startsWith('play_') || data.startsWith('dl_') || data.startsWith('share_') || 
        data.startsWith('like_') || data.startsWith('track_') || data.startsWith('share_link_')) {
      const { handleMediaCallback } = await import('./handlers/media.ts');
      await handleMediaCallback(data, chatId, messageId!, id);
      return;
    }

    // Lyrics
    if (data.startsWith('lyrics_')) {
      const trackId = data.replace('lyrics_', '');
      const { handleLyrics } = await import('./commands/lyrics.ts');
      await handleLyrics(chatId, trackId, messageId);
      await answerCallbackQuery(id);
      return;
    }

    // Stats
    if (data.startsWith('stats_')) {
      const trackId = data.replace('stats_', '');
      const { handleTrackStats } = await import('./commands/stats.ts');
      await handleTrackStats(chatId, trackId, messageId);
      await answerCallbackQuery(id);
      return;
    }

    // Remix handlers
    if (data.startsWith('remix_')) {
      const trackId = data.replace('remix_', '');
      const { handleRemix } = await import('./commands/remix.ts');
      await handleRemix(chatId, trackId, messageId);
      await answerCallbackQuery(id);
      return;
    }

    if (data.startsWith('add_vocals_')) {
      const trackId = data.replace('add_vocals_', '');
      const { handleAddVocals } = await import('./commands/remix.ts');
      await handleAddVocals(chatId, from.id, trackId, messageId);
      await answerCallbackQuery(id);
      return;
    }

    if (data.startsWith('add_instrumental_')) {
      const trackId = data.replace('add_instrumental_', '');
      const { handleAddInstrumental } = await import('./commands/remix.ts');
      await handleAddInstrumental(chatId, from.id, trackId, messageId);
      await answerCallbackQuery(id);
      return;
    }

    // Studio handlers
    if (data.startsWith('studio_')) {
      const trackId = data.replace('studio_', '');
      const { handleStudio } = await import('./commands/studio.ts');
      await handleStudio(chatId, trackId, messageId);
      await answerCallbackQuery(id);
      return;
    }

    if (data.startsWith('separate_stems_')) {
      const trackId = data.replace('separate_stems_', '');
      const { handleSeparateStems } = await import('./commands/studio.ts');
      await handleSeparateStems(chatId, from.id, trackId, messageId);
      await answerCallbackQuery(id);
      return;
    }

    if (data.startsWith('download_stems_')) {
      const trackId = data.replace('download_stems_', '');
      const { handleDownloadStems } = await import('./commands/studio.ts');
      await handleDownloadStems(chatId, trackId, messageId);
      await answerCallbackQuery(id);
      return;
    }

    if (data.startsWith('stem_mode_')) {
      const parts = data.split('_');
      const mode = parts[2];
      const trackId = parts[3];
      const { handleStemSeparation } = await import('./commands/stems.ts');
      await handleStemSeparation(chatId, trackId, mode as 'simple' | 'detailed', messageId);
      await answerCallbackQuery(id, '🎛️ Запуск разделения...');
      return;
    }

    // Playlist handlers
    if (data.startsWith('add_playlist_')) {
      const trackId = data.replace('add_playlist_', '');
      const { handleAddToPlaylist } = await import('./commands/playlist.ts');
      await handleAddToPlaylist(chatId, from.id, trackId, messageId);
      await answerCallbackQuery(id);
      return;
    }

    if (data.startsWith('playlist_add_')) {
      const [playlistId, trackId] = data.replace('playlist_add_', '').split('_');
      const { handlePlaylistAdd } = await import('./commands/playlist.ts');
      await handlePlaylistAdd(chatId, playlistId, trackId, id);
      return;
    }

    if (data.startsWith('playlist_new_')) {
      const trackId = data.replace('playlist_new_', '');
      const { handlePlaylistNew } = await import('./commands/playlist.ts');
      await handlePlaylistNew(chatId, trackId, messageId);
      await answerCallbackQuery(id);
      return;
    }

    // Audio upload action handlers (NEW)
    if (data.startsWith('audio_action_')) {
      const action = data.replace('audio_action_', '');
      const { handleAudioActionCallback } = await import('./commands/audio-upload.ts');
      await handleAudioActionCallback(chatId, from.id, action, messageId!, id);
      return;
    }

    // Upload handlers
    if (data === 'cancel_upload') {
      const { handleCancelUploadCallback } = await import('./commands/audio-upload.ts');
      await handleCancelUploadCallback(chatId, from.id, messageId!, id);
      return;
    }

    if (data === 'my_uploads') {
      const { handleMyUploads } = await import('./commands/upload.ts');
      await handleMyUploads(chatId, from.id, messageId);
      await answerCallbackQuery(id);
      return;
    }

    if (data === 'start_upload') {
      const { handleUploadCommand } = await import('./commands/upload.ts');
      await handleUploadCommand(chatId, from.id, '', messageId, true); // deleteOriginal=true for photo messages
      await answerCallbackQuery(id);
      return;
    }

    // Reference handlers
    if (data.startsWith('select_ref_')) {
      const refId = data.replace('select_ref_', '');
      const { handleSelectReference } = await import('./commands/upload.ts');
      await handleSelectReference(chatId, from.id, refId, messageId!, id);
      return;
    }

    if (data.startsWith('use_ref_cover_')) {
      const refId = data.replace('use_ref_cover_', '');
      const { handleUseReference } = await import('./commands/upload.ts');
      await handleUseReference(chatId, from.id, refId, 'cover', messageId!, id);
      return;
    }

    if (data.startsWith('use_ref_extend_')) {
      const refId = data.replace('use_ref_extend_', '');
      const { handleUseReference } = await import('./commands/upload.ts');
      await handleUseReference(chatId, from.id, refId, 'extend', messageId!, id);
      return;
    }

    if (data.startsWith('delete_ref_')) {
      const refId = data.replace('delete_ref_', '');
      const { handleDeleteReference } = await import('./commands/upload.ts');
      await handleDeleteReference(chatId, from.id, refId, messageId!, id);
      return;
    }

    // Show lyrics from reference audio
    if (data.startsWith('show_lyrics_')) {
      const refId = data.replace('show_lyrics_', '');
      const { handleShowLyrics } = await import('./commands/upload.ts');
      await handleShowLyrics(chatId, refId, messageId!, id);
      return;
    }

    if (data.startsWith('ref_generate_cover_')) {
      const refId = data.replace('ref_generate_cover_', '');
      const { handleGenerateFromReference } = await import('./commands/upload.ts');
      await handleGenerateFromReference(chatId, from.id, refId, 'cover', messageId!, id);
      return;
    }

    if (data.startsWith('ref_generate_extend_')) {
      const refId = data.replace('ref_generate_extend_', '');
      const { handleGenerateFromReference } = await import('./commands/upload.ts');
      await handleGenerateFromReference(chatId, from.id, refId, 'extend', messageId!, id);
      return;
    }

    // Recognition handlers
    if (data === 'cancel_recognize') {
      const { handleCancelRecognize } = await import('./commands/recognize.ts');
      await handleCancelRecognize(chatId, from.id, messageId, id);
      return;
    }

    if (data === 'recognize_again') {
      const { handleRecognizeAgain } = await import('./commands/recognize.ts');
      await handleRecognizeAgain(chatId, from.id);
      await answerCallbackQuery(id);
      return;
    }

    // MIDI handlers
    if (data === 'cancel_midi') {
      const { handleCancelMidi } = await import('./commands/midi.ts');
      await handleCancelMidi(chatId, from.id, messageId, id);
      return;
    }

    if (data === 'midi_again') {
      const { handleMidiAgainCallback } = await import('./commands/midi.ts');
      await handleMidiAgainCallback(chatId, from.id, id);
      return;
    }

    if (data === 'midi_upload') {
      const { handleMidiUploadCallback } = await import('./commands/midi.ts');
      await handleMidiUploadCallback(chatId, from.id, messageId!, id);
      return;
    }

    if (data.startsWith('midi_track_')) {
      const trackId = data.replace('midi_track_', '');
      const { handleMidiTrackCallback } = await import('./commands/midi.ts');
      await handleMidiTrackCallback(chatId, trackId, messageId!, id);
      return;
    }

    if (data.startsWith('midi_bp_')) {
      const trackId = data.replace('midi_bp_', '');
      const { handleMidiModelCallback } = await import('./commands/midi.ts');
      await handleMidiModelCallback(chatId, from.id, trackId, 'basic-pitch', messageId!, id);
      return;
    }

    if (data.startsWith('midi_mt3_')) {
      const trackId = data.replace('midi_mt3_', '');
      const { handleMidiModelCallback } = await import('./commands/midi.ts');
      await handleMidiModelCallback(chatId, from.id, trackId, 'mt3', messageId!, id);
      return;
    }

    if (data.startsWith('midi_p2p_')) {
      const trackId = data.replace('midi_p2p_', '');
      const { handleMidiModelCallback } = await import('./commands/midi.ts');
      await handleMidiModelCallback(chatId, from.id, trackId, 'pop2piano', messageId!, id);
      return;
    }

    // Guitar analysis
    if (data === 'cancel_guitar') {
      const { handleCancelGuitar } = await import('./commands/guitar.ts');
      await handleCancelGuitar(chatId, from.id, messageId, id);
      return;
    }

    if (data === 'guitar_again') {
      const { handleGuitarAgain } = await import('./commands/guitar.ts');
      await handleGuitarAgain(chatId, from.id);
      await answerCallbackQuery(id);
      return;
    }

    // Analyze handlers
    if (data === 'analyze_list') {
      const { handleAnalyzeList } = await import('./commands/analyze.ts');
      await handleAnalyzeList(chatId, from.id, messageId!, id);
      return;
    }

    if (data.startsWith('analyze_select_')) {
      const refId = data.replace('analyze_select_', '');
      const { handleAnalyzeSelect } = await import('./commands/analyze.ts');
      await handleAnalyzeSelect(chatId, from.id, refId, messageId!, id);
      return;
    }

    if (data.startsWith('analyze_transcribe_')) {
      const refId = data.replace('analyze_transcribe_', '');
      const { handleTranscribeMenu } = await import('./commands/analyze.ts');
      await handleTranscribeMenu(chatId, from.id, refId, messageId!, id);
      return;
    }

    if (data.startsWith('analyze_tr_')) {
      const parts = data.replace('analyze_tr_', '').split('_');
      const model = parts[0];
      const refId = parts.slice(1).join('_');
      const { handleTranscription } = await import('./commands/analyze.ts');
      await handleTranscription(chatId, from.id, refId, model, messageId!, id);
      return;
    }

    if (data.startsWith('analyze_chords_')) {
      const refId = data.replace('analyze_chords_', '');
      const { handleChordAnalysis } = await import('./commands/analyze.ts');
      await handleChordAnalysis(chatId, from.id, refId, messageId!, id);
      return;
    }

    if (data.startsWith('analyze_beats_')) {
      const refId = data.replace('analyze_beats_', '');
      const { handleBeatAnalysis } = await import('./commands/analyze.ts');
      await handleBeatAnalysis(chatId, from.id, refId, messageId!, id);
      return;
    }

    if (data.startsWith('analyze_full_')) {
      const refId = data.replace('analyze_full_', '');
      const { handleFullAnalysis } = await import('./commands/analyze.ts');
      await handleFullAnalysis(chatId, from.id, refId, messageId!, id);
      return;
    }

    // Legal handlers
    if (data === 'legal_terms') {
      const { handleTerms } = await import('./commands/legal.ts');
      await handleTerms(chatId, messageId);
      await answerCallbackQuery(id);
      return;
    }

    if (data === 'legal_privacy') {
      const { handlePrivacy } = await import('./commands/legal.ts');
      await handlePrivacy(chatId, messageId);
      await answerCallbackQuery(id);
      return;
    }

    if (data === 'about') {
      const { handleAbout } = await import('./commands/legal.ts');
      await handleAbout(chatId, messageId);
      await answerCallbackQuery(id);
      return;
    }

    // Profile and track detail handlers
    if (data.startsWith('nav_profile') || data.startsWith('nav_balance') || 
        data.startsWith('nav_achievements') || data.startsWith('nav_leaderboard') || 
        data.startsWith('nav_transactions')) {
      const { handleProfileCallback } = await import('./handlers/profile.ts');
      const handled = await handleProfileCallback(data, chatId, from.id, messageId!, id);
      if (handled) return;
    }

    if (data.startsWith('track_details_') || data.startsWith('play_track_') ||
        data.startsWith('toggle_like_') || data.startsWith('download_track_') ||
        data.startsWith('share_track_') || data.startsWith('copy_link_')) {
      const { handleTrackCallback } = await import('./handlers/track-details.ts');
      const handled = await handleTrackCallback(data, chatId, from.id, messageId!, id);
      if (handled) return;
    }

    // Payment handlers
    if (data === 'buy_credits' || data === 'buy_menu_main') {
      const { handleBuyCommand } = await import('./handlers/payment.ts');
      await handleBuyCommand(chatId);
      await answerCallbackQuery(id);
      return;
    }

    if (data === 'buy_menu_credits') {
      const { handleBuyCreditPackages } = await import('./handlers/payment.ts');
      await handleBuyCreditPackages(chatId, messageId);
      await answerCallbackQuery(id);
      return;
    }

    if (data === 'buy_menu_subscriptions') {
      const { handleBuySubscriptions } = await import('./handlers/payment.ts');
      await handleBuySubscriptions(chatId, messageId);
      await answerCallbackQuery(id);
      return;
    }

    if (data.startsWith('buy_product_')) {
      const productCode = data.replace('buy_product_', '');
      const { handleBuyProduct } = await import('./handlers/payment.ts');
      await handleBuyProduct(chatId, from.id, productCode);
      await answerCallbackQuery(id, '🔄 Создаём счёт...');
      return;
    }

    // Legacy menu handlers
    if (data === 'analyze') {
      const { handleAnalyzeCommand } = await import('./commands/analyze.ts');
      await handleAnalyzeCommand(chatId, from.id, '');
      await answerCallbackQuery(id);
      return;
    } else if (data === 'settings') {
      if (messageId) {
        await editMessageText(chatId, messageId, '⚙️ *Настройки*\n\nНастройки доступны в приложении:', {
          inline_keyboard: [
            [{ text: '📱 Открыть настройки', web_app: { url: `${(await import('./config.ts')).BOT_CONFIG.miniAppUrl}/settings` } }],
            [{ text: '🔙 Назад', callback_data: 'main_menu' }]
          ]
        });
      }
      await answerCallbackQuery(id);
      return;
    } else if (data === 'library') {
      const { handleLibrary } = await import('./commands/library.ts');
      await handleLibrary(chatId, from.id, messageId);
    } else if (data === 'projects') {
      const { handleProjects } = await import('./commands/projects.ts');
      await handleProjects(chatId, from.id, messageId);
    } else if (data === 'help') {
      const { MESSAGES } = await import('./config.ts');
      const { createMainMenuKeyboard } = await import('./keyboards/main-menu.ts');
      // Send new message instead of editing (original might be a photo)
      await sendMessage(chatId, MESSAGES.help, createMainMenuKeyboard(), 'MarkdownV2');
    } else if (data === 'generate') {
      // Navigate to generate menu instead of editing
      const { handleNavigationGenerate } = await import('./handlers/navigation.ts');
      await handleNavigationGenerate(chatId, from.id, messageId);
    } else if (data === 'status') {
      const { handleStatus } = await import('./commands/status.ts');
      await handleStatus(chatId, from.id, messageId);
    } else if (data === 'main_menu' || data === 'open_main_menu') {
      // Navigate to main menu - delete old and send new for open_main_menu
      if (data === 'open_main_menu') {
        const { deleteAndSendNewMenu } = await import('./core/active-menu-manager.ts');
        const { createMainMenuKeyboard } = await import('./keyboards/main-menu.ts');
        const { MESSAGES } = await import('./config.ts');
        await deleteAndSendNewMenu(chatId, from.id, MESSAGES.welcome, createMainMenuKeyboard(), 'main_menu', 'MarkdownV2');
      } else {
        const { handleNavigationMain } = await import('./handlers/navigation.ts');
        await handleNavigationMain(chatId, messageId, from.id);
      }
    } else if (data.startsWith('style_')) {
      const style = data.replace('style_', '');
      const styleNames: Record<string, string> = {
        rock: 'рок', pop: 'поп', jazz: 'джаз',
        electronic: 'электроника', classical: 'классика', hiphop: 'хип-хоп'
      };
      // Send new message instead of editing
      await sendMessage(chatId, `🎵 *Стиль: ${escapeMarkdownV2(styleNames[style] || style)}*\n\nТеперь отправьте описание трека:\n\nНапример:\n"Энергичный трек с гитарными риффами и мощным барабанным битом"`, undefined, 'MarkdownV2');
    } else if (data === 'custom_generate') {
      await sendMessage(chatId, '✍️ *Своё описание*\n\nОпишите какую музыку вы хотите создать:\n\nИспользуйте /generate \\<ваше описание\\>', undefined, 'MarkdownV2');
    } else if (data.startsWith('check_task_')) {
      const taskId = data.replace('check_task_', '');
      const { handleCheckTask } = await import('./commands/check-task.ts');
      await handleCheckTask(chatId, from.id, taskId, messageId);
    } else if (data.startsWith('share_menu_')) {
      const trackId = data.replace('share_menu_', '');
      const { handleShareTrack } = await import('./commands/share.ts');
      await handleShareTrack(chatId, trackId, messageId);
    } else if (data.startsWith('send_to_chat_')) {
      const trackId = data.replace('send_to_chat_', '');
      const { handleSendTrackToChat } = await import('./commands/share.ts');
      await handleSendTrackToChat(chatId, from.id, trackId);
    } else if (data.startsWith('get_share_link_')) {
      const trackId = data.replace('get_share_link_', '');
      const { handleCopyTrackLink } = await import('./commands/share.ts');
      await handleCopyTrackLink(chatId, trackId, messageId);
    } else if (data.startsWith('video_')) {
      const trackId = data.replace('video_', '');
      const { handleVideoGeneration } = await import('./commands/video.ts');
      await handleVideoGeneration(chatId, from.id, trackId, messageId);
    }

    await answerCallbackQuery(id);

  } catch (error) {
    logger.error('Error handling callback', error);
    await answerCallbackQuery(id, '❌ Ошибка');
  }
}
