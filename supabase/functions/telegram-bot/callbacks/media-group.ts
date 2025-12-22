/**
 * Media Group Callback Handler
 * Handles callbacks for batch media group operations
 */

import { answerCallbackQuery, sendMessage, editMessageText } from '../telegram-api.ts';
import { 
  processMediaGroupAction, 
  clearMediaGroupSession,
  getMediaGroupFiles 
} from '../handlers/media-group.ts';
import { logBotAction } from '../utils/bot-logger.ts';
import { logger } from '../utils/index.ts';

/**
 * Handle media group callbacks (mg_*)
 */
export async function handleMediaGroupCallbacks(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  if (!data.startsWith('mg_')) {
    return false;
  }
  
  const action = data.replace('mg_', '');
  
  try {
    switch (action) {
      case 'upload_all':
        await answerCallbackQuery(queryId, '☁️ Загрузка началась...');
        await editMessageText(chatId, messageId, '⏳ *Загружаю файлы в облако\\.\\.\\.*');
        await processMediaGroupAction(chatId, userId, 'upload', messageId);
        return true;
        
      case 'analyze_all':
        await answerCallbackQuery(queryId, '🔬 Анализ начался...');
        await editMessageText(chatId, messageId, '⏳ *Анализирую файлы\\.\\.\\.*');
        await processMediaGroupAction(chatId, userId, 'analyze', messageId);
        return true;
        
      case 'cover_all':
        await answerCallbackQuery(queryId, '🎤 Создание каверов...');
        await editMessageText(chatId, messageId, '⏳ *Создаю каверы\\.\\.\\.*\n\nЭто может занять несколько минут\\.');
        await processMediaGroupAction(chatId, userId, 'cover', messageId);
        return true;
        
      case 'extend_all':
        await answerCallbackQuery(queryId, '➕ Расширение треков...');
        await editMessageText(chatId, messageId, '⏳ *Расширяю треки\\.\\.\\.*\n\nЭто может занять несколько минут\\.');
        await processMediaGroupAction(chatId, userId, 'extend', messageId);
        return true;
        
      case 'stems_all':
        await answerCallbackQuery(queryId, '🎛️ Разделение на стемы...');
        await editMessageText(chatId, messageId, '⏳ *Разделяю на стемы\\.\\.\\.*\n\nЭто может занять несколько минут\\.');
        await processMediaGroupAction(chatId, userId, 'stems', messageId);
        return true;
        
      case 'cancel':
        await answerCallbackQuery(queryId, '❌ Отменено');
        await clearMediaGroupSession(userId);
        await editMessageText(chatId, messageId, '❌ *Операция отменена*\n\nОтправьте файлы снова, когда будете готовы\\.');
        await logBotAction(userId, chatId, 'media_group_cancelled');
        return true;
        
      default:
        return false;
    }
  } catch (error) {
    logger.error('Error handling media group callback:', error);
    await answerCallbackQuery(queryId, '❌ Ошибка');
    await sendMessage(chatId, `❌ Произошла ошибка при обработке\\.`);
    return true;
  }
}
