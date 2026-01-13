/**
 * /projects command handler
 * Enhanced with progress bars and better formatting
 */

import { getSupabaseClient } from '../core/supabase-client.ts';
import { BOT_CONFIG, MESSAGES } from '../config.ts';
import { createProjectKeyboard, createProjectListKeyboard, createMainMenuKeyboardAsync } from '../keyboards/main-menu.ts';
import { sendMessage, editMessageText, sendPhoto } from '../telegram-api.ts';
import { escapeMarkdown, formatDuration } from '../../_shared/telegram-utils.ts';

const supabase = getSupabaseClient();

// Progress bar generator
function getProgressBar(percent: number, length: number = 5): string {
  const filled = Math.round(percent / (100 / length));
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// Status info helper
function getStatusInfo(status: string): { emoji: string; label: string } {
  const map: Record<string, { emoji: string; label: string }> = {
    'draft': { emoji: '📝', label: 'Черновик' },
    'in_progress': { emoji: '⏳', label: 'В работе' },
    'completed': { emoji: '✅', label: 'Готов' },
    'released': { emoji: '🚀', label: 'Выпущен' },
    'published': { emoji: '🌐', label: 'Опубликован' },
  };
  return map[status] || map['draft'];
}

// Project type info
function getTypeInfo(type: string): { emoji: string; label: string } {
  const map: Record<string, { emoji: string; label: string }> = {
    'single': { emoji: '🎵', label: 'Сингл' },
    'ep': { emoji: '💿', label: 'EP' },
    'album': { emoji: '📀', label: 'Альбом' },
    'mixtape': { emoji: '🎚️', label: 'Микстейп' },
  };
  return map[type] || map['single'];
}

export async function handleProjects(chatId: number, userId: number, messageId?: number) {
  try {
    // Get user from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      const text = '❌ Пользователь не найден\\. Сначала откройте Mini App\\.';
      const keyboard = await createMainMenuKeyboardAsync();
      if (messageId) {
        await editMessageText(chatId, messageId, text, keyboard, 'MarkdownV2');
      } else {
        await sendMessage(chatId, text, keyboard, 'MarkdownV2');
      }
      return;
    }

    // Get projects with more details
    const { data: projects, error } = await supabase
      .from('music_projects')
      .select('id, title, status, project_type, genre, mood, cover_url, total_tracks_count, approved_tracks_count, created_at')
      .eq('user_id', profile.user_id)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching projects:', error);
      const text = '❌ Ошибка при загрузке проектов\\.';
      const keyboard = await createMainMenuKeyboardAsync();
      if (messageId) {
        await editMessageText(chatId, messageId, text, keyboard, 'MarkdownV2');
      } else {
        await sendMessage(chatId, text, keyboard, 'MarkdownV2');
      }
      return;
    }

    if (!projects || projects.length === 0) {
      const noProjectsText = 
        `📁 *Мои проекты*\n\n` +
        `У вас пока нет музыкальных проектов\\.\n\n` +
        `🎵 _Проект \\- это сингл, EP или альбом,\nобъединяющий ваши треки\\._\n\n` +
        `Создайте первый проект в приложении\\!`;
      
      const keyboard = {
        inline_keyboard: [
          [{ text: '➕ Создать проект', web_app: { url: `${BOT_CONFIG.miniAppUrl}/projects` } }],
          [{ text: '🎼 Сгенерировать трек', callback_data: 'quick_actions' }],
          [{ text: '⬅️ Назад', callback_data: 'main_menu' }]
        ]
      };

      if (messageId) {
        await editMessageText(chatId, messageId, noProjectsText, keyboard, 'MarkdownV2');
      } else {
        await sendMessage(chatId, noProjectsText, keyboard, 'MarkdownV2');
      }
      return;
    }

    // Get actual track counts from project_tracks
    const projectIds = projects.map(p => p.id);
    const { data: trackCounts } = await supabase
      .from('project_tracks')
      .select('project_id, track_id')
      .in('project_id', projectIds);

    const countMap = new Map<string, { total: number; approved: number }>();
    trackCounts?.forEach(pt => {
      const existing = countMap.get(pt.project_id) || { total: 0, approved: 0 };
      existing.total++;
      if (pt.track_id) existing.approved++;
      countMap.set(pt.project_id, existing);
    });

    // Build message
    let message = '📁 *Ваши проекты*\n\n';
    
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const status = getStatusInfo(project.status || 'draft');
      const type = getTypeInfo(project.project_type || 'single');
      
      const title = project.title || 'Без названия';
      const counts = countMap.get(project.id) || { 
        total: project.total_tracks_count || 0, 
        approved: project.approved_tracks_count || 0 
      };
      const progress = counts.total > 0 ? Math.round((counts.approved / counts.total) * 100) : 0;
      const progressBar = getProgressBar(progress);
      
      // Project header
      message += `${i + 1}\\. ${status.emoji} *${escapeMarkdown(title)}*\n`;
      
      // Type and genre
      message += `   ${type.emoji} ${escapeMarkdown(type.label)}`;
      if (project.genre) {
        message += ` • 🎵 ${escapeMarkdown(project.genre)}`;
      }
      message += `\n`;
      
      // Progress bar
      message += `   ${progressBar} ${counts.approved}/${counts.total} треков\n`;
      
      // Short ID for reference
      message += `   📎 \`${project.id.substring(0, 8)}\`\n\n`;
    }

    message += '_Нажмите на проект для просмотра_';

    // Create keyboard with project buttons
    const keyboard = createProjectListKeyboard(projects);

    if (messageId) {
      await editMessageText(chatId, messageId, message, keyboard, 'MarkdownV2');
    } else {
      await sendMessage(chatId, message, keyboard, 'MarkdownV2');
    }
  } catch (error) {
    console.error('Error in projects command:', error);
    const text = '❌ Ошибка при загрузке проектов\\.';
    const keyboard = await createMainMenuKeyboardAsync();
    if (messageId) {
      await editMessageText(chatId, messageId, text, keyboard, 'MarkdownV2');
    } else {
      await sendMessage(chatId, text, keyboard, 'MarkdownV2');
    }
  }
}
