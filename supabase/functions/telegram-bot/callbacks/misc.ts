/**
 * Miscellaneous Callback Handlers
 * Catch-all for callbacks not handled by other specialized handlers
 */

import { answerCallbackQuery } from '../telegram-api.ts';

export async function handleMiscCallbacks(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  // This is the fallback handler - it should handle any remaining callbacks
  // that weren't caught by more specific handlers
  
  // For now, just answer the callback to prevent loading indicator
  // This prevents "callback query is not answered" errors
  await answerCallbackQuery(queryId);
  return true;
}
