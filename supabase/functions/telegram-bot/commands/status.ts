import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { MESSAGES, BOT_CONFIG } from '../config.ts';
import { sendMessage } from '../telegram-api.ts';
import { createMainMenuKeyboard } from '../keyboards/main-menu.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

export async function handleStatus(chatId: number, userId: number) {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      await sendMessage(
        chatId,
        '❌ Пользователь не найден. Войдите в приложение сначала.',
        createMainMenuKeyboard()
      );
      return;
    }

    // Get active generation tasks
    const { data: tasks, error } = await supabase
      .from('generation_tasks')
      .select('*')
      .eq('user_id', profile.user_id)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    if (!tasks || tasks.length === 0) {
      await sendMessage(
        chatId,
        MESSAGES.processingStatus(0),
        createMainMenuKeyboard()
      );
      return;
    }

    let statusText = `⏳ *Статус генерации*\n\nАктивных задач: ${tasks.length}\n\n`;

    tasks.forEach((task, index) => {
      const createdAt = new Date(task.created_at);
      const now = new Date();
      const minutesAgo = Math.floor((now.getTime() - createdAt.getTime()) / 60000);
      
      statusText += `${index + 1}. 🎵 ${task.prompt.substring(0, 50)}${task.prompt.length > 50 ? '...' : ''}\n`;
      statusText += `   ⏱️ ${minutesAgo < 1 ? 'Только что' : `${minutesAgo} мин назад`}\n`;
      statusText += `   📊 ${task.status === 'pending' ? 'В очереди' : 'Обрабатывается'}\n\n`;
    });

    statusText += '💡 Вы получите уведомление, когда треки будут готовы!';

    await sendMessage(chatId, statusText, createMainMenuKeyboard());

  } catch (error) {
    console.error('Error in handleStatus:', error);
    await sendMessage(
      chatId,
      '❌ Ошибка при получении статуса. Попробуйте позже.',
      createMainMenuKeyboard()
    );
  }
}
