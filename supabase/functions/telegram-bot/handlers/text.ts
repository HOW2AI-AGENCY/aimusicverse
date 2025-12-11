/**
 * Handler for text messages that don't match commands
 * Provides helpful responses based on context
 */

import { sendMessage } from '../telegram-api.ts';
import { 
  getConversationContext, 
  getPendingUpload, 
  updatePendingUpload,
  setConversationContext 
} from '../core/session-store.ts';
import { escapeMarkdown } from '../utils/index.ts';
import { BOT_CONFIG } from '../config.ts';

/**
 * Handle non-command text messages
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
      
      await sendMessage(chatId, `✅ Описание добавлено для ${modeText}:
_"${escapeMarkdown(text.substring(0, 100))}${text.length > 100 ? '...' : ''}"_

Теперь отправьте аудиофайл или голосовое сообщение\\.`);
      return true;
    }
  }
  
  // Detect common intents from text
  const lowerText = text.toLowerCase();
  
  // Music generation intent
  if (containsAny(lowerText, ['создай', 'сгенерируй', 'сделай музыку', 'создать трек', 'хочу песню', 'напиши песню'])) {
    await sendMessage(chatId, `🎵 *Хотите создать музыку?*

Используйте команду /generate с описанием:
\`/generate энергичный рок с гитарами\`

Или откройте приложение для удобного создания:`, {
      inline_keyboard: [[
        { text: '🎵 Создать в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}` } }
      ]]
    });
    return true;
  }
  
  // Upload intent
  if (containsAny(lowerText, ['загрузить', 'отправить файл', 'upload', 'залить'])) {
    await sendMessage(chatId, `☁️ *Загрузка аудио*

Используйте /upload чтобы загрузить аудио в облако\\.

После загрузки файл можно использовать:
• Как референс для генерации
• Для анализа музыки  
• В Stem Studio`);
    return true;
  }
  
  // Cover/remix intent
  if (containsAny(lowerText, ['кавер', 'cover', 'ремикс', 'remix', 'переделать'])) {
    await sendMessage(chatId, `🎤 *Создание кавера*

Используйте команду /cover и отправьте аудиофайл\\.

Или выберите из ранее загруженных:
/uploads \\- показать мои файлы`);
    return true;
  }
  
  // Extension intent
  if (containsAny(lowerText, ['продолжи', 'расширь', 'extend', 'продолжение'])) {
    await sendMessage(chatId, `🔄 *Расширение трека*

Используйте команду /extend и отправьте аудиофайл\\.

Бот продолжит и расширит вашу композицию\\.`);
    return true;
  }
  
  // Library intent
  if (containsAny(lowerText, ['мои треки', 'библиотека', 'library', 'мои песни'])) {
    await sendMessage(chatId, `📚 Используйте /library чтобы посмотреть ваши треки\\.`);
    return true;
  }
  
  // Help intent
  if (containsAny(lowerText, ['помощь', 'help', 'что умеешь', 'команды', 'как пользоваться'])) {
    await sendMessage(chatId, `Используйте /help для списка всех команд\\.`);
    return true;
  }
  
  // Greeting
  if (containsAny(lowerText, ['привет', 'здравствуй', 'hello', 'hi ', 'хай', 'добрый'])) {
    await sendMessage(chatId, `👋 Привет\\! Я MusicVerse Bot\\.

Я помогу вам создавать музыку с помощью ИИ:

• /generate \\- создать новый трек
• /library \\- ваши треки
• /upload \\- загрузить аудио
• /cover \\- создать кавер
• /help \\- все команды

Или откройте полное приложение:`, {
      inline_keyboard: [[
        { text: '🎵 Открыть MusicVerse', web_app: { url: BOT_CONFIG.miniAppUrl } }
      ]]
    });
    return true;
  }
  
  // Status/progress intent
  if (containsAny(lowerText, ['статус', 'готово', 'progress', 'где мой трек', 'когда будет'])) {
    await sendMessage(chatId, `Используйте /status чтобы проверить статус генерации\\.`);
    return true;
  }
  
  // Default response for unrecognized text
  return false;
}

/**
 * Send default help response for unrecognized messages
 */
export async function sendDefaultResponse(chatId: number): Promise<void> {
  await sendMessage(chatId, `🤔 Не совсем понял\\. Вот что я умею:

🎵 *Создание музыки:*
• /generate \\- создать трек по описанию
• /cover \\- создать кавер\\-версию
• /extend \\- расширить трек

☁️ *Работа с файлами:*
• /upload \\- загрузить аудио в облако
• /uploads \\- мои загруженные файлы

📚 *Библиотека:*
• /library \\- ваши треки
• /status \\- статус генерации

🔍 *Анализ:*
• /recognize \\- распознать песню
• /midi \\- конвертировать в MIDI

Используйте /help для полного списка\\.`, {
    inline_keyboard: [[
      { text: '📱 Открыть приложение', web_app: { url: BOT_CONFIG.miniAppUrl } }
    ]]
  });
}

/**
 * Check if text contains any of the phrases
 */
function containsAny(text: string, phrases: string[]): boolean {
  return phrases.some(phrase => text.includes(phrase));
}
