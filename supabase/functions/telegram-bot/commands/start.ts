import { MESSAGES, BOT_CONFIG } from '../config.ts';
import { createMainMenuKeyboard } from '../keyboards/main-menu.ts';
import { sendMessage } from '../telegram-api.ts';

export async function handleStart(chatId: number, startParam?: string) {
  // Handle deep links
  if (startParam) {
    if (startParam.startsWith('track_')) {
      const trackId = startParam.replace('track_', '');
      await sendMessage(
        chatId,
        '🎵 *Открываем трек...*\n\nЗагрузка...',
        {
          inline_keyboard: [
            [{ text: '🎵 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=track_${trackId}` } }],
            [{ text: '⬅️ Главное меню', callback_data: 'main_menu' }]
          ]
        }
      );
      return;
    }
    
    if (startParam.startsWith('project_')) {
      const projectId = startParam.replace('project_', '');
      await sendMessage(
        chatId,
        '📁 *Открываем проект...*\n\nЗагрузка...',
        {
          inline_keyboard: [
            [{ text: '📁 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=project_${projectId}` } }],
            [{ text: '⬅️ Главное меню', callback_data: 'main_menu' }]
          ]
        }
      );
      return;
    }
    
    if (startParam.startsWith('generate_')) {
      const style = startParam.replace('generate_', '');
      await sendMessage(
        chatId,
        `🎼 *Быстрая генерация*\n\nСтиль: ${style}\n\nОтправьте описание трека или используйте:\n/generate ваше описание`,
        createMainMenuKeyboard()
      );
      return;
    }
  }
  
  // Default start message with rich formatting
  await sendMessage(chatId, MESSAGES.welcome, createMainMenuKeyboard());
}
