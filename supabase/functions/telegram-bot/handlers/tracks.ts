/**
 * Tracks handlers for the ТРЕКИ menu section
 */

import { editMessageText, answerCallbackQuery } from '../telegram-api.ts';
import { getUserByTelegramId } from '../db-helpers.ts';
import { createSupabaseClient } from '../supabase-client.ts';
import { logger } from '../utils/index.ts';
import { logBotAction } from '../utils/bot-logger.ts';
import { setWaitingForInput } from '../db-session-store.ts';

const TRACKS_PER_PAGE = 5;

interface TrackRow {
  id: string;
  title: string | null;
  style: string | null;
  duration_seconds: number | null;
  created_at: string;
  likes_count: number | null;
  computed_genre?: string | null;
}

export async function handleTracksCallback(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  if (!data.startsWith('tracks_')) return false;
  
  try {
    const user = await getUserByTelegramId(userId);
    if (!user) {
      await answerCallbackQuery(queryId, '❌ Пользователь не найден');
      return true;
    }
    
    const action = data.replace('tracks_', '');
    
    if (action === 'list_all') {
      await showTracksList(chatId, user.id, messageId, 'all', 0);
    } else if (action === 'list_recent') {
      await showTracksList(chatId, user.id, messageId, 'recent', 0);
    } else if (action === 'list_favorites') {
      await showTracksList(chatId, user.id, messageId, 'favorites', 0);
    } else if (action === 'filter_genres') {
      await showGenreFilter(chatId, messageId);
    } else if (action === 'search') {
      await promptTrackSearch(chatId, userId, messageId);
    } else if (action.startsWith('page_')) {
      const parts = action.split('_');
      const filter = parts[1] as 'all' | 'recent' | 'favorites';
      const page = parseInt(parts[2] || '0', 10);
      await showTracksList(chatId, user.id, messageId, filter, page);
    }
    
    await answerCallbackQuery(queryId);
    await logBotAction(userId, chatId, 'tracks_action', { action });
    return true;
  } catch (error) {
    logger.error('Failed to handle tracks callback', error);
    await answerCallbackQuery(queryId, '❌ Ошибка');
    return true;
  }
}

async function showTracksList(
  chatId: number,
  supabaseUserId: string,
  messageId: number,
  filter: 'all' | 'recent' | 'favorites',
  page: number
): Promise<void> {
  const supabase = createSupabaseClient();
  
  let query = supabase
    .from('tracks')
    .select('id, title, style, duration_seconds, created_at, likes_count', { count: 'exact' })
    .eq('user_id', supabaseUserId)
    .order('created_at', { ascending: false });
  
  if (filter === 'recent') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('created_at', weekAgo);
  }
  
  const { data: tracks, count } = await query.range(page * TRACKS_PER_PAGE, (page + 1) * TRACKS_PER_PAGE - 1);
  
  const totalPages = Math.ceil((count || 0) / TRACKS_PER_PAGE);
  const filterLabels = { all: 'ВСЕ ТРЕКИ', recent: 'НЕДАВНИЕ', favorites: 'ИЗБРАННОЕ' };
  
  let text = `🎵 *${filterLabels[filter]}*\n\n`;
  
  if (!tracks || tracks.length === 0) {
    text += '_Треков пока нет\\._\n\n🎹 Создайте первый трек командой /create';
  } else {
    (tracks as TrackRow[]).forEach((track: TrackRow, i: number) => {
      const num = page * TRACKS_PER_PAGE + i + 1;
      const title = escapeMarkdown(track.title || 'Без названия');
      const likes = track.likes_count || 0;
      text += `*${num}\\.* ${title} • ❤️ ${likes}\n`;
    });
    text += `\n📊 _Страница ${page + 1} из ${totalPages}_`;
  }
  
  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];
  
  if (totalPages > 1) {
    const navRow: Array<{ text: string; callback_data: string }> = [];
    if (page > 0) navRow.push({ text: '◀️', callback_data: `tracks_page_${filter}_${page - 1}` });
    navRow.push({ text: `${page + 1}/${totalPages}`, callback_data: 'noop' });
    if (page < totalPages - 1) navRow.push({ text: '▶️', callback_data: `tracks_page_${filter}_${page + 1}` });
    keyboard.push(navRow);
  }
  
  keyboard.push([{ text: '◀️ К меню треков', callback_data: 'menu_tracks' }]);
  
  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: { inline_keyboard: keyboard },
  } as Record<string, unknown>);
}

async function showGenreFilter(chatId: number, messageId: number): Promise<void> {
  const genres = [
    { emoji: '🎸', name: 'Rock', key: 'rock' },
    { emoji: '🎹', name: 'Pop', key: 'pop' },
    { emoji: '🎷', name: 'Jazz', key: 'jazz' },
    { emoji: '🎧', name: 'Electronic', key: 'electronic' },
  ];
  
  const text = `🎸 *ФИЛЬТР ПО ЖАНРАМ*\n\nВыберите жанр:`;
  
  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];
  for (let i = 0; i < genres.length; i += 2) {
    const row: Array<{ text: string; callback_data: string }> = [];
    row.push({ text: `${genres[i].emoji} ${genres[i].name}`, callback_data: `tracks_genre_${genres[i].key}` });
    if (genres[i + 1]) {
      row.push({ text: `${genres[i + 1].emoji} ${genres[i + 1].name}`, callback_data: `tracks_genre_${genres[i + 1].key}` });
    }
    keyboard.push(row);
  }
  keyboard.push([{ text: '◀️ Назад', callback_data: 'menu_tracks' }]);
  
  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: { inline_keyboard: keyboard },
  } as Record<string, unknown>);
}

async function promptTrackSearch(chatId: number, telegramUserId: number, messageId: number): Promise<void> {
  await setWaitingForInput(telegramUserId, 'track_search', { chatId, messageId });
  
  const text = `🔍 *ПОИСК ТРЕКОВ*\n\nВведите название или ключевые слова:`;
  
  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: { inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'menu_tracks' }]] },
  } as Record<string, unknown>);
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+=|{}.!-])/g, '\\$1');
}
