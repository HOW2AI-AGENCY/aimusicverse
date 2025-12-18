/**
 * Handler for text messages that don't match commands
 * Uses AI intent recognition for smart responses
 */

import { sendMessage } from '../telegram-api.ts';
import { 
  getConversationContext, 
  getPendingUpload, 
  updatePendingUpload,
  setConversationContext 
} from '../core/session-store.ts';
import { BOT_CONFIG } from '../config.ts';
import { detectIntent, isMusicPrompt, type DetectedIntent } from '../utils/ai-intent.ts';
import { ButtonBuilder } from '../utils/button-builder.ts';

/**
 * Handle non-command text messages with AI intent recognition
 */
export async function handleTextMessage(
  chatId: number,
  userId: number,
  text: string
): Promise<boolean> {
  // Check if user has pending upload - might be providing description/style
  const pending = getPendingUpload(userId);
  const context = getConversationContext(userId);
  
  if (pending && context === 'awaiting_audio') {
    // User might be providing additional description for their upload
    if (text.length < 500 && !text.startsWith('/')) {
      // Store as prompt/style for the pending upload
      updatePendingUpload(userId, {
        prompt: pending.prompt ? `${pending.prompt} ${text}` : text,
      });
      
      const modeText = pending.mode === 'cover' ? 'кавера' : 
                       pending.mode === 'extend' ? 'расширения' : 
                       'загрузки';
      
      const displayText = text.length > 100 ? text.substring(0, 100) + '...' : text;
      
      await sendMessage(chatId, `✅ Описание добавлено для ${modeText}:\n"${displayText}"\n\nТеперь отправьте аудиофайл или голосовое сообщение.`, undefined, null);
      return true;
    }
  }
  
  // Use AI intent detection
  const intent = detectIntent(text);
  
  // High confidence intent - handle directly
  if (intent.confidence >= 0.5) {
    return await handleDetectedIntent(chatId, userId, text, intent);
  }
  
  // Check if it looks like a music generation prompt
  if (isMusicPrompt(text) && text.length >= 10) {
    return await suggestGeneration(chatId, text);
  }
  
  // Default response for unrecognized text
  return false;
}

/**
 * Handle detected intent with appropriate response
 */
async function handleDetectedIntent(
  chatId: number,
  userId: number,
  text: string,
  intent: DetectedIntent
): Promise<boolean> {
  const keyboard = new ButtonBuilder();
  
  switch (intent.type) {
    case 'generate_music':
      // If user provided a style, suggest quick generation
      if (intent.entities.style) {
        keyboard.addButton({
          text: `Создать ${intent.entities.style} трек`,
          emoji: '🎵',
          action: { type: 'callback', data: `quick_gen_${intent.entities.style}` }
        });
      }
      keyboard.addButton({
        text: 'Открыть генератор',
        emoji: '🎼',
        action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/generate` }
      });
      
      await sendMessage(chatId, `🎵 ${intent.suggestedResponse}`, keyboard.build(), null);
      return true;
      
    case 'greeting':
      keyboard.addButton({
        text: 'Создать трек',
        emoji: '🎵',
        action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/generate` }
      });
      keyboard.addButton({
        text: 'Открыть студию',
        emoji: '🚀',
        action: { type: 'webapp', url: BOT_CONFIG.miniAppUrl }
      });
      
      await sendMessage(chatId, `👋 Привет! Я MusicVerse Bot.\n\nЯ помогу создавать музыку с помощью AI. Выберите действие или напишите описание желаемого трека.`, keyboard.build(), null);
      return true;
      
    case 'view_library':
      keyboard.addButton({
        text: 'Мои треки',
        emoji: '📚',
        action: { type: 'callback', data: 'nav_library' }
      });
      await sendMessage(chatId, `📚 ${intent.suggestedResponse}`, keyboard.build(), null);
      return true;
      
    case 'check_status':
      keyboard.addButton({
        text: 'Проверить статус',
        emoji: '⏳',
        action: { type: 'callback', data: 'check_status' }
      });
      await sendMessage(chatId, `⏳ ${intent.suggestedResponse}`, keyboard.build(), null);
      return true;
      
    case 'upload_audio':
      keyboard.addButton({
        text: 'Загрузить аудио',
        emoji: '📤',
        action: { type: 'callback', data: 'start_upload' }
      });
      await sendMessage(chatId, `📤 ${intent.suggestedResponse}`, keyboard.build(), null);
      return true;
      
    case 'create_cover':
      keyboard.addButton({
        text: 'Создать кавер',
        emoji: '🎤',
        action: { type: 'callback', data: 'start_cover' }
      });
      await sendMessage(chatId, `🎤 ${intent.suggestedResponse}`, keyboard.build(), null);
      return true;
      
    case 'extend_track':
      keyboard.addButton({
        text: 'Расширить трек',
        emoji: '➕',
        action: { type: 'callback', data: 'start_extend' }
      });
      await sendMessage(chatId, `➕ ${intent.suggestedResponse}`, keyboard.build(), null);
      return true;
      
    case 'view_profile':
      keyboard.addButton({
        text: 'Мой профиль',
        emoji: '👤',
        action: { type: 'callback', data: 'nav_profile' }
      });
      await sendMessage(chatId, `👤 ${intent.suggestedResponse}`, keyboard.build(), null);
      return true;
      
    case 'buy_credits':
      keyboard.addButton({
        text: 'Купить кредиты',
        emoji: '💎',
        action: { type: 'callback', data: 'buy_credits' }
      });
      await sendMessage(chatId, `💎 ${intent.suggestedResponse}`, keyboard.build(), null);
      return true;
      
    case 'analyze_audio':
      keyboard.addButton({
        text: 'Анализ аудио',
        emoji: '🔬',
        action: { type: 'callback', data: 'nav_analyze' }
      });
      await sendMessage(chatId, `🔬 ${intent.suggestedResponse}`, keyboard.build(), null);
      return true;
      
    case 'midi_convert':
      keyboard.addButton({
        text: 'Конвертировать в MIDI',
        emoji: '🎹',
        action: { type: 'callback', data: 'start_midi' }
      });
      await sendMessage(chatId, `🎹 ${intent.suggestedResponse}`, keyboard.build(), null);
      return true;
      
    case 'recognize_song':
      keyboard.addButton({
        text: 'Распознать песню',
        emoji: '🔍',
        action: { type: 'callback', data: 'start_recognize' }
      });
      await sendMessage(chatId, `🔍 ${intent.suggestedResponse}`, keyboard.build(), null);
      return true;
      
    case 'get_help':
      keyboard.addButton({
        text: 'Справка',
        emoji: 'ℹ️',
        action: { type: 'callback', data: 'nav_help' }
      });
      await sendMessage(chatId, `ℹ️ ${intent.suggestedResponse}`, keyboard.build(), null);
      return true;
      
    default:
      return false;
  }
}

/**
 * Suggest generation when text looks like a music prompt
 */
async function suggestGeneration(chatId: number, text: string): Promise<boolean> {
  const truncated = text.length > 50 ? text.substring(0, 50) + '...' : text;
  
  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Генерировать этот трек',
      emoji: '🎵',
      action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/generate?prompt=${encodeURIComponent(text)}` }
    })
    .addButton({
      text: 'Изменить описание',
      emoji: '✏️',
      action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/generate` }
    })
    .build();
  
  await sendMessage(
    chatId, 
    `🎵 Похоже на описание трека!\n\n"${truncated}"\n\nХотите сгенерировать музыку по этому описанию?`,
    keyboard,
    null
  );
  
  return true;
}

/**
 * Send default help response for unrecognized messages
 */
export async function sendDefaultResponse(chatId: number): Promise<void> {
  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Создать трек',
      emoji: '🎵',
      action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/generate` }
    })
    .addRow(
      {
        text: 'Быстрые действия',
        emoji: '⚡',
        action: { type: 'callback', data: 'quick_actions' }
      },
      {
        text: 'Справка',
        emoji: 'ℹ️',
        action: { type: 'callback', data: 'nav_help' }
      }
    )
    .build();

  await sendMessage(chatId, `🤔 Не совсем понял. Вот что я умею:

🎵 *Создание музыки* — опишите трек или используйте /generate
📤 *Загрузка аудио* — /upload, /cover, /extend
📚 *Библиотека* — /library
🔬 *Анализ* — /analyze, /midi, /recognize

Или просто опишите желаемую музыку!`, keyboard, null);
}
