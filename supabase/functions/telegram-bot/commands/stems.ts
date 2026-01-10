/**
 * Stem Separation Commands for Telegram Bot
 * 
 * Handles track stem separation requests and status checks
 */

import { sendMessage, editMessageText } from '../telegram-api.ts';
import { logger } from '../utils/index.ts';
import { getSupabaseClient } from '../core/supabase-client.ts';

// Use centralized singleton client
const supabase = getSupabaseClient();

/**
 * Handle stem separation request
 * 
 * @param chatId - Telegram chat ID
 * @param trackId - Track UUID
 * @param mode - Separation mode ('simple' or 'detailed')
 * @param messageId - Message ID to update (optional)
 */
export async function handleStemSeparation(
  chatId: number,
  trackId: string,
  mode: 'simple' | 'detailed',
  messageId?: number
) {
  try {
    logger.info('handleStemSeparation', { chatId, trackId, mode });
    
    // 1. Validate track exists
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('id, title, audio_url')
      .eq('id', trackId)
      .single();
    
    if (trackError || !track) {
      logger.error('Track not found', trackError);
      await sendMessage(chatId, '❌ Трек не найден.');
      return;
    }
    
    if (!track.audio_url) {
      await sendMessage(chatId, '❌ У трека нет аудио файла.');
      return;
    }
    
    // 2. Call stem separation edge function
    const { data, error } = await supabase.functions.invoke('suno-separate-vocals', {
      body: { 
        trackId: track.id,
        audioUrl: track.audio_url,
        mode,
      },
    });
    
    if (error) {
      logger.error('Stem separation failed', error);
      await sendMessage(chatId, '❌ Не удалось запустить разделение. Попробуйте позже.');
      return;
    }
    
    // 3. Update message with progress info
    const modeText = mode === 'simple' 
      ? 'Простое (2 стема: вокал + инструменты)' 
      : 'Детальное (4+ стемов)';
    const estimatedTime = mode === 'simple' ? '2-3 минуты' : '4-5 минут';
    
    const message = `✅ Разделение запущено!\n\n` +
      `🎵 Трек: ${track.title || 'Без названия'}\n` +
      `🎛️ Режим: ${modeText}\n` +
      `⏱️ Примерное время: ${estimatedTime}\n` +
      `🆔 ID задачи: \`${data.taskId}\`\n\n` +
      `📬 Вы получите уведомление когда стемы будут готовы.`;
    
    if (messageId) {
      await editMessageText(chatId, messageId, message);
    } else {
      await sendMessage(chatId, message);
    }
    
    logger.info('Stem separation started', { taskId: data.taskId, trackId });
    
  } catch (error) {
    logger.error('handleStemSeparation error', error);
    await sendMessage(chatId, '❌ Произошла ошибка при запуске разделения.');
  }
}

/**
 * Handle check stems status
 * 
 * @param chatId - Telegram chat ID
 * @param trackId - Track UUID
 * @param messageId - Message ID to update (optional)
 */
export async function handleCheckStemsStatus(
  chatId: number,
  trackId: string,
  messageId?: number
) {
  try {
    logger.info('handleCheckStemsStatus', { chatId, trackId });
    
    // Get stems for track
    const { data: stems, error } = await supabase
      .from('track_stems')
      .select('*')
      .eq('track_id', trackId)
      .order('created_at', { ascending: false });
    
    if (error || !stems || stems.length === 0) {
      logger.warn('No stems found', { trackId });
      await sendMessage(chatId, '❌ Стемы не найдены. Возможно, разделение еще не завершено.');
      return;
    }
    
    const message = `🎛️ Стемы готовы!\n\n` +
      `📊 Найдено стемов: ${stems.length}\n\n` +
      stems.map((stem, i) => `${i + 1}. ${stem.stem_type}`).join('\n') +
      `\n\nОткройте трек в студии для работы со стемами.`;
    
    if (messageId) {
      await editMessageText(chatId, messageId, message);
    } else {
      await sendMessage(chatId, message);
    }
    
    logger.info('Stems status checked', { trackId, count: stems.length });
    
  } catch (error) {
    logger.error('handleCheckStemsStatus error', error);
    await sendMessage(chatId, '❌ Ошибка при проверке статуса стемов.');
  }
}

/**
 * Handle download stems
 * 
 * @param chatId - Telegram chat ID
 * @param trackId - Track UUID
 * @param messageId - Message ID to update (optional)
 */
export async function handleDownloadStems(
  chatId: number,
  trackId: string,
  messageId?: number
) {
  try {
    logger.info('handleDownloadStems', { chatId, trackId });
    
    // Get track and stems
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('id, title')
      .eq('id', trackId)
      .single();
    
    if (trackError || !track) {
      await sendMessage(chatId, '❌ Трек не найден.');
      return;
    }
    
    const { data: stems, error: stemsError } = await supabase
      .from('track_stems')
      .select('*')
      .eq('track_id', trackId);
    
    if (stemsError || !stems || stems.length === 0) {
      await sendMessage(chatId, '❌ Стемы не найдены.');
      return;
    }
    
    // Generate download links
    const links = stems.map(stem => {
      const url = stem.audio_url || stem.stem_url;
      return `[${stem.stem_type}](${url})`;
    }).join('\n');
    
    const message = `⬇️ Скачать стемы: ${track.title}\n\n${links}\n\n` +
      `💡 Нажмите на ссылку чтобы скачать отдельный стем.`;
    
    if (messageId) {
      await editMessageText(chatId, messageId, message);
    } else {
      await sendMessage(chatId, message);
    }
    
    logger.info('Stems download links sent', { trackId, count: stems.length });
    
  } catch (error) {
    logger.error('handleDownloadStems error', error);
    await sendMessage(chatId, '❌ Ошибка при получении ссылок для скачивания.');
  }
}
