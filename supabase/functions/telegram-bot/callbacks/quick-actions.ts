/**
 * Quick Actions Callback Handlers
 */

import { answerCallbackQuery } from '../telegram-api.ts';

export async function handleQuickActionsCallbacks(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  if (data === 'quick_actions' || data.startsWith('quick_gen_') || 
      data.startsWith('confirm_quick_gen_') || data === 'start_cover' || 
      data === 'start_extend' || data === 'start_upload' || data === 'check_status') {
    const { handleQuickActionsCallback } = await import('../handlers/quick-actions.ts');
    await handleQuickActionsCallback(data, chatId, userId, messageId, queryId);
    return true;
  }

  if (data === 'dashboard' || data === 'nav_dashboard') {
    const { handleDashboard } = await import('../handlers/dashboard.ts');
    await handleDashboard(chatId, userId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  if (data.startsWith('deeplink_')) {
    const tool = data.replace('deeplink_', '');
    const { handleDeepLink } = await import('../handlers/deep-links.ts');
    await handleDeepLink(chatId, userId, tool);
    await answerCallbackQuery(queryId);
    return true;
  }

  return false;
}
