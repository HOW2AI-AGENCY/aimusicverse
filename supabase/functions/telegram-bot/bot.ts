import { handleStart } from './commands/start.ts';
import { handleHelp } from './commands/help.ts';
import { handleGenerate } from './commands/generate.ts';
import { handleLibrary } from './commands/library.ts';
import { handleProjects } from './commands/projects.ts';
import { handleStatus } from './commands/status.ts';
import { sendMessage, parseCommand, answerCallbackQuery, editMessageText, type TelegramUpdate } from './telegram-api.ts';
import { BOT_CONFIG } from './config.ts';

export async function handleUpdate(update: TelegramUpdate) {
  try {
    // Handle callback queries from inline buttons
    if (update.callback_query) {
      const { id, data, message, from } = update.callback_query;
      const chatId = message?.chat?.id;

      if (!chatId) return;

      const messageId = message?.message_id;

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
      }

      await answerCallbackQuery(id);
      return;
    }

    // Handle messages
    if (update.message) {
      const { chat, from, text } = update.message;
      
      if (!from || !text) return;

      const cmd = parseCommand(text);

      if (!cmd) return;

      const { command, args } = cmd;

      switch (command) {
        case 'start':
          // Check for start parameter in the command
          const startParam = args || undefined;
          await handleStart(chat.id, startParam);
          break;

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

        case 'track':
          if (args) {
            const trackId = args.replace('_', '');
            const { handleTrackDetails } = await import('./commands/share.ts');
            await handleTrackDetails(chat.id, trackId);
          }
          break;

        case 'settings':
          const { handleSettings } = await import('./commands/settings.ts');
          await handleSettings(chat.id);
          break;

        default:
          await sendMessage(
            chat.id,
            'Неизвестная команда. Используйте /help для списка доступных команд.'
          );
      }
    }
  } catch (error) {
    console.error('Error handling update:', error);
    throw error;
  }
}
