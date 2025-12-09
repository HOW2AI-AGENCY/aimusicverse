import { handleStart } from './commands/start.ts';
import { handleHelp } from './commands/help.ts';
import { handleGenerate } from './commands/generate.ts';
import { handleLibrary } from './commands/library.ts';
import { handleProjects } from './commands/projects.ts';
import { handleStatus } from './commands/status.ts';
import { handleCoverCommand, handleExtendCommand, handleCancelCommand, handleCancelUploadCallback, getAudioUploadHelp } from './commands/audio-upload.ts';
import { handleAudioMessage, isAudioMessage } from './handlers/audio.ts';
import { handleRecognizeCommand, hasRecognitionSession, handleRecognizeAudio, handleCancelRecognize, handleRecognizeAgain } from './commands/recognize.ts';
import { handleMidiCommand, handlePianoCommand, hasMidiSession, handleCancelMidi, handleMidiTrackCallback, handleMidiModelCallback, handleMidiUploadCallback, handleMidiAgainCallback } from './commands/midi.ts';
import { sendMessage, parseCommand, answerCallbackQuery, editMessageText, type TelegramUpdate } from './telegram-api.ts';
import { BOT_CONFIG } from './config.ts';
import { handleNavigationCallback } from './handlers/navigation.ts';
import { handleMediaCallback } from './handlers/media.ts';
import { logger, checkRateLimit, trackMetric, flushMetrics } from './utils/index.ts';
import { handleInlineQuery } from './commands/inline.ts';
import { handleTerms, handlePrivacy, handleAbout } from './commands/legal.ts';

export async function handleUpdate(update: TelegramUpdate) {
  const startTime = Date.now();
  
  try {
    // Handle inline queries for sharing tracks
    if (update.inline_query) {
      await handleInlineQuery(update.inline_query);
      return;
    }
    // Handle callback queries from inline buttons
    if (update.callback_query) {
      const { id, data, message, from } = update.callback_query;
      const chatId = message?.chat?.id;

      if (!chatId) return;

      const messageId = message?.message_id;

      // Rate limiting
      if (!checkRateLimit(from.id, 30, 60000)) {
        await answerCallbackQuery(id, '⏳ Слишком много запросов. Подождите немного.');
        trackMetric({
          eventType: 'rate_limited',
          success: false,
          telegramChatId: chatId,
          metadata: { type: 'callback' },
        });
        return;
      }

      logger.info('callback_query', { userId: from.id, data, chatId });

      // New navigation handlers (реактивное обновление)
      if (data?.startsWith('nav_') || data?.startsWith('lib_page_') || data?.startsWith('project_page_')) {
        await handleNavigationCallback(data, chatId, from.id, messageId!, id);
        return;
      }

      // Media handlers (play, download, share, like)
      if (data?.startsWith('play_') || data?.startsWith('dl_') || 
          data?.startsWith('share_') || data?.startsWith('like_') || 
          data?.startsWith('track_') || data?.startsWith('share_link_')) {
        await handleMediaCallback(data, chatId, messageId!, id);
        return;
      }

      // Lyrics handler
      if (data?.startsWith('lyrics_')) {
        const trackId = data.replace('lyrics_', '');
        const { handleLyrics } = await import('./commands/lyrics.ts');
        await handleLyrics(chatId, trackId, messageId);
        await answerCallbackQuery(id);
        return;
      }

      // Stats handler
      if (data?.startsWith('stats_')) {
        const trackId = data.replace('stats_', '');
        const { handleTrackStats } = await import('./commands/stats.ts');
        await handleTrackStats(chatId, trackId, messageId);
        await answerCallbackQuery(id);
        return;
      }

      // Remix handlers
      if (data?.startsWith('remix_')) {
        const trackId = data.replace('remix_', '');
        const { handleRemix } = await import('./commands/remix.ts');
        await handleRemix(chatId, trackId, messageId);
        await answerCallbackQuery(id);
        return;
      }

      if (data?.startsWith('add_vocals_')) {
        const trackId = data.replace('add_vocals_', '');
        const { handleAddVocals } = await import('./commands/remix.ts');
        await handleAddVocals(chatId, from.id, trackId, messageId);
        await answerCallbackQuery(id);
        return;
      }

      if (data?.startsWith('add_instrumental_')) {
        const trackId = data.replace('add_instrumental_', '');
        const { handleAddInstrumental } = await import('./commands/remix.ts');
        await handleAddInstrumental(chatId, from.id, trackId, messageId);
        await answerCallbackQuery(id);
        return;
      }

      // Studio handlers
      if (data?.startsWith('studio_')) {
        const trackId = data.replace('studio_', '');
        const { handleStudio } = await import('./commands/studio.ts');
        await handleStudio(chatId, trackId, messageId);
        await answerCallbackQuery(id);
        return;
      }

      if (data?.startsWith('separate_stems_')) {
        const trackId = data.replace('separate_stems_', '');
        const { handleSeparateStems } = await import('./commands/studio.ts');
        await handleSeparateStems(chatId, from.id, trackId, messageId);
        await answerCallbackQuery(id);
        return;
      }

      if (data?.startsWith('download_stems_')) {
        const trackId = data.replace('download_stems_', '');
        const { handleDownloadStems } = await import('./commands/studio.ts');
        await handleDownloadStems(chatId, trackId, messageId);
        await answerCallbackQuery(id);
        return;
      }

      if (data?.startsWith('stem_mode_')) {
        const [_, mode, trackId] = data.split('_').slice(1);
        const { handleStemSeparation } = await import('./commands/stems.ts');
        await handleStemSeparation(
          chatId,
          trackId,
          mode as 'simple' | 'detailed',
          messageId
        );
        await answerCallbackQuery(id, '🎛️ Запуск разделения...');
        return;
      }

      // Playlist handlers
      if (data?.startsWith('add_playlist_')) {
        const trackId = data.replace('add_playlist_', '');
        const { handleAddToPlaylist } = await import('./commands/playlist.ts');
        await handleAddToPlaylist(chatId, from.id, trackId, messageId);
        await answerCallbackQuery(id);
        return;
      }

      if (data?.startsWith('playlist_add_')) {
        const [playlistId, trackId] = data.replace('playlist_add_', '').split('_');
        const { handlePlaylistAdd } = await import('./commands/playlist.ts');
        await handlePlaylistAdd(chatId, playlistId, trackId, id);
        return;
      }

      if (data?.startsWith('playlist_new_')) {
        const trackId = data.replace('playlist_new_', '');
        const { handlePlaylistNew } = await import('./commands/playlist.ts');
        await handlePlaylistNew(chatId, trackId, messageId);
        await answerCallbackQuery(id);
        return;
      }

      // Cancel upload handler
      if (data === 'cancel_upload') {
        await handleCancelUploadCallback(chatId, from.id, messageId!, id);
        return;
      }

      // Recognition handlers
      if (data === 'cancel_recognize') {
        await handleCancelRecognize(chatId, from.id, messageId, id);
        await answerCallbackQuery(id);
        return;
      }

      if (data === 'recognize_again') {
        await handleRecognizeAgain(chatId, from.id);
        await answerCallbackQuery(id);
        return;
      }

      // MIDI handlers
      if (data === 'cancel_midi') {
        await handleCancelMidi(chatId, from.id, messageId, id);
        return;
      }

      if (data === 'midi_again') {
        await handleMidiAgainCallback(chatId, from.id, id);
        return;
      }

      if (data === 'midi_upload') {
        await handleMidiUploadCallback(chatId, from.id, messageId!, id);
        return;
      }

      if (data?.startsWith('midi_track_')) {
        const trackId = data.replace('midi_track_', '');
        await handleMidiTrackCallback(chatId, trackId, messageId!, id);
        return;
      }

      if (data?.startsWith('midi_bp_')) {
        const trackId = data.replace('midi_bp_', '');
        await handleMidiModelCallback(chatId, from.id, trackId, 'basic-pitch', messageId!, id);
        return;
      }

      if (data?.startsWith('midi_mt3_')) {
        const trackId = data.replace('midi_mt3_', '');
        await handleMidiModelCallback(chatId, from.id, trackId, 'mt3', messageId!, id);
        return;
      }

      if (data?.startsWith('midi_p2p_')) {
        const trackId = data.replace('midi_p2p_', '');
        await handleMidiModelCallback(chatId, from.id, trackId, 'pop2piano', messageId!, id);
        return;
      }

      // Legal/info handlers
      if (data === 'legal_terms') {
        await handleTerms(chatId, messageId);
        await answerCallbackQuery(id);
        return;
      }

      if (data === 'legal_privacy') {
        await handlePrivacy(chatId, messageId);
        await answerCallbackQuery(id);
        return;
      }

      if (data === 'about') {
        await handleAbout(chatId, messageId);
        await answerCallbackQuery(id);
        return;
      }

      // Legacy handlers
      if (data === 'library') {
        await handleLibrary(chatId, from.id, messageId);
      } else if (data === 'projects') {
        await handleProjects(chatId, from.id, messageId);
      } else if (data === 'help') {
        if (messageId) {
          const { MESSAGES } = await import('./config.ts');
          const { createMainMenuKeyboard } = await import('./keyboards/main-menu.ts');
          await editMessageText(chatId, messageId, MESSAGES.help, createMainMenuKeyboard());
        }
      } else if (data === 'generate') {
        if (messageId) {
          const { createGenerateKeyboard } = await import('./keyboards/main-menu.ts');
          await editMessageText(
            chatId,
            messageId,
            '🎼 *Создание трека*\n\nВыберите стиль музыки или опишите свой:',
            createGenerateKeyboard()
          );
        }
      } else if (data === 'status') {
        await handleStatus(chatId, from.id, messageId);
      } else if (data === 'main_menu') {
        if (messageId) {
          const { createMainMenuKeyboard } = await import('./keyboards/main-menu.ts');
          await editMessageText(chatId, messageId, '🏠 *Главное меню*\n\nВыберите действие:', createMainMenuKeyboard());
        }
      } else if (data && data.startsWith('style_')) {
        if (messageId) {
          const style = data.replace('style_', '');
          const styleNames: Record<string, string> = {
            rock: 'рок',
            pop: 'поп',
            jazz: 'джаз',
            electronic: 'электроника',
            classical: 'классика',
            hiphop: 'хип-хоп'
          };
          await editMessageText(
            chatId,
            messageId,
            `🎵 *Стиль: ${styleNames[style] || style}*\n\nТеперь отправьте описание трека:\n\nНапример:\n"Энергичный трек с гитарными риффами и мощным барабанным битом"`
          );
        }
      } else if (data === 'custom_generate') {
        if (messageId) {
          await editMessageText(
            chatId,
            messageId,
            '✍️ *Своё описание*\n\nОпишите какую музыку вы хотите создать:\n\nИспользуйте /generate <ваше описание>'
          );
        }
      } else if (data && data.startsWith('check_task_')) {
        const taskId = data.replace('check_task_', '');
        const { handleCheckTask } = await import('./commands/check-task.ts');
        await handleCheckTask(chatId, from.id, taskId, messageId);
      } else if (data && data.startsWith('share_menu_')) {
        const trackId = data.replace('share_menu_', '');
        const { handleShareTrack } = await import('./commands/share.ts');
        await handleShareTrack(chatId, trackId, messageId);
      } else if (data && data.startsWith('send_to_chat_')) {
        const trackId = data.replace('send_to_chat_', '');
        const { handleSendTrackToChat } = await import('./commands/share.ts');
        await handleSendTrackToChat(chatId, from.id, trackId);
      } else if (data && data.startsWith('copy_link_')) {
        const trackId = data.replace('copy_link_', '');
        const { handleCopyTrackLink } = await import('./commands/share.ts');
        await handleCopyTrackLink(chatId, trackId, messageId);
      } else if (data && data.startsWith('track_details_')) {
        const trackId = data.replace('track_details_', '');
        const { handleTrackDetails } = await import('./commands/share.ts');
        await handleTrackDetails(chatId, trackId, messageId);
      } else if (data === 'settings') {
        const { handleSettings } = await import('./commands/settings.ts');
        await handleSettings(chatId, messageId);
      } else if (data === 'settings_notifications') {
        const { handleNotificationSettings } = await import('./commands/settings.ts');
        await handleNotificationSettings(chatId, from.id, messageId);
      } else if (data === 'settings_emoji_status') {
        const { handleEmojiStatusSettings } = await import('./commands/settings.ts');
        await handleEmojiStatusSettings(chatId, from.id, messageId);
      } else if (data && data.startsWith('emoji_')) {
        const emojiType = data.replace('emoji_', '');
        const { handleSetEmojiStatus, handleRemoveEmojiStatus } = await import('./commands/settings.ts');
        if (emojiType === 'remove') {
          await handleRemoveEmojiStatus(chatId, from.id, messageId);
        } else {
          await handleSetEmojiStatus(chatId, from.id, emojiType, messageId);
        }
      } else if (data && data.startsWith('notify_')) {
        // Notification toggle - handled in settings
        await answerCallbackQuery(id, '⚙️ Настройки сохранены');
      }

      await answerCallbackQuery(id);
      return;
    }

    // Handle messages
    if (update.message) {
      const { chat, from, text } = update.message;
      const message = update.message;
      
      if (!from) return;

      // Check for audio messages first (before text check)
      if (isAudioMessage(message)) {
        const audioData = message.audio || message.voice || message.document;
        if (audioData) {
          const audioType = message.audio ? 'audio' : message.voice ? 'voice' : 'document';
          
          // Check if user has recognition session
          if (hasRecognitionSession(from.id)) {
            await handleRecognizeAudio(chat.id, from.id, audioData.file_id, audioType);
            return;
          }
          
          await handleAudioMessage(chat.id, from.id, audioData as any, audioType);
          return;
        }
      }

      // Skip non-text messages after audio check
      if (!text) return;

      // Rate limiting for messages
      if (!checkRateLimit(from.id, 20, 60000)) {
        await sendMessage(chat.id, '⏳ Слишком много сообщений. Подождите немного.');
        trackMetric({
          eventType: 'rate_limited',
          success: false,
          telegramChatId: chat.id,
          metadata: { type: 'message' },
        });
        return;
      }

      logger.info('message', { userId: from.id, chatId: chat.id, text: text.substring(0, 50) });

      const cmd = parseCommand(text);

      if (!cmd) return;

      const { command, args } = cmd;

      switch (command) {
        case 'start': {
          // Check for start parameter in the command
          const startParam = args || undefined;
          await handleStart(chat.id, startParam);
          break;
        }

        case 'help':
          await handleHelp(chat.id);
          break;

        case 'generate':
          await handleGenerate(chat.id, from.id, args);
          break;

        case 'library':
          await handleLibrary(chat.id, from.id);
          break;

        case 'status':
          await handleStatus(chat.id, from.id);
          break;

        case 'app':
          await sendMessage(chat.id, '🎵 Открываем приложение...', {
            inline_keyboard: [[
              { text: '🎵 Открыть MusicVerse', web_app: { url: BOT_CONFIG.miniAppUrl } }
            ]]
          });
          break;

        case 'track': {
          if (args) {
            const trackId = args.replace('_', '');
            const { handleTrackDetails } = await import('./commands/share.ts');
            await handleTrackDetails(chat.id, trackId);
          }
          break;
        }

        case 'settings': {
          const { handleSettings } = await import('./commands/settings.ts');
          await handleSettings(chat.id);
          break;
        }

        case 'lyrics': {
          if (args) {
            const trackId = args.trim();
            const { handleLyrics } = await import('./commands/lyrics.ts');
            await handleLyrics(chat.id, trackId);
          } else {
            await sendMessage(chat.id, '❌ Укажите ID трека: /lyrics <track_id>');
          }
          break;
        }

        case 'stats': {
          if (args) {
            const trackId = args.trim();
            const { handleTrackStats } = await import('./commands/stats.ts');
            await handleTrackStats(chat.id, trackId);
          } else {
            await sendMessage(chat.id, '❌ Укажите ID трека: /stats <track_id>');
          }
          break;
        }

        case 'cover':
          await handleCoverCommand(chat.id, from.id, args);
          break;

        case 'extend':
          await handleExtendCommand(chat.id, from.id, args);
          break;

        case 'cancel':
          await handleCancelCommand(chat.id, from.id);
          break;

        case 'audio':
          await sendMessage(chat.id, getAudioUploadHelp());
          break;

        case 'terms':
          await handleTerms(chat.id);
          break;

        case 'privacy':
          await handlePrivacy(chat.id);
          break;

        case 'about':
          await handleAbout(chat.id);
          break;

        case 'recognize':
        case 'shazam':
          await handleRecognizeCommand(chat.id, from.id, args);
          break;

        case 'midi':
          await handleMidiCommand(chat.id, from.id, args);
          break;

        case 'piano':
          await handlePianoCommand(chat.id, from.id, args);
          break;

        default:
          await sendMessage(
            chat.id,
            'Неизвестная команда. Используйте /help для списка доступных команд.'
          );
      }
    }
  } catch (error) {
    logger.error('handleUpdate', error);
    throw error;
  }
}
