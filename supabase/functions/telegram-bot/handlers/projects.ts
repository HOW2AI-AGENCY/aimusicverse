/**
 * Project handlers for Telegram bot
 * Enhanced with progress tracking, cover images, and sharing
 */

import { sendMessage, editMessageText, answerCallbackQuery, deleteMessage, sendPhoto, editMessageMedia } from '../telegram-api.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { escapeMarkdownV2, truncateText } from '../utils/text-processor.ts';
import { deleteActiveMenu, setActiveMenuMessageId } from '../core/active-menu-manager.ts';
import { getTelegramConfig, getProjectDeepLink } from '../../_shared/telegram-config.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const MINI_APP_URL = Deno.env.get('MINI_APP_URL') || 'https://t.me/PhuketMusicBot/app';

// Default project cover
const DEFAULT_PROJECT_COVER = 'https://ygmvthybdrqymfsqifmj.supabase.co/storage/v1/object/public/bot-assets/project-cover.png';

/**
 * Generate progress bar visual
 */
function getProgressBar(percent: number, length: number = 10): string {
  const filled = Math.round(percent / (100 / length));
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Get status emoji and label
 */
function getStatusInfo(status: string): { emoji: string; label: string } {
  const statusMap: Record<string, { emoji: string; label: string }> = {
    'draft': { emoji: '📝', label: 'Черновик' },
    'in_progress': { emoji: '🔄', label: 'В работе' },
    'completed': { emoji: '✅', label: 'Завершён' },
    'released': { emoji: '🚀', label: 'Выпущен' },
    'published': { emoji: '🌐', label: 'Опубликован' },
  };
  return statusMap[status] || statusMap['draft'];
}

/**
 * Get project type info
 */
function getTypeInfo(type: string): { emoji: string; label: string } {
  const typeMap: Record<string, { emoji: string; label: string }> = {
    'single': { emoji: '🎵', label: 'Сингл' },
    'ep': { emoji: '💿', label: 'EP' },
    'album': { emoji: '📀', label: 'Альбом' },
    'mixtape': { emoji: '🎚️', label: 'Микстейп' },
  };
  return typeMap[type] || typeMap['single'];
}

/**
 * Show projects list with enhanced visuals
 */
export async function handleProjectsCallback(
  chatId: number,
  userId: number,
  messageId: number,
  callbackId: string,
  page: number = 0
) {
  const pageSize = 5;
  const offset = page * pageSize;

  // Get user_id from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('telegram_id', userId)
    .single();

  if (!profile) {
    await answerCallbackQuery(callbackId, '❌ Профиль не найден');
    return;
  }

  // Get user's projects with track counts
  const { data: projects, count } = await supabase
    .from('music_projects')
    .select('id, title, description, status, project_type, cover_url, genre, mood, total_tracks_count, approved_tracks_count', { count: 'exact' })
    .eq('user_id', profile.user_id)
    .order('updated_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (!projects || projects.length === 0) {
    const text = `📁 *Мои проекты*\n\n` +
      `У вас пока нет музыкальных проектов\\.\n\n` +
      `🎵 Проект объединяет треки в альбом, EP или сингл\\.\n` +
      `✨ Создайте первый проект и начните творить\\!`;
    
    await editMessageText(chatId, messageId, text, {
      inline_keyboard: [
        [{ text: '➕ Создать проект', callback_data: 'wizard_start_project' }],
        [{ text: '📱 В приложении', url: `${MINI_APP_URL}?startapp=content-hub` }],
        [{ text: '🎼 Сгенерировать трек', callback_data: 'quick_actions' }],
        [{ text: '🔙 Назад', callback_data: 'nav_main' }],
      ],
    });
    await answerCallbackQuery(callbackId);
    return;
  }

  // Get actual track counts from project_tracks
  const projectIds = projects.map(p => p.id);
  const { data: trackData } = await supabase
    .from('project_tracks')
    .select('project_id, track_id')
    .in('project_id', projectIds);

  // Build track count map
  const trackCountMap = new Map<string, { total: number; completed: number }>();
  if (trackData) {
    for (const pt of trackData) {
      const existing = trackCountMap.get(pt.project_id) || { total: 0, completed: 0 };
      existing.total++;
      if (pt.track_id) existing.completed++;
      trackCountMap.set(pt.project_id, existing);
    }
  }

  const totalPages = Math.ceil((count || 0) / pageSize);

  let text = `📁 *Мои проекты*\n\n`;
  
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const num = offset + i + 1;
    const status = getStatusInfo(project.status || 'draft');
    const type = getTypeInfo(project.project_type || 'single');
    
    // Get track counts
    const counts = trackCountMap.get(project.id) || { 
      total: project.total_tracks_count || 0, 
      completed: project.approved_tracks_count || 0 
    };
    const progress = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
    
    // Format project entry
    text += `*${num}\\. ${escapeMarkdownV2(project.title || 'Без названия')}*\n`;
    text += `${type.emoji} ${escapeMarkdownV2(type.label)} • ${status.emoji} ${escapeMarkdownV2(status.label)}\n`;
    
    if (project.genre) {
      text += `🎵 ${escapeMarkdownV2(project.genre)}`;
      if (project.mood) text += ` • ${escapeMarkdownV2(project.mood)}`;
      text += `\n`;
    }
    
    // Progress bar
    text += `${getProgressBar(progress)} ${counts.completed}/${counts.total} треков\n`;
    text += `\n`;
  }

  if (totalPages > 1) {
    text += `\n📄 _Страница ${page + 1} из ${totalPages}_`;
  }

  // Build keyboard
  const keyboard: any[][] = [];
  
  // Project buttons (2 per row)
  for (let i = 0; i < projects.length; i += 2) {
    const row: any[] = [];
    const p1 = projects[i];
    const title1 = truncateText(p1.title || 'Проект', 15);
    row.push({ text: `${offset + i + 1}. ${title1}`, callback_data: `project_details_${p1.id}` });
    
    if (projects[i + 1]) {
      const p2 = projects[i + 1];
      const title2 = truncateText(p2.title || 'Проект', 15);
      row.push({ text: `${offset + i + 2}. ${title2}`, callback_data: `project_details_${p2.id}` });
    }
    keyboard.push(row);
  }

  // Pagination
  if (totalPages > 1) {
    const paginationRow: any[] = [];
    if (page > 0) paginationRow.push({ text: '◀️ Назад', callback_data: `projects_page_${page - 1}` });
    paginationRow.push({ text: `${page + 1}/${totalPages}`, callback_data: 'noop' });
    if (page < totalPages - 1) paginationRow.push({ text: 'Вперёд ▶️', callback_data: `projects_page_${page + 1}` });
    keyboard.push(paginationRow);
  }

  keyboard.push([{ text: '➕ Создать проект', callback_data: 'wizard_start_project' }]);
  keyboard.push([{ text: '📱 В приложении', url: `${MINI_APP_URL}?startapp=content-hub` }]);
  keyboard.push([{ text: '🔙 В меню', callback_data: 'nav_main' }]);

  await editMessageText(chatId, messageId, text, { inline_keyboard: keyboard });
  await answerCallbackQuery(callbackId);
}

/**
 * Show project details with cover image
 */
export async function handleProjectDetails(
  chatId: number,
  projectId: string,
  messageId: number,
  callbackId: string
) {
  const { data: project, error } = await supabase
    .from('music_projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error || !project) {
    await answerCallbackQuery(callbackId, '❌ Проект не найден');
    return;
  }

  // Get track count and stats
  const { data: projectTracks, count: trackCount } = await supabase
    .from('project_tracks')
    .select('id, track_id, status', { count: 'exact' })
    .eq('project_id', projectId);

  const completedTracks = projectTracks?.filter(t => t.track_id).length || 0;
  const totalTracks = trackCount || 0;
  const progress = totalTracks > 0 ? Math.round((completedTracks / totalTracks) * 100) : 0;

  const status = getStatusInfo(project.status || 'draft');
  const type = getTypeInfo(project.project_type || 'single');

  let text = `📁 *${escapeMarkdownV2(project.title || 'Проект')}*\n\n`;
  
  // Type and status
  text += `${type.emoji} *Тип:* ${escapeMarkdownV2(type.label)}\n`;
  text += `${status.emoji} *Статус:* ${escapeMarkdownV2(status.label)}\n\n`;

  // Description if available
  if (project.description) {
    const desc = truncateText(project.description, 150);
    text += `📝 _${escapeMarkdownV2(desc)}_\n\n`;
  }

  // Genre and mood
  if (project.genre) text += `🎵 *Жанр:* ${escapeMarkdownV2(project.genre)}\n`;
  if (project.mood) text += `💫 *Настроение:* ${escapeMarkdownV2(project.mood)}\n`;
  if (project.key_signature) text += `🎹 *Тональность:* ${escapeMarkdownV2(project.key_signature)}\n`;
  
  // Progress section
  text += `\n📊 *Прогресс*\n`;
  text += `${getProgressBar(progress, 10)} ${progress}%\n`;
  text += `🎵 Треков: ${completedTracks}/${totalTracks} готово\n`;

  // Release date if set
  if (project.release_date) {
    const releaseDate = new Date(project.release_date);
    const isUpcoming = releaseDate > new Date();
    text += `\n📅 *Релиз:* ${releaseDate.toLocaleDateString('ru-RU')}`;
    if (isUpcoming) text += ` \\(скоро\\)`;
    text += `\n`;
  }

  // Deep link for sharing
  const shareLink = getProjectDeepLink(projectId);

  const keyboard = [
    [{ text: '📱 Открыть в приложении', url: `${MINI_APP_URL}?startapp=project_${projectId}` }],
    [
      { text: '🎵 Треки', callback_data: `project_tracks_${projectId}` },
      { text: '✏️ Редактировать', callback_data: `project_edit_${projectId}` },
    ],
    [
      { text: '📤 Поделиться', callback_data: `project_share_${projectId}` },
      { text: '📊 Статистика', callback_data: `project_stats_${projectId}` },
    ],
    [{ text: '🔙 К списку', callback_data: 'nav_projects' }],
  ];

  // Try to send with cover image
  const coverUrl = project.cover_url || DEFAULT_PROJECT_COVER;
  
  try {
    await editMessageMedia(chatId, messageId, {
      type: 'photo',
      media: coverUrl,
      caption: text,
      parse_mode: 'MarkdownV2'
    }, { inline_keyboard: keyboard });
  } catch (e) {
    // Fallback to text-only
    await editMessageText(chatId, messageId, text, { inline_keyboard: keyboard });
  }
  
  await answerCallbackQuery(callbackId);
}

/**
 * Handle project sharing
 */
export async function handleProjectShare(
  chatId: number,
  projectId: string,
  messageId: number,
  callbackId: string
) {
  const { data: project } = await supabase
    .from('music_projects')
    .select('title, cover_url, genre, status')
    .eq('id', projectId)
    .single();

  if (!project) {
    await answerCallbackQuery(callbackId, '❌ Проект не найден');
    return;
  }

  const shareLink = getProjectDeepLink(projectId);
  const status = getStatusInfo(project.status || 'draft');

  const text = `📤 *Поделиться проектом*\n\n` +
    `📁 *${escapeMarkdownV2(project.title || 'Проект')}*\n` +
    `${status.emoji} ${escapeMarkdownV2(status.label)}` +
    (project.genre ? ` • 🎵 ${escapeMarkdownV2(project.genre)}` : '') +
    `\n\n` +
    `🔗 Ссылка для друзей:\n\`${escapeMarkdownV2(shareLink)}\``;

  const keyboard = [
    [{ text: '📤 Поделиться с друзьями', switch_inline_query: `project_${projectId}` }],
    [{ text: '💬 Отправить в чат', switch_inline_query_current_chat: `project_${projectId}` }],
    [{ text: '📋 Скопировать ссылку', callback_data: `copy_project_link_${projectId}` }],
    [{ text: '🔙 Назад', callback_data: `project_details_${projectId}` }],
  ];

  await editMessageText(chatId, messageId, text, { inline_keyboard: keyboard });
  await answerCallbackQuery(callbackId);
}

/**
 * Handle project stats
 */
export async function handleProjectStats(
  chatId: number,
  projectId: string,
  messageId: number,
  callbackId: string
) {
  const { data: project } = await supabase
    .from('music_projects')
    .select('title, created_at, updated_at')
    .eq('id', projectId)
    .single();

  if (!project) {
    await answerCallbackQuery(callbackId, '❌ Проект не найден');
    return;
  }

  // Get track stats
  const { data: projectTracks } = await supabase
    .from('project_tracks')
    .select('id, track_id, status, created_at')
    .eq('project_id', projectId);

  const totalTracks = projectTracks?.length || 0;
  const completedTracks = projectTracks?.filter(t => t.track_id).length || 0;
  const draftTracks = projectTracks?.filter(t => t.status === 'draft').length || 0;
  const lyricsReady = projectTracks?.filter(t => t.status === 'lyrics_ready').length || 0;

  // Get combined track stats
  const trackIds = projectTracks?.filter(t => t.track_id).map(t => t.track_id) || [];
  let totalPlays = 0;
  let totalLikes = 0;

  if (trackIds.length > 0) {
    const { data: tracks } = await supabase
      .from('tracks')
      .select('play_count, likes_count')
      .in('id', trackIds);
    
    if (tracks) {
      totalPlays = tracks.reduce((sum, t) => sum + (t.play_count || 0), 0);
      totalLikes = tracks.reduce((sum, t) => sum + (t.likes_count || 0), 0);
    }
  }

  const createdAt = new Date(project.created_at);
  const updatedAt = new Date(project.updated_at);
  const daysSinceCreation = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  const text = `📊 *Статистика проекта*\n` +
    `📁 ${escapeMarkdownV2(project.title || 'Проект')}\n\n` +
    `*Треки*\n` +
    `📝 Всего: ${totalTracks}\n` +
    `✅ Готово: ${completedTracks}\n` +
    `✍️ Тексты готовы: ${lyricsReady}\n` +
    `📋 Черновики: ${draftTracks}\n\n` +
    `*Активность*\n` +
    `▶️ Прослушиваний: ${totalPlays}\n` +
    `❤️ Лайков: ${totalLikes}\n\n` +
    `*Даты*\n` +
    `📅 Создан: ${createdAt.toLocaleDateString('ru-RU')}\n` +
    `🔄 Обновлён: ${updatedAt.toLocaleDateString('ru-RU')}\n` +
    `⏱ Дней в работе: ${daysSinceCreation}`;

  const keyboard = [
    [{ text: '📱 Открыть в приложении', url: `${MINI_APP_URL}?startapp=project_${projectId}` }],
    [{ text: '🔙 К проекту', callback_data: `project_details_${projectId}` }],
  ];

  await editMessageText(chatId, messageId, text, { inline_keyboard: keyboard });
  await answerCallbackQuery(callbackId);
}

/**
 * Show project edit menu
 */
export async function handleProjectEdit(
  chatId: number,
  projectId: string,
  userId: number,
  messageId: number,
  callbackId: string
) {
  // Verify ownership
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('telegram_id', userId)
    .single();

  const { data: project } = await supabase
    .from('music_projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (!project) {
    await answerCallbackQuery(callbackId, '❌ Проект не найден');
    return;
  }

  if (project.user_id !== profile?.user_id) {
    await answerCallbackQuery(callbackId, '❌ Нет доступа');
    return;
  }

  const status = getStatusInfo(project.status || 'draft');

  const text = `✏️ *Редактирование*\n` +
    `📁 ${escapeMarkdownV2(project.title || 'Проект')}\n\n` +
    `Текущий статус: ${status.emoji} ${escapeMarkdownV2(status.label)}\n\n` +
    `_Для полного редактирования откройте приложение\\._`;

  const statusOptions = [
    { label: '📝 Черновик', value: 'draft' },
    { label: '🔄 В работе', value: 'in_progress' },
    { label: '✅ Завершён', value: 'completed' },
    { label: '🚀 Выпущен', value: 'released' },
  ];

  const keyboard: any[][] = [
    [{ text: '📱 Редактировать в приложении', url: `${MINI_APP_URL}?startapp=edit_project_${projectId}` }],
  ];
  
  // Quick status change buttons
  const availableStatuses = statusOptions.filter(s => s.value !== project.status);
  if (availableStatuses.length > 0) {
    keyboard.push([{ text: '📋 Изменить статус:', callback_data: 'noop' }]);
    for (const s of availableStatuses.slice(0, 2)) {
      keyboard.push([{ text: s.label, callback_data: `project_status_${projectId}_${s.value}` }]);
    }
  }
  
  keyboard.push([{ text: '🗑 Удалить проект', callback_data: `project_delete_confirm_${projectId}` }]);
  keyboard.push([{ text: '🔙 Назад', callback_data: `project_details_${projectId}` }]);

  await editMessageText(chatId, messageId, text, { inline_keyboard: keyboard });
  await answerCallbackQuery(callbackId);
}

/**
 * Change project status
 */
export async function handleProjectStatusChange(
  chatId: number,
  projectId: string,
  newStatus: string,
  userId: number,
  messageId: number,
  callbackId: string
) {
  // Verify ownership
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('telegram_id', userId)
    .single();

  const { data: project } = await supabase
    .from('music_projects')
    .select('user_id')
    .eq('id', projectId)
    .single();

  if (!project || project.user_id !== profile?.user_id) {
    await answerCallbackQuery(callbackId, '❌ Нет доступа');
    return;
  }

  const { error } = await supabase
    .from('music_projects')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', projectId);

  if (error) {
    await answerCallbackQuery(callbackId, '❌ Ошибка обновления');
    return;
  }

  const status = getStatusInfo(newStatus);
  await answerCallbackQuery(callbackId, `✅ Статус: ${status.label}`);
  await handleProjectDetails(chatId, projectId, messageId, '');
}

/**
 * Confirm delete project
 */
export async function handleProjectDeleteConfirm(
  chatId: number,
  projectId: string,
  messageId: number,
  callbackId: string
) {
  const { data: project } = await supabase
    .from('music_projects')
    .select('title')
    .eq('id', projectId)
    .single();

  const text = `⚠️ *Удаление проекта*\n\n` +
    `Вы уверены, что хотите удалить проект\n` +
    `📁 *${escapeMarkdownV2(project?.title || '')}*?\n\n` +
    `❗ Это действие нельзя отменить\\.\n` +
    `Все связанные данные будут удалены\\.`;

  const keyboard = [
    [
      { text: '❌ Отмена', callback_data: `project_edit_${projectId}` },
      { text: '🗑 Удалить', callback_data: `project_delete_${projectId}` },
    ],
  ];

  await editMessageText(chatId, messageId, text, { inline_keyboard: keyboard });
  await answerCallbackQuery(callbackId);
}

/**
 * Delete project
 */
export async function handleProjectDelete(
  chatId: number,
  projectId: string,
  userId: number,
  messageId: number,
  callbackId: string
) {
  // Verify ownership
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('telegram_id', userId)
    .single();

  const { data: project } = await supabase
    .from('music_projects')
    .select('user_id, title')
    .eq('id', projectId)
    .single();

  if (!project || project.user_id !== profile?.user_id) {
    await answerCallbackQuery(callbackId, '❌ Нет доступа');
    return;
  }

  const { error } = await supabase
    .from('music_projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    await answerCallbackQuery(callbackId, '❌ Ошибка удаления');
    return;
  }

  await answerCallbackQuery(callbackId, `✅ Проект "${project.title}" удалён`);
  await handleProjectsCallback(chatId, userId, messageId, '');
}

/**
 * Show project tracks with enhanced display
 */
export async function handleProjectTracks(
  chatId: number,
  projectId: string,
  messageId: number,
  callbackId: string
) {
  const { data: project } = await supabase
    .from('music_projects')
    .select('title')
    .eq('id', projectId)
    .single();

  const { data: projectTracks } = await supabase
    .from('project_tracks')
    .select('id, title, position, status, track_id, lyrics_status')
    .eq('project_id', projectId)
    .order('position', { ascending: true });

  if (!projectTracks || projectTracks.length === 0) {
    const text = `🎵 *Треки проекта*\n` +
      `📁 ${escapeMarkdownV2(project?.title || 'Проект')}\n\n` +
      `Треков пока нет\\.\n\n` +
      `_Добавьте треки в приложении\\._`;
    
    await editMessageText(chatId, messageId, text, {
      inline_keyboard: [
        [{ text: '➕ Добавить трек', url: `${MINI_APP_URL}?startapp=project_${projectId}` }],
        [{ text: '🔙 К проекту', callback_data: `project_details_${projectId}` }],
      ],
    });
    await answerCallbackQuery(callbackId);
    return;
  }

  const statusEmoji: Record<string, string> = {
    'draft': '📝',
    'lyrics_ready': '✍️',
    'generating': '⏳',
    'generated': '🎵',
    'completed': '✅',
    'approved': '✅',
  };

  let text = `🎵 *Треки проекта*\n`;
  text += `📁 ${escapeMarkdownV2(project?.title || 'Проект')}\n\n`;
  
  for (const track of projectTracks) {
    const emoji = statusEmoji[track.status || 'draft'] || '📝';
    const hasAudio = track.track_id ? '🔊' : '🔇';
    text += `${track.position}\\. ${emoji} *${escapeMarkdownV2(track.title)}* ${hasAudio}\n`;
  }

  const completedCount = projectTracks.filter(t => t.track_id).length;
  text += `\n✅ ${completedCount}/${projectTracks.length} готово`;

  const keyboard: any[][] = [];
  
  // Track buttons (only for completed tracks with audio)
  const tracksWithAudio = projectTracks.filter(t => t.track_id).slice(0, 5);
  for (const track of tracksWithAudio) {
    keyboard.push([{ 
      text: `▶️ ${track.position}. ${truncateText(track.title, 20)}`, 
      callback_data: `track_details_${track.track_id}` 
    }]);
  }

  keyboard.push([{ text: '📱 Управление в приложении', url: `${MINI_APP_URL}?startapp=project_${projectId}` }]);
  keyboard.push([{ text: '🔙 К проекту', callback_data: `project_details_${projectId}` }]);

  await editMessageText(chatId, messageId, text, { inline_keyboard: keyboard });
  await answerCallbackQuery(callbackId);
}
