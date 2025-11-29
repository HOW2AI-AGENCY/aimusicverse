import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG, MESSAGES } from '../config.ts';
import { createProjectKeyboard } from '../keyboards/main-menu.ts';
import { sendMessage } from '../telegram-api.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

export async function handleProjects(chatId: number, userId: number) {
  try {
    // Get user from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      await sendMessage(chatId, '❌ Пользователь не найден. Сначала откройте Mini App.');
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
      await sendMessage(chatId, '❌ Ошибка при загрузке проектов.');
      return;
    }

    if (!projects || projects.length === 0) {
      await sendMessage(chatId, MESSAGES.noProjects);
      return;
    }

    let message = '📁 Ваши проекты:\n\n';
    
    for (const project of projects) {
      const statusEmoji = project.status === 'completed' ? '✅' : 
                          project.status === 'in_progress' ? '⏳' : '📝';
      
      message += `${statusEmoji} ${project.title}\n`;
      message += `   Статус: ${project.status}\n`;
      message += `   /project_${project.id}\n\n`;
    }

    await sendMessage(chatId, message, projects[0] ? createProjectKeyboard(projects[0].id) : undefined);
  } catch (error) {
    console.error('Error in projects command:', error);
    await sendMessage(chatId, '❌ Ошибка при загрузке проектов.');
  }
}
