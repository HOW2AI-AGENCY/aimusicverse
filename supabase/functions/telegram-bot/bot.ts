import { handleStart } from './commands/start.ts';
import { handleHelp } from './commands/help.ts';
import { handleGenerate } from './commands/generate.ts';
import { handleLibrary } from './commands/library.ts';
import { handleProjects } from './commands/projects.ts';
import { handleStatus } from './commands/status.ts';
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
        const { createGenerateKeyboard } = await import('./keyboards/main-menu.ts');
        await sendMessage(
          chatId, 
          '🎼 *Создание трека*\n\nВыберите стиль музыки или опишите свой:',
          createGenerateKeyboard()
        );
      } else if (data === 'status') {
        await handleStatus(chatId, from.id);
      } else if (data === 'main_menu') {
        const { createMainMenuKeyboard } = await import('./keyboards/main-menu.ts');
        await sendMessage(chatId, '🏠 *Главное меню*\n\nВыберите действие:', createMainMenuKeyboard());
      } else if (data && data.startsWith('style_')) {
        const style = data.replace('style_', '');
        const styleNames: Record<string, string> = {
          rock: 'рок',
          pop: 'поп',
          jazz: 'джаз',
          electronic: 'электроника',
          classical: 'классика',
          hiphop: 'хип-хоп'
        };
        await sendMessage(
          chatId,
          `🎵 *Стиль: ${styleNames[style] || style}*\n\nТеперь отправьте описание трека:\n\nНапример:\n"Энергичный трек с гитарными риффами и мощным барабанным битом"`
        );
      } else if (data === 'custom_generate') {
        await sendMessage(
          chatId,
          '✍️ *Своё описание*\n\nОпишите какую музыку вы хотите создать:\n\nИспользуйте /generate <ваше описание>'
        );
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
