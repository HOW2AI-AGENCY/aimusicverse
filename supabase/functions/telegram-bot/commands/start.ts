import { MESSAGES, BOT_CONFIG } from '../config.ts';
import { sendMessage, sendPhoto } from '../telegram-api.ts';
import { ButtonBuilder, webAppButton, addBackButton } from '../utils/button-builder.ts';
import { createWelcomeMessage, createLoadingMessage } from '../utils/message-formatter.ts';
import { trackMessage } from '../utils/message-manager.ts';
import { getMenuImageAsync } from '../keyboards/menu-images.ts';
import { checkIfNewUser, startOnboarding } from '../handlers/onboarding.ts';
import { handleDashboard } from '../handlers/dashboard.ts';

export async function handleStart(chatId: number, userId: number, startParam?: string) {
  // Handle deep links
  if (startParam) {
    if (startParam.startsWith('track_')) {
      const trackId = startParam.replace('track_', '');
      
      const keyboard = new ButtonBuilder()
        .addButton({
          text: 'Открыть в приложении',
          emoji: '🎵',
          action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}?startapp=track_${trackId}` }
        })
        .addButton({
          text: 'Главное меню',
          emoji: '🏠',
          action: { type: 'callback', data: 'nav_main' }
        })
        .build();
      
      const message = createLoadingMessage('Открываем трек');
      const result = await sendMessage(chatId, message, keyboard, 'MarkdownV2');
      
      if (result?.result?.message_id) {
        await trackMessage(chatId, result.result.message_id, 'temp', 'temp', { expiresIn: 30000 });
      }
      return;
    }
    
    if (startParam.startsWith('project_')) {
      const projectId = startParam.replace('project_', '');
      
      const keyboard = new ButtonBuilder()
        .addButton({
          text: 'Открыть в приложении',
          emoji: '📁',
          action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}?startapp=project_${projectId}` }
        })
        .addButton({
          text: 'Главное меню',
          emoji: '🏠',
          action: { type: 'callback', data: 'nav_main' }
        })
        .build();
      
      const message = createLoadingMessage('Открываем проект');
      const result = await sendMessage(chatId, message, keyboard, 'MarkdownV2');
      
      if (result?.result?.message_id) {
        await trackMessage(chatId, result.result.message_id, 'temp', 'temp', { expiresIn: 30000 });
      }
      return;
    }
    
    if (startParam.startsWith('generate_')) {
      const style = startParam.replace('generate_', '');
      
      const keyboard = new ButtonBuilder()
        .addButton({
          text: 'Открыть генератор',
          emoji: '🎼',
          action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/generate` }
        })
        .addButton({
          text: 'Главное меню',
          emoji: '🏠',
          action: { type: 'callback', data: 'nav_main' }
        })
        .build();
      
      const message = createLoadingMessage(`Быстрая генерация: ${style}`);
      await sendMessage(chatId, message, keyboard, 'MarkdownV2');
      return;
    }
  }
  
  // Check if user needs onboarding
  const isNewUser = await checkIfNewUser(userId);
  
  if (isNewUser) {
    // Start onboarding for new users
    await startOnboarding(chatId, userId);
  } else {
    // Show personalized dashboard for returning users
    await handleDashboard(chatId, userId);
  }
}
