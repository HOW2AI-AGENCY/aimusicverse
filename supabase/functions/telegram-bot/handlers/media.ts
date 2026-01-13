import { musicService } from '../core/services/music.ts';
import { createTrackDetailsKeyboard, createShareMenu, createTrackKeyboard } from '../keyboards/main-menu.ts';
import { sendAudio, sendMessage, editMessageCaption, answerCallbackQuery } from '../telegram-api.ts';
import { BOT_CONFIG } from '../config.ts';

export async function handlePlayTrack(
  chatId: number,
  trackId: string,
  queryId: string
) {
  await answerCallbackQuery(queryId, '🚀 Загружаем трек...');

  const track = await musicService.getTrackById(trackId);

  if (!track) {
    await sendMessage(chatId, '❌ Трек не найден');
    return;
  }

  const audioUrl = musicService.getAudioUrl(track);

  if (!audioUrl) {
    await sendMessage(chatId, '❌ Аудио файл недоступен. Трек еще генерируется...');
    return;
  }

  try {
    // Инкрементируем счетчик прослушиваний
    await musicService.incrementPlayCount(trackId);

    const title = track.title || 'MusicVerse Track';
    const artist = track.artist || 'MusicVerse AI';
    const duration = track.duration_seconds || 0;
    const coverUrl = musicService.getCoverUrl(track);

    const caption = `▶️ *${musicService.escapeMarkdown(title)}*\n` +
                   `🎵 ${musicService.escapeMarkdown(artist)}\n` +
                   `⏱️ Длительность: ${musicService.formatDuration(duration)}`;

    // Отправляем аудио с метаданными для нативного плеера Telegram
    await sendAudio(chatId, audioUrl, {
      title,
      performer: artist,
      duration,
      thumbnail: coverUrl,
      caption,
      replyMarkup: createTrackDetailsKeyboard(trackId)
    });
  } catch (error) {
    console.error('Error sending audio:', error);
    await sendMessage(chatId, '❌ Не удалось отправить аудио файл');
  }
}

export async function handleDownloadTrack(
  chatId: number,
  trackId: string,
  queryId: string
) {
  await answerCallbackQuery(queryId, '📥 Подготовка к скачиванию...');

  const track = await musicService.getTrackById(trackId);

  if (!track) {
    await sendMessage(chatId, '❌ Трек не найден');
    return;
  }

  const audioUrl = musicService.getAudioUrl(track);

  if (!audioUrl) {
    await sendMessage(chatId, '❌ Файл недоступен');
    return;
  }

  const title = track.title || 'MusicVerse Track';
  
  try {
    // Отправляем как документ для скачивания
    await sendAudio(chatId, audioUrl, {
      title: `${title}.mp3`,
      performer: 'MusicVerse AI',
      caption: `📥 *${musicService.escapeMarkdown(title)}*\n\nСкачайте и наслаждайтесь!`
    });
  } catch (error) {
    console.error('Error sending document:', error);
    await sendMessage(chatId, '❌ Не удалось отправить файл');
  }
}

export async function handleShareTrack(
  chatId: number,
  trackId: string,
  messageId: number,
  queryId: string
) {
  await answerCallbackQuery(queryId);

  const track = await musicService.getTrackById(trackId);

  if (!track) {
    await sendMessage(chatId, '❌ Трек не найден');
    return;
  }

  const caption = `📤 *Поделиться треком*\n\n` +
                 `🎵 *${musicService.escapeMarkdown(track.title || 'Новый трек')}*\n` +
                 (track.style ? `🎸 ${musicService.escapeMarkdown(track.style)}\n` : '') +
                 `\n✨ Выберите способ:`;

  await editMessageCaption(chatId, messageId, caption, createShareMenu(trackId));
}

export async function handleCopyLink(
  chatId: number,
  trackId: string,
  messageId: number,
  queryId: string
) {
  const link = `${BOT_CONFIG.miniAppUrl}?startapp=track_${trackId}`;

  await answerCallbackQuery(queryId, '✅ Ссылка готова!');

  const caption = `🔗 *Ссылка на трек*\n\n` +
                 `\`${link}\`\n\n` +
                 `Скопируйте и отправьте друзьям! 🎵`;

  await editMessageCaption(chatId, messageId, caption, createTrackDetailsKeyboard(trackId));
}

export async function handleLikeTrack(
  chatId: number,
  trackId: string,
  queryId: string,
  userId?: string
) {
  if (!userId) {
    await answerCallbackQuery(queryId, '❌ Требуется авторизация');
    return;
  }

  try {
    const { getSupabaseClient } = await import('../core/supabase-client.ts');
    const supabase = getSupabaseClient();

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('track_likes')
      .select('id')
      .eq('track_id', trackId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike
      await supabase.from('track_likes').delete().eq('id', existingLike.id);
      await answerCallbackQuery(queryId, '💔 Удалено из избранного');
    } else {
      // Like
      await supabase.from('track_likes').insert({ track_id: trackId, user_id: userId });
      await answerCallbackQuery(queryId, '❤️ Добавлено в избранное!');
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    await answerCallbackQuery(queryId, '❌ Ошибка');
  }
}

export async function handleShowTrackDetails(
  chatId: number,
  trackId: string,
  messageId: number,
  queryId: string
) {
  await answerCallbackQuery(queryId);

  const track = await musicService.getTrackById(trackId);
  if (!track) {
    await sendMessage(chatId, '❌ Трек не найден');
    return;
  }

  const title = track.title || 'Без названия';
  const style = track.style || 'Не указан';
  const duration = musicService.formatDuration(track.duration_seconds || 0);
  const status = track.status === 'completed' ? '✅ Готов' : '⏳ Обрабатывается';

  const caption = `🎵 *${musicService.escapeMarkdown(title)}*\n\n` +
    `🎸 Стиль: ${musicService.escapeMarkdown(style)}\n` +
    `⏱️ Длительность: ${duration}\n` +
    `📊 Статус: ${status}\n` +
    (track.tags ? `🏷️ Теги: ${musicService.escapeMarkdown(track.tags)}\n` : '') +
    `\n✨ Создано в MusicVerse AI`;

  await editMessageCaption(chatId, messageId, caption, createTrackDetailsKeyboard(trackId));
}

export async function handleMediaCallback(
  callbackData: string,
  chatId: number,
  messageId: number,
  queryId: string,
  userId?: string
) {
  if (callbackData.startsWith('play_')) {
    const trackId = callbackData.replace('play_', '');
    await handlePlayTrack(chatId, trackId, queryId);
  } else if (callbackData.startsWith('dl_')) {
    const trackId = callbackData.replace('dl_', '');
    await handleDownloadTrack(chatId, trackId, queryId);
  } else if (callbackData.startsWith('share_')) {
    const trackId = callbackData.replace('share_', '');
    await handleShareTrack(chatId, trackId, messageId, queryId);
  } else if (callbackData.startsWith('share_link_')) {
    const trackId = callbackData.replace('share_link_', '');
    await handleCopyLink(chatId, trackId, messageId, queryId);
  } else if (callbackData.startsWith('like_')) {
    const trackId = callbackData.replace('like_', '');
    await handleLikeTrack(chatId, trackId, queryId, userId);
  } else if (callbackData.startsWith('track_')) {
    const trackId = callbackData.replace('track_', '');
    await handleShowTrackDetails(chatId, trackId, messageId, queryId);
  }
}
