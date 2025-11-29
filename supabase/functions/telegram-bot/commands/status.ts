import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { MESSAGES, BOT_CONFIG } from '../config.ts';
import { sendMessage, editMessageText } from '../telegram-api.ts';
import { createMainMenuKeyboard } from '../keyboards/main-menu.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

export async function handleStatus(chatId: number, userId: number, messageId?: number) {
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
      const text = MESSAGES.processingStatus(0);
      if (messageId) {
        await editMessageText(chatId, messageId, text, createMainMenuKeyboard());
      } else {
        await sendMessage(chatId, text, createMainMenuKeyboard());
      }
      return;
    }

    // Escape markdown special characters
    const escapeMarkdown = (text: string) => text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
    
    let statusText = `⏳ *Статус генерации*\n\nАктивных задач: ${tasks.length}\n\n`;
    const keyboard: any[][] = [];

    tasks.forEach((task, index) => {
      const createdAt = new Date(task.created_at);
      const now = new Date();
      const minutesAgo = Math.floor((now.getTime() - createdAt.getTime()) / 60000);
      const prompt = task.prompt.substring(0, 50) + (task.prompt.length > 50 ? '...' : '');
      
      statusText += `${index + 1}\\. 🎵 ${escapeMarkdown(prompt)}\n`;
      statusText += `   ⏱️ ${minutesAgo < 1 ? 'Только что' : `${minutesAgo} мин назад`}\n`;
      statusText += `   📊 ${task.status === 'pending' ? 'В очереди' : 'Обрабатывается'}\n\n`;
      
      // Add check button for each task
      keyboard.push([{ 
        text: `🔍 Проверить трек ${index + 1}`, 
        callback_data: `check_task_${task.id}` 
      }]);
    });

    statusText += '💡 Нажмите кнопку для проверки статуса трека';
    
    keyboard.push([{ text: '⬅️ Главное меню', callback_data: 'main_menu' }]);

    if (messageId) {
      await editMessageText(chatId, messageId, statusText, { inline_keyboard: keyboard });
    } else {
      await sendMessage(chatId, statusText, { inline_keyboard: keyboard });
    }

  } catch (error) {
    console.error('Error in handleStatus:', error);
    await sendMessage(
      chatId,
      '❌ Ошибка при получении статуса. Попробуйте позже.',
      createMainMenuKeyboard()
    );
  }
}
