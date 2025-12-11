import { MESSAGES, BOT_CONFIG } from '../config.ts';
import { sendMessage, sendPhoto } from '../telegram-api.ts';
import { ButtonBuilder, webAppButton, addBackButton } from '../utils/button-builder.ts';
import { createWelcomeMessage, createLoadingMessage } from '../utils/message-formatter.ts';
import { trackMessage } from '../utils/message-manager.ts';

export async function handleStart(chatId: number, startParam?: string) {
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
  
  // Default start message with enhanced welcome
  const welcomeMsg = createWelcomeMessage();
  
  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Открыть студию',
      emoji: '🚀',
      action: { type: 'webapp', url: BOT_CONFIG.miniAppUrl }
    })
    .addRow(
      {
        text: 'Генератор',
        emoji: '🎼',
        action: { type: 'callback', data: 'nav_generate' }
      },
      {
        text: 'Библиотека',
        emoji: '📚',
        action: { type: 'callback', data: 'nav_library' }
      }
    )
    .addRow(
      {
        text: 'Анализ',
        emoji: '🔬',
        action: { type: 'callback', data: 'nav_analyze' }
      },
      {
        text: 'Проекты',
        emoji: '📁',
        action: { type: 'callback', data: 'nav_projects' }
      }
    )
    .addRow(
      {
        text: 'Настройки',
        emoji: '⚙️',
        action: { type: 'callback', data: 'nav_settings' }
      },
      {
        text: 'Помощь',
        emoji: 'ℹ️',
        action: { type: 'callback', data: 'nav_help' }
      }
    )
    .build();
  
  const result = await sendMessage(chatId, welcomeMsg, keyboard, 'MarkdownV2');
  
  if (result?.result?.message_id) {
    await trackMessage(chatId, result.result.message_id, 'menu', 'main_menu', { persistent: true });
  }
}
