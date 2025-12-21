/**
 * Main Telegram bot handler with dynamic imports for reduced bundle size
 */

import { sendMessage, parseCommand, type TelegramUpdate } from './telegram-api.ts';
import { BOT_CONFIG } from './config.ts';
import { logger, checkRateLimit, trackMetric } from './utils/index.ts';
import { handleCallbackQuery } from './callbacks/router.ts';

export async function handleUpdate(update: TelegramUpdate) {
  const startTime = Date.now();
  
  try {
    // Handle pre-checkout query (payment validation)
    if (update.pre_checkout_query) {
      const { handlePreCheckoutQuery } = await import('./handlers/payment.ts');
      await handlePreCheckoutQuery(update.pre_checkout_query);
      return;
    }

    // Handle inline queries for sharing tracks (enhanced with public content)
    if (update.inline_query) {
      const { handleInlineQuery } = await import('./commands/inline-enhanced.ts');
      await handleInlineQuery(update.inline_query);
      return;
    }

    // Handle callback queries from inline buttons - delegated to callback router
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return;
    }

    // Handle message updates
    const message = update.message;
    if (!message) return;

    const { chat, from, text } = message;
    if (!from) return;

    // Rate limiting
    if (!checkRateLimit(from.id, 20, 60000)) {
      await sendMessage(chat.id, '⏳ Слишком много запросов. Подождите немного.', undefined, null);
      trackMetric({
        eventType: 'rate_limited',
        success: false,
        telegramChatId: chat.id,
        metadata: { type: 'message' },
      });
      return;
    }

    logger.info('message', { userId: from.id, chatId: chat.id, text: text?.substring(0, 50) });

    // Handle successful payment
    if (message.successful_payment) {
      const { handleSuccessfulPayment } = await import('./handlers/payment.ts');
      await handleSuccessfulPayment(chat.id, from.id, message.successful_payment);
      return;
    }

    // Handle audio messages
    const { isAudioMessage, handleAudioMessage } = await import('./handlers/audio.ts');
    if (isAudioMessage(message)) {
      const audio = message.audio || message.voice || message.document;
      const type = message.audio ? 'audio' : message.voice ? 'voice' : 'document';
      await handleAudioMessage(chat.id, from.id, audio as any, type);
      return;
    }

    // Handle text messages
    if (!text) return;

    // Parse command
    const cmd = parseCommand(text);

    // Handle non-command text
    if (!cmd) {
      // Check for active project wizard first
      const { hasActiveWizard, handleWizardTextInput } = await import('./wizards/project-wizard.ts');
      if (hasActiveWizard(from.id)) {
        const handled = await handleWizardTextInput(chat.id, from.id, text);
        if (handled) return;
      }
      
      const { handleTextMessage, sendDefaultResponse } = await import('./handlers/text.ts');
      const handled = await handleTextMessage(chat.id, from.id, text);
      if (!handled) {
        await sendDefaultResponse(chat.id);
      }
      return;
    }

    // Handle commands
    await handleCommand(cmd.command, cmd.args, chat.id, from.id);

    trackMetric({
      eventType: 'message_sent',
      success: true,
      telegramChatId: chat.id,
      responseTimeMs: Date.now() - startTime,
      metadata: { command: cmd.command },
    });

  } catch (error) {
    logger.error('Error handling update', error);
    trackMetric({
      eventType: 'message_failed',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle command messages
 */
async function handleCommand(command: string, args: string, chatId: number, userId: number) {
  switch (command) {
    case 'start': {
      const { handleStart } = await import('./commands/start.ts');
      await handleStart(chatId, userId, args || undefined);
      break;
    }
    case 'help': {
      const { handleHelp } = await import('./commands/help.ts');
      await handleHelp(chatId);
      break;
    }
    case 'app': {
      const { handleApp } = await import('./commands/app.ts');
      await handleApp(chatId);
      break;
    }
    case 'generate': {
      const { handleGenerate } = await import('./commands/generate.ts');
      await handleGenerate(chatId, userId, args);
      break;
    }
    case 'library': {
      const { handleLibrary } = await import('./commands/library.ts');
      await handleLibrary(chatId, userId);
      break;
    }
    case 'projects': {
      const { handleProjects } = await import('./commands/projects.ts');
      await handleProjects(chatId, userId);
      break;
    }
    case 'status': {
      const { handleStatus } = await import('./commands/status.ts');
      await handleStatus(chatId, userId);
      break;
    }
    case 'cover': {
      const { handleCoverCommand } = await import('./commands/audio-upload.ts');
      await handleCoverCommand(chatId, userId, args);
      break;
    }
    case 'extend': {
      const { handleExtendCommand } = await import('./commands/audio-upload.ts');
      await handleExtendCommand(chatId, userId, args);
      break;
    }
    case 'cancel': {
      const { handleCancelCommand } = await import('./commands/audio-upload.ts');
      await handleCancelCommand(chatId, userId);
      break;
    }
    case 'upload': {
      const { handleUploadCommand } = await import('./commands/upload.ts');
      await handleUploadCommand(chatId, userId, args);
      break;
    }
    case 'uploads': {
      const { handleMyUploads } = await import('./commands/upload.ts');
      await handleMyUploads(chatId, userId);
      break;
    }
    case 'recognize': {
      const { handleRecognizeCommand } = await import('./commands/recognize.ts');
      await handleRecognizeCommand(chatId, userId);
      break;
    }
    case 'midi': {
      const { handleMidiCommand } = await import('./commands/midi.ts');
      await handleMidiCommand(chatId, userId);
      break;
    }
    case 'piano': {
      const { handlePianoCommand } = await import('./commands/midi.ts');
      await handlePianoCommand(chatId, userId);
      break;
    }
    case 'guitar': {
      const { handleGuitarCommand } = await import('./commands/guitar.ts');
      await handleGuitarCommand(chatId, userId);
      break;
    }
    case 'analyze': {
      const { handleAnalyzeCommand } = await import('./commands/analyze.ts');
      await handleAnalyzeCommand(chatId, userId, args);
      break;
    }
    case 'buy': {
      const { handleBuyCommand } = await import('./handlers/payment.ts');
      await handleBuyCommand(chatId);
      break;
    }
    case 'terms': {
      const { handleTerms } = await import('./commands/legal.ts');
      await handleTerms(chatId);
      break;
    }
    case 'privacy': {
      const { handlePrivacy } = await import('./commands/legal.ts');
      await handlePrivacy(chatId);
      break;
    }
    case 'news': {
      const { handleNews } = await import('./commands/news.ts');
      await handleNews(chatId);
      break;
    }
    case 'channel': {
      const { handleChannel } = await import('./commands/channel.ts');
      await handleChannel(chatId);
      break;
    }
    default:
      await sendMessage(chatId, '❓ Неизвестная команда. Используйте /help для списка команд.', undefined, null);
  }
}

// Callback handling is now delegated to callbacks/router.ts
