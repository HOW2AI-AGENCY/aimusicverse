import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG, MESSAGES } from '../config.ts';
import { createProjectKeyboard, createProjectListKeyboard } from '../keyboards/main-menu.ts';
import { sendMessage, editMessageText, sendPhoto } from '../telegram-api.ts';
import { createMainMenuKeyboard } from '../keyboards/main-menu.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

export async function handleProjects(chatId: number, userId: number, messageId?: number) {
  try {
    // Get user from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      const text = '❌ Пользователь не найден. Сначала откройте Mini App.';
      if (messageId) {
        await editMessageText(chatId, messageId, text, createMainMenuKeyboard());
      } else {
        await sendMessage(chatId, text, createMainMenuKeyboard());
      }
      return;
    }

    // Get projects with more details
    const { data: projects, error } = await supabase
      .from('music_projects')
      .select('id, title, status, genre, cover_url, total_tracks_count, approved_tracks_count, created_at')
      .eq('user_id', profile.user_id)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching projects:', error);
      const text = '❌ Ошибка при загрузке проектов.';
      if (messageId) {
        await editMessageText(chatId, messageId, text, createMainMenuKeyboard());
      } else {
        await sendMessage(chatId, text, createMainMenuKeyboard());
      }
      return;
    }

    if (!projects || projects.length === 0) {
      if (messageId) {
        await editMessageText(chatId, messageId, MESSAGES.noProjects, createMainMenuKeyboard());
      } else {
        await sendMessage(chatId, MESSAGES.noProjects, createMainMenuKeyboard(), null);
      }
      return;
    }

    // Get actual track counts
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

    let message = '📁 *Ваши проекты*\n\n';
    
    for (const project of projects) {
      const statusEmoji = project.status === 'published' ? '✅' : 
                          project.status === 'in_progress' ? '⏳' : '📝';
      
      const title = project.title || 'Без названия';
      const counts = countMap.get(project.id) || { total: project.total_tracks_count || 0, approved: project.approved_tracks_count || 0 };
      const progress = counts.total > 0 ? Math.round((counts.approved / counts.total) * 100) : 0;
      const progressBar = getProgressBar(progress);
      
      message += `${statusEmoji} *${escapeMarkdown(title)}*\n`;
      if (project.genre) {
        message += `   🎵 ${escapeMarkdown(project.genre)}\n`;
      }
      message += `   ${progressBar} ${counts.approved}/${counts.total} треков\n`;
      message += `   📎 \`${project.id.substring(0, 8)}\`\n\n`;
    }

    message += '_Нажмите на проект чтобы открыть_';

    // Create keyboard with project buttons
    const keyboard = createProjectListKeyboard(projects);

    if (messageId) {
      await editMessageText(chatId, messageId, message, keyboard, 'MarkdownV2');
    } else {
      await sendMessage(chatId, message, keyboard, 'MarkdownV2');
    }
  } catch (error) {
    console.error('Error in projects command:', error);
    const text = '❌ Ошибка при загрузке проектов.';
    if (messageId) {
      await editMessageText(chatId, messageId, text, createMainMenuKeyboard());
    } else {
      await sendMessage(chatId, text, createMainMenuKeyboard());
    }
  }
}

// Helper to generate progress bar
function getProgressBar(percent: number): string {
  const filled = Math.round(percent / 20);
  const empty = 5 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// Helper to escape MarkdownV2 special characters
function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}
