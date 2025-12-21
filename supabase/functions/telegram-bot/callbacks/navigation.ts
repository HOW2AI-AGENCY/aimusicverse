/**
 * Navigation Callback Handlers
 */

import { answerCallbackQuery, sendMessage, editMessageText } from '../telegram-api.ts';
import { escapeMarkdownV2 } from '../utils/text-processor.ts';

export async function handleNavigationCallbacks(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  // Navigation handlers
  if (data.startsWith('nav_') || data.startsWith('lib_page_') || data.startsWith('project_page_')) {
    // Skip nav_artists (handled by artists), nav_projects (handled by projects)
    if (data.startsWith('nav_artists') || data.startsWith('nav_projects')) {
      return false;
    }
    
    const { handleNavigationCallback } = await import('../handlers/navigation.ts');
    await handleNavigationCallback(data, chatId, userId, messageId, queryId);
    return true;
  }

  // Profile navigation
  if (data.startsWith('nav_profile') || data.startsWith('nav_balance') || 
      data.startsWith('nav_achievements') || data.startsWith('nav_leaderboard') || 
      data.startsWith('nav_transactions')) {
    const { handleProfileCallback } = await import('../handlers/profile.ts');
    const handled = await handleProfileCallback(data, chatId, userId, messageId, queryId);
    return handled;
  }

  // Main menu navigation
  if (data === 'main_menu' || data === 'open_main_menu') {
    if (data === 'open_main_menu') {
      const { deleteAndSendNewMenu } = await import('../core/active-menu-manager.ts');
      const { createMainMenuKeyboard } = await import('../keyboards/main-menu.ts');
      const { MESSAGES } = await import('../config.ts');
      await deleteAndSendNewMenu(chatId, userId, MESSAGES.welcome, createMainMenuKeyboard(), 'main_menu', 'MarkdownV2');
    } else {
      const { handleNavigationMain } = await import('../handlers/navigation.ts');
      await handleNavigationMain(chatId, messageId, userId);
    }
    await answerCallbackQuery(queryId);
    return true;
  }

  // Help
  if (data === 'help') {
    const { MESSAGES } = await import('../config.ts');
    const { createMainMenuKeyboard } = await import('../keyboards/main-menu.ts');
    await sendMessage(chatId, MESSAGES.help, createMainMenuKeyboard(), 'MarkdownV2');
    await answerCallbackQuery(queryId);
    return true;
  }

  // Generate navigation
  if (data === 'generate') {
    const { handleNavigationGenerate } = await import('../handlers/navigation.ts');
    await handleNavigationGenerate(chatId, userId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  // Status
  if (data === 'status') {
    const { handleStatus } = await import('../commands/status.ts');
    await handleStatus(chatId, userId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  // Library
  if (data === 'library') {
    const { handleLibrary } = await import('../commands/library.ts');
    await handleLibrary(chatId, userId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  // Projects
  if (data === 'projects') {
    const { handleProjects } = await import('../commands/projects.ts');
    await handleProjects(chatId, userId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  // Settings (handle both private and group chats)
  if (data === 'settings') {
    const { BOT_CONFIG } = await import('../config.ts');
    await editMessageText(chatId, messageId, '⚙️ *Настройки*\n\nНастройки доступны в приложении:', {
      inline_keyboard: [
        [{ text: '📱 Открыть настройки', web_app: { url: `${BOT_CONFIG.miniAppUrl}/settings` } }],
        [{ text: '🔙 Назад', callback_data: 'main_menu' }]
      ]
    });
    await answerCallbackQuery(queryId);
    return true;
  }

  // About/News/Legal
  if (data === 'about') {
    const { handleAbout } = await import('../commands/legal.ts');
    await handleAbout(chatId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  if (data === 'news') {
    const { handleNews } = await import('../commands/news.ts');
    await handleNews(chatId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  if (data === 'legal_terms') {
    const { handleTerms } = await import('../commands/legal.ts');
    await handleTerms(chatId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  if (data === 'legal_privacy') {
    const { handlePrivacy } = await import('../commands/legal.ts');
    await handlePrivacy(chatId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  // Style selection
  if (data.startsWith('style_')) {
    const style = data.replace('style_', '');
    const styleNames: Record<string, string> = {
      rock: 'рок', pop: 'поп', jazz: 'джаз',
      electronic: 'электроника', classical: 'классика', hiphop: 'хип-хоп'
    };
    await sendMessage(chatId, `🎵 *Стиль: ${escapeMarkdownV2(styleNames[style] || style)}*\n\nТеперь отправьте описание трека:\n\nНапример:\n"Энергичный трек с гитарными риффами и мощным барабанным битом"`, undefined, 'MarkdownV2');
    await answerCallbackQuery(queryId);
    return true;
  }

  if (data === 'custom_generate') {
    await sendMessage(chatId, '✍️ *Своё описание*\n\nОпишите какую музыку вы хотите создать:\n\nИспользуйте /generate \\<ваше описание\\>', undefined, 'MarkdownV2');
    await answerCallbackQuery(queryId);
    return true;
  }

  return false;
}
