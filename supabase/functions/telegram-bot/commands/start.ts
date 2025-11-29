import { MESSAGES } from '../config.ts';
import { createMainMenuKeyboard } from '../keyboards/main-menu.ts';
import { sendMessage } from '../telegram-api.ts';

export async function handleStart(chatId: number, startParam?: string) {
  // Handle deep links
  if (startParam) {
    if (startParam.startsWith('track_')) {
      await sendMessage(
        chatId,
        '🎵 Открываем трек...',
        createMainMenuKeyboard()
      );
      return;
    }
    
    if (startParam.startsWith('project_')) {
      await sendMessage(
        chatId,
        '📁 Открываем проект...',
        createMainMenuKeyboard()
      );
      return;
    }
    
    if (startParam.startsWith('generate_')) {
      const style = startParam.replace('generate_', '');
      await sendMessage(
        chatId,
        `🎼 Создаем трек в стиле ${style}...\n\nИспользуйте /generate <описание>`,
        createMainMenuKeyboard()
      );
      return;
    }
  }
  
  // Default start message
  await sendMessage(chatId, MESSAGES.welcome, createMainMenuKeyboard());
}
