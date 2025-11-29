import { handleStart } from './commands/start.ts';
import { handleHelp } from './commands/help.ts';
import { handleGenerate } from './commands/generate.ts';
import { handleLibrary } from './commands/library.ts';
import { handleProjects } from './commands/projects.ts';
import { sendMessage, parseCommand, answerCallbackQuery, type TelegramUpdate } from './telegram-api.ts';
import { BOT_CONFIG } from './config.ts';

export async function handleUpdate(update: TelegramUpdate) {
  try {
    // Handle callback queries from inline buttons
    if (update.callback_query) {
      const { id, data, message, from } = update.callback_query;
      const chatId = message?.chat?.id;

      if (!chatId) return;

      if (data === 'library') {
        await handleLibrary(chatId, from.id);
      } else if (data === 'projects') {
        await handleProjects(chatId, from.id);
      } else if (data === 'help') {
        await handleHelp(chatId);
      } else if (data === 'generate') {
        await sendMessage(chatId, 'Используйте команду:\n/generate <описание трека>');
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

        case 'projects':
          await handleProjects(chat.id, from.id);
          break;

        case 'app':
          await sendMessage(chat.id, '🎵 Открываем приложение...', {
            inline_keyboard: [[
              { text: '🎵 Открыть MusicVerse', web_app: { url: BOT_CONFIG.miniAppUrl } }
            ]]
          });
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
