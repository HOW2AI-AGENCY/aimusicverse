/**
 * Callback Query Router
 * Routes callback queries to appropriate handlers by category
 */

import { answerCallbackQuery } from '../telegram-api.ts';
import { logger, checkRateLimit } from '../utils/index.ts';
import type { TelegramUpdate } from '../telegram-api.ts';

// Handler types
export type CallbackHandler = (
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
) => Promise<boolean>;

// Category handlers
import { handleQuickActionsCallbacks } from './quick-actions.ts';
import { handleWizardCallbacks } from './wizard.ts';
import { handleNavigationCallbacks } from './navigation.ts';
import { handleMediaCallbacks } from './media.ts';
import { handleProjectCallbacks } from './projects.ts';
import { handleArtistCallbacks } from './artists.ts';
import { handleAudioCallbacks } from './audio.ts';
import { handlePaymentCallbacks } from './payments.ts';
import { handleAnalyzeCallbacks } from './analyze.ts';
import { handleMidiCallbacks } from './midi.ts';
import { handleMiscCallbacks } from './misc.ts';

/**
 * Main callback query handler
 */
export async function handleCallbackQuery(
  callbackQuery: NonNullable<TelegramUpdate['callback_query']>
): Promise<void> {
  const { id, data, message, from } = callbackQuery;
  const chatId = message?.chat?.id;
  if (!chatId || !data) return;

  const messageId = message?.message_id ?? 0;

  // Rate limiting
  if (!checkRateLimit(from.id, 30, 60000)) {
    await answerCallbackQuery(id, '⏳ Слишком много запросов.');
    return;
  }

  logger.info('callback_query', { userId: from.id, data, chatId });

  try {
    // Try each category handler in order of priority
    const handlers: CallbackHandler[] = [
      handleQuickActionsCallbacks,
      handleWizardCallbacks,
      handleNavigationCallbacks,
      handleMediaCallbacks,
      handleProjectCallbacks,
      handleArtistCallbacks,
      handleAudioCallbacks,
      handlePaymentCallbacks,
      handleAnalyzeCallbacks,
      handleMidiCallbacks,
      handleMiscCallbacks,
    ];

    for (const handler of handlers) {
      const handled = await handler(data, chatId, from.id, messageId, id);
      if (handled) return;
    }

    // Fallback - answer callback to prevent loading indicator
    await answerCallbackQuery(id);
  } catch (error) {
    logger.error('Error handling callback', error);
    await answerCallbackQuery(id, '❌ Ошибка');
  }
}
