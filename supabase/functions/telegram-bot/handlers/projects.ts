/**
 * Project handlers for Telegram bot
 */

import { sendMessage, editMessageText, answerCallbackQuery, deleteMessage, sendPhoto } from '../telegram-api.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { escapeMarkdownV2 } from '../utils/text-processor.ts';
import { deleteActiveMenu, setActiveMenuMessageId } from '../core/active-menu-manager.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const MINI_APP_URL = Deno.env.get('MINI_APP_URL') || 'https://t.me/PhuketMusicBot/app';

/**
 * Show projects list
 */
export async function handleProjectsCallback(
  chatId: number,
  userId: number,
  messageId: number,
  callbackId: string,
  page: number = 0
) {
  const pageSize = 6;
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

  // Get user's projects
  const { data: projects, count } = await supabase
    .from('music_projects')
    .select('id, title, description, status, project_type, cover_url, genre, mood', { count: 'exact' })
    .eq('user_id', profile.user_id)
    .order('updated_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (!projects || projects.length === 0) {
    const text = `📁 *Мои проекты*\n\nУ вас пока нет проектов\\.\n\nСоздайте первый музыкальный проект\\!`;
    
    await editMessageText(chatId, messageId, text, {
      inline_keyboard: [
        [{ text: '➕ Создать проект', url: `${MINI_APP_URL}?startapp=content-hub` }],
        [{ text: '🔙 Назад', callback_data: 'nav_main' }],
      ],
    });
    await answerCallbackQuery(callbackId);
    return;
  }

  const totalPages = Math.ceil((count || 0) / pageSize);
  
  const statusEmoji: Record<string, string> = {
    'draft': '📝',
    'in_progress': '🔄',
    'completed': '✅',
    'released': '🚀',
  };

  const typeEmoji: Record<string, string> = {
    'single': '🎵',
    'ep': '💿',
    'album': '📀',
    'mixtape': '🎚️',
  };

  let text = `📁 *Мои проекты*\n\n`;
  
  projects.forEach((project, idx) => {
    const num = offset + idx + 1;
    const status = statusEmoji[project.status || 'draft'] || '📝';
    const type = typeEmoji[project.project_type || 'single'] || '🎵';
    
    text += `${num}\\. ${type}${status} *${escapeMarkdownV2(project.title)}*\n`;
    if (project.genre) text += `    _${escapeMarkdownV2(project.genre)}_\n`;
  });

  if (totalPages > 1) {
    text += `\n📄 Страница ${page + 1} из ${totalPages}`;
  }

  // Build keyboard
  const keyboard: any[][] = [];
  
  // Project buttons
  for (let i = 0; i < projects.length; i += 2) {
    const row: any[] = [];
    row.push({ text: `${offset + i + 1}. ${projects[i].title.substring(0, 12)}`, callback_data: `project_details_${projects[i].id}` });
    if (projects[i + 1]) {
      row.push({ text: `${offset + i + 2}. ${projects[i + 1].title.substring(0, 12)}`, callback_data: `project_details_${projects[i + 1].id}` });
    }
    keyboard.push(row);
  }

  // Pagination
  if (totalPages > 1) {
    const paginationRow: any[] = [];
    if (page > 0) paginationRow.push({ text: '◀️', callback_data: `projects_page_${page - 1}` });
    if (page < totalPages - 1) paginationRow.push({ text: '▶️', callback_data: `projects_page_${page + 1}` });
    if (paginationRow.length > 0) keyboard.push(paginationRow);
  }

  keyboard.push([{ text: '➕ Создать проект', url: `${MINI_APP_URL}?startapp=content-hub` }]);
  keyboard.push([{ text: '🔙 В меню', callback_data: 'nav_main' }]);

  await editMessageText(chatId, messageId, text, { inline_keyboard: keyboard });
  await answerCallbackQuery(callbackId);
}

/**
 * Show project details
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

  // Get track count
  const { count: trackCount } = await supabase
    .from('project_tracks')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId);

  const statusLabels: Record<string, string> = {
    'draft': '📝 Черновик',
    'in_progress': '🔄 В работе',
    'completed': '✅ Завершён',
    'released': '🚀 Выпущен',
  };

  const typeLabels: Record<string, string> = {
    'single': '🎵 Сингл',
    'ep': '💿 EP',
    'album': '📀 Альбом',
    'mixtape': '🎚️ Микстейп',
  };

  let text = `📁 *${escapeMarkdownV2(project.title)}*\n\n`;
  
  text += `${typeLabels[project.project_type || 'single'] || '🎵 Сингл'}\n`;
  text += `${statusLabels[project.status || 'draft']}\n\n`;

  if (project.description) {
    text += `📝 _${escapeMarkdownV2(project.description)}_\n\n`;
  }

  if (project.genre) text += `🎵 *Жанр:* ${escapeMarkdownV2(project.genre)}\n`;
  if (project.mood) text += `💫 *Настроение:* ${escapeMarkdownV2(project.mood)}\n`;
  if (project.key_signature) text += `🎹 *Тональность:* ${escapeMarkdownV2(project.key_signature)}\n`;
  
  text += `\n📊 *Треков:* ${trackCount || 0}`;

  if (project.release_date) {
    text += `\n📅 *Релиз:* ${new Date(project.release_date).toLocaleDateString('ru-RU')}`;
  }

  const keyboard = [
    [
      { text: '✏️ Редактировать', callback_data: `project_edit_${projectId}` },
      { text: '🎵 Треки', callback_data: `project_tracks_${projectId}` },
    ],
    [{ text: '📱 Открыть в приложении', url: `${MINI_APP_URL}?startapp=project_${projectId}` }],
    [{ text: '🔙 К списку', callback_data: 'nav_projects' }],
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

  const statusOptions = [
    { label: '📝 Черновик', value: 'draft' },
    { label: '🔄 В работе', value: 'in_progress' },
    { label: '✅ Завершён', value: 'completed' },
    { label: '🚀 Выпущен', value: 'released' },
  ];

  const currentStatus = statusOptions.find(s => s.value === project.status) || statusOptions[0];

  const text = `✏️ *Редактирование: ${escapeMarkdownV2(project.title)}*\n\n` +
    `Текущий статус: ${currentStatus.label}\n\n` +
    `Для полного редактирования откройте приложение\\.`;

  const keyboard: any[][] = [
    [{ text: '📱 Редактировать в приложении', url: `${MINI_APP_URL}?startapp=edit_project_${projectId}` }],
  ];
  
  // Quick status change
  statusOptions
    .filter(s => s.value !== project.status)
    .slice(0, 2)
    .forEach(s => {
      keyboard.push([{ text: `Изменить на: ${s.label}`, callback_data: `project_status_${projectId}_${s.value}` }]);
    });
  
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
    .update({ status: newStatus })
    .eq('id', projectId);

  if (error) {
    await answerCallbackQuery(callbackId, '❌ Ошибка обновления');
    return;
  }

  await answerCallbackQuery(callbackId, '✅ Статус обновлён');
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
    `Вы уверены, что хотите удалить проект *${escapeMarkdownV2(project?.title || '')}*?\n\n` +
    `Это действие нельзя отменить\\. Все связанные данные будут удалены\\.`;

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
    .select('user_id')
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

  await answerCallbackQuery(callbackId, '✅ Проект удалён');
  await handleProjectsCallback(chatId, userId, messageId, '');
}

/**
 * Show project tracks
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
    .select('id, title, position, status, track_id')
    .eq('project_id', projectId)
    .order('position', { ascending: true });

  if (!projectTracks || projectTracks.length === 0) {
    const text = `🎵 *Треки проекта ${escapeMarkdownV2(project?.title || '')}*\n\nТреков пока нет\\.`;
    
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
    'generated': '🎵',
    'completed': '✅',
  };

  let text = `🎵 *Треки: ${escapeMarkdownV2(project?.title || '')}*\n\n`;
  
  projectTracks.forEach((track) => {
    const status = statusEmoji[track.status || 'draft'] || '📝';
    text += `${track.position}\\. ${status} *${escapeMarkdownV2(track.title)}*\n`;
  });

  const keyboard: any[][] = [];
  
  // Track buttons
  for (const track of projectTracks.slice(0, 6)) {
    if (track.track_id) {
      keyboard.push([{ text: `🎵 ${track.title}`, callback_data: `track_details_${track.track_id}` }]);
    }
  }

  keyboard.push([{ text: '📱 Управление в приложении', url: `${MINI_APP_URL}?startapp=project_${projectId}` }]);
  keyboard.push([{ text: '🔙 К проекту', callback_data: `project_details_${projectId}` }]);

  await editMessageText(chatId, messageId, text, { inline_keyboard: keyboard });
  await answerCallbackQuery(callbackId);
}
