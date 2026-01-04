/**
 * Callback Query Router
 * Routes callback queries to appropriate handlers by category
 */

import { answerCallbackQuery } from '../telegram-api.ts';
import { logger, checkRateLimit } from '../utils/index.ts';
import { logBotAction } from '../utils/bot-logger.ts';
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
import { handleDynamicMenuCallback } from './dynamic-menu.ts';
import { handleMediaGroupCallbacks } from './media-group.ts';
import { handleUploadCallback, handleUploadCancel } from '../handlers/upload.ts';
import { handleTracksCallback } from '../handlers/tracks.ts';
import { handleProfileCallback } from '../handlers/profile.ts';
import { handleCloudCallback } from '../handlers/cloud.ts';
import { handleFeedbackCallback } from '../handlers/feedback.ts';

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

  const startTime = Date.now();
  
  try {
    // Handle dynamic menu callbacks first (menu_*)
    if (data.startsWith('menu_')) {
      const handled = await handleDynamicMenuCallback(data, chatId, from.id, messageId, id);
      if (handled) {
        await logBotAction(from.id, chatId, 'callback', { 
          data, 
          handler: 'dynamic_menu',
          response_time_ms: Date.now() - startTime 
        });
        return;
      }
    }
    
    // Handle media group callbacks (mg_*)
    if (data.startsWith('mg_')) {
      const handled = await handleMediaGroupCallbacks(data, chatId, from.id, messageId, id);
      if (handled) {
        await logBotAction(from.id, chatId, 'callback', { 
          data, 
          handler: 'media_group',
          response_time_ms: Date.now() - startTime 
        });
        return;
      }
    }
    
    // Handle section-specific callbacks
    if (data.startsWith('upload_')) {
      if (data === 'upload_cancel') {
        const handled = await handleUploadCancel(chatId, from.id, messageId, id);
        if (handled) return;
      }
      const handled = await handleUploadCallback(data, chatId, from.id, messageId, id);
      if (handled) return;
    }
    
    if (data.startsWith('tracks_')) {
      const handled = await handleTracksCallback(data, chatId, from.id, messageId, id);
      if (handled) return;
    }
    
    if (data.startsWith('profile_')) {
      const handled = await handleProfileCallback(data, chatId, from.id, messageId, id);
      if (handled) return;
    }
    
    if (data.startsWith('cloud_')) {
      const handled = await handleCloudCallback(data, chatId, from.id, messageId, id);
      if (handled) return;
    }
    
    if (data.startsWith('feedback_')) {
      const handled = await handleFeedbackCallback(data, chatId, from.id, messageId, id);
      if (handled) return;
    }
    
    // Handle tariff callbacks
    if (data.startsWith('tariff_')) {
      const { handleTariffCallback } = await import('../handlers/tariffs.ts');
      const handled = await handleTariffCallback(data, chatId, from.id, messageId, id);
      if (handled) return;
    }
    
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
