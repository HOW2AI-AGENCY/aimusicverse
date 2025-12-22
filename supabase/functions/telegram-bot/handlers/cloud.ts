/**
 * Cloud handlers for the ОБЛАКО menu section
 * Enhanced with file viewing, pagination, and storage info
 */

import { editMessageText, editMessageMedia, answerCallbackQuery } from '../telegram-api.ts';
import { getSupabaseClient } from '../core/supabase-client.ts';
import { logger } from '../utils/index.ts';
import { logBotAction } from '../utils/bot-logger.ts';
import { escapeMarkdownV2, truncateText } from '../utils/text-processor.ts';

// Helper to get user by telegram ID
async function getUserByTelegramId(telegramId: number): Promise<{ id: string; user_id: string } | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, user_id')
    .eq('telegram_id', telegramId)
    .single();
  
  if (error) return null;
  return data;
}

// Format file size
function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Format duration
function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export async function handleCloudCallback(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  if (!data.startsWith('cloud_')) return false;
  
  try {
    const user = await getUserByTelegramId(userId);
    if (!user) {
      await answerCallbackQuery(queryId, '❌ Пользователь не найден');
      return true;
    }
    
    const action = data.replace('cloud_', '');
    
    if (action === 'list_files' || action.startsWith('files_page_')) {
      const page = action.startsWith('files_page_') ? parseInt(action.replace('files_page_', ''), 10) : 0;
      await showCloudFiles(chatId, user.user_id, messageId, page);
    } else if (action === 'list_tracks' || action.startsWith('tracks_page_')) {
      const page = action.startsWith('tracks_page_') ? parseInt(action.replace('tracks_page_', ''), 10) : 0;
      await showCloudTracks(chatId, user.user_id, messageId, page);
    } else if (action === 'list_stems') {
      await showStemFiles(chatId, user.user_id, messageId);
    } else if (action === 'list_midi') {
      await showMidiFiles(chatId, user.user_id, messageId);
    } else if (action === 'storage_info') {
      await showStorageInfo(chatId, user.user_id, messageId);
    } else if (action.startsWith('file_')) {
      const fileId = action.replace('file_', '');
      await showFileDetails(chatId, user.user_id, messageId, fileId);
    } else if (action.startsWith('delete_')) {
      const fileId = action.replace('delete_', '');
      await deleteFile(chatId, user.user_id, messageId, fileId, queryId);
    } else {
      return false;
    }
    
    await answerCallbackQuery(queryId);
    await logBotAction(userId, chatId, 'cloud_action', { action });
    return true;
  } catch (error) {
    logger.error('Failed to handle cloud callback', error);
    await answerCallbackQuery(queryId, '❌ Ошибка');
    return true;
  }
}

async function showCloudFiles(chatId: number, supabaseUserId: string, messageId: number, page: number = 0): Promise<void> {
  const supabase = getSupabaseClient();
  const pageSize = 5;
  const offset = page * pageSize;
  
  // Get reference audio files with pagination
  const { data: files, count } = await supabase
    .from('reference_audio')
    .select('*', { count: 'exact' })
    .eq('user_id', supabaseUserId)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);
  
  const totalFiles = count || 0;
  const totalPages = Math.ceil(totalFiles / pageSize);
  
  if (!files || files.length === 0) {
    const text = `📂 *МОИ ФАЙЛЫ*\n\n` +
      `_У вас пока нет загруженных файлов\\._\n\n` +
      `📤 Загрузите аудио через меню "Загрузка"`;
    
    await editMessageText(chatId, messageId, text, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📤 Загрузить файл', callback_data: 'menu_upload' }],
          [{ text: '◀️ Назад', callback_data: 'menu_cloud' }],
        ],
      },
    } as Record<string, unknown>);
    return;
  }
  
  let text = `📂 *МОИ ФАЙЛЫ*\n\n`;
  text += `📊 *Всего:* ${totalFiles} файлов\n`;
  if (totalPages > 1) {
    text += `📄 _Страница ${page + 1} из ${totalPages}_\n`;
  }
  text += `\n`;
  
  // List files
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const num = offset + i + 1;
    const name = truncateText(file.file_name || 'Без имени', 25);
    const size = formatFileSize(file.file_size);
    const duration = formatDuration(file.duration_seconds);
    
    const statusEmoji = file.analysis_status === 'completed' ? '✅' : 
                        file.analysis_status === 'processing' ? '⏳' : '📝';
    
    text += `${num}\\. ${statusEmoji} *${escapeMarkdownV2(name)}*\n`;
    text += `   ⏱ ${duration} • 💾 ${size}\n`;
    if (file.genre) {
      text += `   🎵 ${escapeMarkdownV2(file.genre)}`;
      if (file.mood) text += ` • ${escapeMarkdownV2(file.mood)}`;
      text += `\n`;
    }
    text += `\n`;
  }
  
  // Build keyboard
  const keyboard: any[][] = [];
  
  // File buttons
  for (const file of files) {
    const name = truncateText(file.file_name || 'Файл', 20);
    keyboard.push([{ 
      text: `📄 ${name}`, 
      callback_data: `cloud_file_${file.id}` 
    }]);
  }
  
  // Pagination
  if (totalPages > 1) {
    const paginationRow: any[] = [];
    if (page > 0) paginationRow.push({ text: '◀️', callback_data: `cloud_files_page_${page - 1}` });
    paginationRow.push({ text: `${page + 1}/${totalPages}`, callback_data: 'noop' });
    if (page < totalPages - 1) paginationRow.push({ text: '▶️', callback_data: `cloud_files_page_${page + 1}` });
    keyboard.push(paginationRow);
  }
  
  keyboard.push([{ text: '📤 Загрузить ещё', callback_data: 'menu_upload' }]);
  keyboard.push([{ text: '◀️ Назад', callback_data: 'menu_cloud' }]);

  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: { inline_keyboard: keyboard },
  } as Record<string, unknown>);
}

async function showCloudTracks(chatId: number, supabaseUserId: string, messageId: number, page: number = 0): Promise<void> {
  const supabase = getSupabaseClient();
  const pageSize = 5;
  const offset = page * pageSize;
  
  // Get tracks with pagination
  const { data: tracks, count } = await supabase
    .from('tracks')
    .select('id, title, style, audio_url, duration_seconds, created_at', { count: 'exact' })
    .eq('user_id', supabaseUserId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);
  
  const totalTracks = count || 0;
  const totalPages = Math.ceil(totalTracks / pageSize);
  
  if (!tracks || tracks.length === 0) {
    const text = `🎵 *МОИ ТРЕКИ*\n\n` +
      `_У вас пока нет сгенерированных треков\\._\n\n` +
      `🎼 Создайте трек через меню "Создать"`;
    
    await editMessageText(chatId, messageId, text, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎼 Создать трек', callback_data: 'quick_actions' }],
          [{ text: '◀️ Назад', callback_data: 'menu_cloud' }],
        ],
      },
    } as Record<string, unknown>);
    return;
  }
  
  let text = `🎵 *МОИ ТРЕКИ*\n\n`;
  text += `📊 *Всего:* ${totalTracks} треков\n`;
  if (totalPages > 1) {
    text += `📄 _Страница ${page + 1} из ${totalPages}_\n`;
  }
  text += `\n`;
  
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const num = offset + i + 1;
    const title = truncateText(track.title || 'Без названия', 25);
    const duration = formatDuration(track.duration_seconds);
    
    text += `${num}\\. 🎵 *${escapeMarkdownV2(title)}*\n`;
    text += `   ⏱ ${duration}`;
    if (track.style) text += ` • ${escapeMarkdownV2(truncateText(track.style, 20))}`;
    text += `\n\n`;
  }
  
  // Build keyboard
  const keyboard: any[][] = [];
  
  // Track buttons
  for (const track of tracks) {
    const title = truncateText(track.title || 'Трек', 20);
    keyboard.push([{ 
      text: `▶️ ${title}`, 
      callback_data: `track_details_${track.id}` 
    }]);
  }
  
  // Pagination
  if (totalPages > 1) {
    const paginationRow: any[] = [];
    if (page > 0) paginationRow.push({ text: '◀️', callback_data: `cloud_tracks_page_${page - 1}` });
    paginationRow.push({ text: `${page + 1}/${totalPages}`, callback_data: 'noop' });
    if (page < totalPages - 1) paginationRow.push({ text: '▶️', callback_data: `cloud_tracks_page_${page + 1}` });
    keyboard.push(paginationRow);
  }
  
  keyboard.push([{ text: '◀️ Назад', callback_data: 'menu_cloud' }]);

  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: { inline_keyboard: keyboard },
  } as Record<string, unknown>);
}

async function showStemFiles(chatId: number, supabaseUserId: string, messageId: number): Promise<void> {
  const supabase = getSupabaseClient();
  
  // Get stems from reference_audio that have stems
  const { data: files, count } = await supabase
    .from('reference_audio')
    .select('id, file_name, vocal_stem_url, instrumental_stem_url, drums_stem_url, bass_stem_url, stems_status', { count: 'exact' })
    .eq('user_id', supabaseUserId)
    .eq('stems_status', 'completed');
  
  if (!files || files.length === 0) {
    const text = `🎛️ *СТЕМЫ*\n\n` +
      `_Стемов пока нет\\._\n\n` +
      `🎵 Загрузите трек и разделите его на стемы:\n` +
      `• 🎤 Вокал\n` +
      `• 🎸 Инструменты\n` +
      `• 🥁 Ударные\n` +
      `• 🎸 Бас`;

    await editMessageText(chatId, messageId, text, {
      parse_mode: 'MarkdownV2',
      reply_markup: { 
        inline_keyboard: [
          [{ text: '📤 Загрузить для сепарации', callback_data: 'upload_audio_prompt' }],
          [{ text: '◀️ Назад', callback_data: 'menu_cloud' }]
        ] 
      },
    } as Record<string, unknown>);
    return;
  }
  
  let text = `🎛️ *СТЕМЫ*\n\n`;
  text += `📊 *Файлов со стемами:* ${count || 0}\n\n`;
  
  for (const file of files.slice(0, 5)) {
    const name = truncateText(file.file_name || 'Файл', 25);
    const stems = [
      file.vocal_stem_url ? '🎤' : '',
      file.instrumental_stem_url ? '🎸' : '',
      file.drums_stem_url ? '🥁' : '',
      file.bass_stem_url ? '🎸' : ''
    ].filter(Boolean).join(' ');
    
    text += `📄 *${escapeMarkdownV2(name)}*\n`;
    text += `   ${stems || 'Стемы доступны'}\n\n`;
  }

  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: { 
      inline_keyboard: [
        [{ text: '📤 Загрузить для сепарации', callback_data: 'upload_audio_prompt' }],
        [{ text: '◀️ Назад', callback_data: 'menu_cloud' }]
      ] 
    },
  } as Record<string, unknown>);
}

async function showMidiFiles(chatId: number, supabaseUserId: string, messageId: number): Promise<void> {
  const supabase = getSupabaseClient();
  
  // Get guitar recordings with MIDI
  const { data: recordings, count } = await supabase
    .from('guitar_recordings')
    .select('id, title, midi_url, gp5_url, pdf_url', { count: 'exact' })
    .eq('user_id', supabaseUserId)
    .not('midi_url', 'is', null);
  
  if (!recordings || recordings.length === 0) {
    const text = `🎹 *MIDI ФАЙЛЫ*\n\n` +
      `_MIDI файлов пока нет\\._\n\n` +
      `🎵 Экспортируйте трек в MIDI:\n` +
      `• 📝 Ноты и аккорды\n` +
      `• 🎸 Guitar Pro табулатуры\n` +
      `• 📄 PDF партитуры`;

    await editMessageText(chatId, messageId, text, {
      parse_mode: 'MarkdownV2',
      reply_markup: { 
        inline_keyboard: [
          [{ text: '🎵 Мои треки', callback_data: 'menu_tracks' }],
          [{ text: '◀️ Назад', callback_data: 'menu_cloud' }]
        ] 
      },
    } as Record<string, unknown>);
    return;
  }
  
  let text = `🎹 *MIDI ФАЙЛЫ*\n\n`;
  text += `📊 *Всего:* ${count || 0} файлов\n\n`;
  
  for (const rec of recordings.slice(0, 5)) {
    const name = truncateText(rec.title || 'Запись', 25);
    const formats = [
      rec.midi_url ? 'MIDI' : '',
      rec.gp5_url ? 'GP5' : '',
      rec.pdf_url ? 'PDF' : ''
    ].filter(Boolean).join(', ');
    
    text += `🎹 *${escapeMarkdownV2(name)}*\n`;
    text += `   📄 ${formats}\n\n`;
  }

  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: 'menu_cloud' }]] },
  } as Record<string, unknown>);
}

async function showStorageInfo(chatId: number, supabaseUserId: string, messageId: number): Promise<void> {
  const supabase = getSupabaseClient();
  
  // Get file stats
  const { count: audioCount } = await supabase
    .from('reference_audio')
    .select('id', { count: 'exact' })
    .eq('user_id', supabaseUserId);
  
  const { count: trackCount } = await supabase
    .from('tracks')
    .select('id', { count: 'exact' })
    .eq('user_id', supabaseUserId);
  
  // Get total size from reference_audio
  const { data: sizeData } = await supabase
    .from('reference_audio')
    .select('file_size')
    .eq('user_id', supabaseUserId);
  
  const totalSize = sizeData?.reduce((sum, f) => sum + (f.file_size || 0), 0) || 0;
  const maxStorage = 500 * 1024 * 1024; // 500 MB
  const usagePercent = Math.round((totalSize / maxStorage) * 100);
  const progressBar = '█'.repeat(Math.min(10, Math.floor(usagePercent / 10))) + 
                      '░'.repeat(10 - Math.min(10, Math.floor(usagePercent / 10)));
  
  const text = `📊 *ХРАНИЛИЩЕ*\n\n` +
    `*Использовано:*\n` +
    `${progressBar} ${usagePercent}%\n\n` +
    `💾 *${formatFileSize(totalSize)}* из 500 MB\n\n` +
    `📂 *Файлы:*\n` +
    `• 🎵 Аудио: ${audioCount || 0}\n` +
    `• 🎼 Треки: ${trackCount || 0}\n\n` +
    `_Увеличьте лимит с подпиской Pro\\!_`;

  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Увеличить лимит', callback_data: 'menu_tariffs' }],
        [{ text: '🗑 Очистить', callback_data: 'cloud_cleanup' }],
        [{ text: '◀️ Назад', callback_data: 'menu_cloud' }],
      ],
    },
  } as Record<string, unknown>);
}

async function showFileDetails(chatId: number, supabaseUserId: string, messageId: number, fileId: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { data: file, error } = await supabase
    .from('reference_audio')
    .select('*')
    .eq('id', fileId)
    .eq('user_id', supabaseUserId)
    .single();
  
  if (error || !file) {
    await editMessageText(chatId, messageId, '❌ Файл не найден', {
      reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: 'cloud_list_files' }]] },
    } as Record<string, unknown>);
    return;
  }
  
  const name = file.file_name || 'Без имени';
  const size = formatFileSize(file.file_size);
  const duration = formatDuration(file.duration_seconds);
  const date = new Date(file.created_at).toLocaleDateString('ru-RU');
  
  let text = `📄 *${escapeMarkdownV2(name)}*\n\n`;
  text += `⏱ *Длительность:* ${duration}\n`;
  text += `💾 *Размер:* ${size}\n`;
  text += `📅 *Загружен:* ${date}\n`;
  
  if (file.genre) text += `🎵 *Жанр:* ${escapeMarkdownV2(file.genre)}\n`;
  if (file.mood) text += `💫 *Настроение:* ${escapeMarkdownV2(file.mood)}\n`;
  if (file.bpm) text += `🥁 *BPM:* ${file.bpm}\n`;
  
  const statusLabels: Record<string, string> = {
    'pending': '⏳ Ожидает анализа',
    'processing': '🔄 Анализируется',
    'completed': '✅ Проанализирован',
    'failed': '❌ Ошибка'
  };
  text += `\n📊 *Статус:* ${statusLabels[file.analysis_status] || file.analysis_status}\n`;
  
  // Build keyboard
  const keyboard: any[][] = [];
  
  if (file.file_url) {
    keyboard.push([{ text: '⬇️ Скачать', url: file.file_url }]);
  }
  
  if (file.analysis_status !== 'completed') {
    keyboard.push([{ text: '🔍 Анализировать', callback_data: `analyze_audio_${fileId}` }]);
  }
  
  if (file.stems_status !== 'completed') {
    keyboard.push([{ text: '🎛️ Разделить на стемы', callback_data: `separate_stems_${fileId}` }]);
  }
  
  keyboard.push([{ text: '🗑 Удалить', callback_data: `cloud_delete_${fileId}` }]);
  keyboard.push([{ text: '◀️ Назад', callback_data: 'cloud_list_files' }]);

  await editMessageText(chatId, messageId, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: { inline_keyboard: keyboard },
  } as Record<string, unknown>);
}

async function deleteFile(chatId: number, supabaseUserId: string, messageId: number, fileId: string, queryId: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('reference_audio')
    .delete()
    .eq('id', fileId)
    .eq('user_id', supabaseUserId);
  
  if (error) {
    await answerCallbackQuery(queryId, '❌ Ошибка удаления');
    return;
  }
  
  await answerCallbackQuery(queryId, '✅ Файл удалён');
  await showCloudFiles(chatId, supabaseUserId, messageId, 0);
}
