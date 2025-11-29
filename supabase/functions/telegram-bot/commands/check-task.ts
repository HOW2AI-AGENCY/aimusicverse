import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { editMessageText } from '../telegram-api.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

export async function handleCheckTask(
  chatId: number, 
  userId: number, 
  taskId: string,
  messageId?: number
) {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      if (messageId) {
        await editMessageText(
          chatId,
          messageId,
          '❌ Пользователь не найден. Войдите в приложение сначала.',
          { inline_keyboard: [[{ text: '⬅️ Назад', callback_data: 'status' }]] }
        );
      }
      return;
    }

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', profile.user_id)
      .single();

    if (taskError || !task) {
      if (messageId) {
        await editMessageText(
          chatId,
          messageId,
          '❌ Задача не найдена',
          { inline_keyboard: [[{ text: '⬅️ Назад', callback_data: 'status' }]] }
        );
      }
      return;
    }

    // If task doesn't have suno_task_id, can't check status
    if (!task.suno_task_id) {
      if (messageId) {
        await editMessageText(
          chatId,
          messageId,
          '❌ Задача ещё не начала генерацию в Suno API',
          { inline_keyboard: [[{ text: '⬅️ Назад', callback_data: 'status' }]] }
        );
      }
      return;
    }

    // Call Suno API to check status
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');
    if (!sunoApiKey) {
      throw new Error('SUNO_API_KEY not configured');
    }

    const sunoResponse = await fetch(
      `https://api.sunoapi.org/api/v1/generate/record-info?taskId=${task.suno_task_id}`,
      {
        headers: {
          'Authorization': `Bearer ${sunoApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!sunoResponse.ok) {
      throw new Error(`Suno API error: ${sunoResponse.status}`);
    }

    const sunoData = await sunoResponse.json();

    if (sunoData.code !== 200) {
      if (messageId) {
        await editMessageText(
          chatId,
          messageId,
          `❌ Ошибка при проверке статуса: ${sunoData.msg || 'Unknown error'}`,
          { inline_keyboard: [[{ text: '⬅️ Назад', callback_data: 'status' }]] }
        );
      }
      return;
    }

    const taskData = sunoData.data;
    let statusText = `🔍 *Проверка трека*\n\n`;
    statusText += `📝 Промпт: ${task.prompt.substring(0, 100)}${task.prompt.length > 100 ? '...' : ''}\n\n`;
    
    // Map status
    const statusMap: Record<string, string> = {
      'PENDING': '⏳ В очереди',
      'TEXT_SUCCESS': '📝 Текст готов',
      'FIRST_SUCCESS': '🎵 Первый клип готов',
      'SUCCESS': '✅ Готово',
      'CREATE_TASK_FAILED': '❌ Ошибка создания',
      'GENERATE_AUDIO_FAILED': '❌ Ошибка генерации',
      'CALLBACK_EXCEPTION': '❌ Ошибка обратного вызова',
      'SENSITIVE_WORD_ERROR': '❌ Обнаружены недопустимые слова'
    };

    statusText += `📊 Статус: ${statusMap[taskData.status] || taskData.status}\n`;
    statusText += `🎼 Тип: ${taskData.type || 'N/A'}\n`;
    
    if (taskData.errorMessage) {
      statusText += `\n⚠️ Ошибка: ${taskData.errorMessage}`;
    }

    if (taskData.response?.sunoData && taskData.response.sunoData.length > 0) {
      const clips = taskData.response.sunoData;
      statusText += `\n\n🎵 *Клипов создано:* ${clips.length}\n`;
      
      clips.forEach((clip: any, index: number) => {
        statusText += `\n${index + 1}. ${clip.title || 'Без названия'}\n`;
        statusText += `   ⏱️ Длительность: ${clip.duration ? Math.floor(clip.duration) + ' сек' : 'N/A'}\n`;
        statusText += `   🎨 Модель: ${clip.modelName || 'N/A'}\n`;
      });
    }

    // Update task status if it's different
    if (taskData.status === 'SUCCESS' && task.status !== 'completed') {
      // Update task to completed
      await supabase
        .from('generation_tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);
      
      statusText += `\n\n✅ Статус обновлён на "завершено"`;
    } else if (taskData.status.includes('FAILED') || taskData.status.includes('ERROR')) {
      // Update task to failed
      await supabase
        .from('generation_tasks')
        .update({ 
          status: 'failed',
          error_message: taskData.errorMessage || 'Generation failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);
      
      statusText += `\n\n❌ Статус обновлён на "ошибка"`;
    }

    if (messageId) {
      await editMessageText(
        chatId,
        messageId,
        statusText,
        { inline_keyboard: [
          [{ text: '🔄 Проверить ещё раз', callback_data: `check_task_${taskId}` }],
          [{ text: '⬅️ Назад к статусу', callback_data: 'status' }]
        ]}
      );
    }

  } catch (error) {
    console.error('Error in handleCheckTask:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (messageId) {
      await editMessageText(
        chatId,
        messageId,
        `❌ Ошибка при проверке: ${errorMessage}`,
        { inline_keyboard: [[{ text: '⬅️ Назад', callback_data: 'status' }]] }
      );
    }
  }
}
