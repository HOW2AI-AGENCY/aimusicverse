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
import { BOT_CONFIG } from '../config.ts';

/**
 * Handle non-command text messages
 */
export async function handleTextMessage(
  chatId: number,
  userId: number,
  text: string
): Promise<boolean> {
  // Check if user is in feedback session
  const { isInFeedbackSession, handleFeedbackMessage } = await import('../commands/feedback.ts');
  if (isInFeedbackSession(chatId)) {
    return await handleFeedbackMessage(chatId, userId, text);
  }
  
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
  
  // Detect common intents from text
  const lowerText = text.toLowerCase();
  
  // Music generation intent
  if (containsAny(lowerText, ['создай', 'сгенерируй', 'сделай музыку', 'создать трек', 'хочу песню', 'напиши песню'])) {
    await sendMessage(chatId, `🎵 Хотите создать музыку?\n\nИспользуйте команду /generate с описанием:\n/generate энергичный рок с гитарами\n\nИли откройте приложение для удобного создания:`, {
      inline_keyboard: [[
        { text: '🎵 Создать в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}` } }
      ]]
    }, null);
    return true;
  }
  
  // Upload intent
  if (containsAny(lowerText, ['загрузить', 'отправить файл', 'upload', 'залить'])) {
    await sendMessage(chatId, `☁️ Загрузка аудио\n\nИспользуйте /upload чтобы загрузить аудио в облако.\n\nПосле загрузки файл можно использовать:\n• Как референс для генерации\n• Для анализа музыки\n• В Stem Studio`, undefined, null);
    return true;
  }
  
  // Cover/remix intent
  if (containsAny(lowerText, ['кавер', 'cover', 'ремикс', 'remix', 'переделать'])) {
    await sendMessage(chatId, `🎤 Создание кавера\n\nИспользуйте команду /cover и отправьте аудиофайл.\n\nИли выберите из ранее загруженных:\n/uploads - показать мои файлы`, undefined, null);
    return true;
  }
  
  // Extension intent
  if (containsAny(lowerText, ['продолжи', 'расширь', 'extend', 'продолжение'])) {
    await sendMessage(chatId, `🔄 Расширение трека\n\nИспользуйте команду /extend и отправьте аудиофайл.\n\nБот продолжит и расширит вашу композицию.`, undefined, null);
    return true;
  }
  
  // Library intent
  if (containsAny(lowerText, ['мои треки', 'библиотека', 'library', 'мои песни'])) {
    await sendMessage(chatId, `📚 Используйте /library чтобы посмотреть ваши треки.`, undefined, null);
    return true;
  }
  
  // Help intent
  if (containsAny(lowerText, ['помощь', 'help', 'что умеешь', 'команды', 'как пользоваться'])) {
    await sendMessage(chatId, `Используйте /help для списка всех команд.`, undefined, null);
    return true;
  }
  
  // Greeting
  if (containsAny(lowerText, ['привет', 'здравствуй', 'hello', 'hi ', 'хай', 'добрый'])) {
    await sendMessage(chatId, `👋 Привет! Я MusicVerse Bot.\n\nЯ помогу вам создавать музыку с помощью ИИ:\n\n• /generate - создать новый трек\n• /library - ваши треки\n• /upload - загрузить аудио\n• /cover - создать кавер\n• /help - все команды\n\nИли откройте полное приложение:`, {
      inline_keyboard: [[
        { text: '🎵 Открыть MusicVerse', web_app: { url: BOT_CONFIG.miniAppUrl } }
      ]]
    }, null);
    return true;
  }
  
  // Status/progress intent
  if (containsAny(lowerText, ['статус', 'готово', 'progress', 'где мой трек', 'когда будет'])) {
    await sendMessage(chatId, `Используйте /status чтобы проверить статус генерации.`, undefined, null);
    return true;
  }
  
  // Default response for unrecognized text
  return false;
}

/**
 * Send default help response for unrecognized messages
 */
export async function sendDefaultResponse(chatId: number): Promise<void> {
  await sendMessage(chatId, `🤔 Не совсем понял. Вот что я умею:

🎵 Создание музыки:
• /generate - создать трек по описанию
• /cover - создать кавер-версию
• /extend - расширить трек

☁️ Работа с файлами:
• /upload - загрузить аудио в облако
• /uploads - мои загруженные файлы

📚 Библиотека:
• /library - ваши треки
• /status - статус генерации

🔍 Анализ:
• /recognize - распознать песню
• /midi - конвертировать в MIDI

Используйте /help для полного списка.`, {
    inline_keyboard: [[
      { text: '📱 Открыть приложение', web_app: { url: BOT_CONFIG.miniAppUrl } }
    ]]
  }, null);
}

/**
 * Check if text contains any of the phrases
 */
function containsAny(text: string, phrases: string[]): boolean {
  return phrases.some(phrase => text.includes(phrase));
}
