import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG, MESSAGES } from '../config.ts';
import { createProjectKeyboard } from '../keyboards/main-menu.ts';
import { sendMessage, editMessageText } from '../telegram-api.ts';
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

    // Get projects
    const { data: projects, error } = await supabase
      .from('music_projects')
      .select('id, title, status, created_at')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
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

    let message = '📁 Ваши проекты:\n\n';
    
    for (const project of projects) {
      const statusEmoji = project.status === 'completed' ? '✅' : 
                          project.status === 'in_progress' ? '⏳' : '📝';
      
      const title = project.title || 'Без названия';
      const status = project.status || 'draft';
      message += `${statusEmoji} ${title}\n`;
      message += `   Статус: ${status}\n`;
      message += `   ID: ${project.id.substring(0, 8)}\n\n`;
    }

    if (messageId) {
      await editMessageText(chatId, messageId, message, projects[0] ? createProjectKeyboard(projects[0].id) : createMainMenuKeyboard());
    } else {
      await sendMessage(chatId, message, projects[0] ? createProjectKeyboard(projects[0].id) : createMainMenuKeyboard(), null);
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
