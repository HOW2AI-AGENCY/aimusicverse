import { getSupabaseClient } from '../core/supabase-client.ts';
import { MESSAGES, BOT_CONFIG } from '../config.ts';
import { sendMessage, editMessageText } from '../telegram-api.ts';
import { 
  buildMessage, 
  createSection, 
  createList,
  createErrorMessage,
  formatRelativeTime 
} from '../utils/message-formatter.ts';
import { ButtonBuilder } from '../utils/button-builder.ts';
import { trackMessage } from '../utils/message-manager.ts';
import { escapeMarkdownV2, truncateText } from '../utils/text-processor.ts';

const supabase = getSupabaseClient();

export async function handleStatus(chatId: number, userId: number, messageId?: number) {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      const errorMsg = createErrorMessage(
        'Профиль не найден',
        ['Откройте приложение для регистрации']
      );
      
      const keyboard = new ButtonBuilder()
        .addButton({
          text: 'Открыть студию',
          emoji: '🚀',
          action: { type: 'webapp', url: BOT_CONFIG.miniAppUrl }
        })
        .build();
      
      await sendMessage(chatId, errorMsg, keyboard, 'MarkdownV2');
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
      const statusMsg = buildMessage({
        title: 'Статус генерации',
        emoji: '⏳',
        description: 'У вас нет активных задач генерации',
        sections: [
          {
            title: 'Начните создавать',
            content: [
              'Используйте /generate для создания трека',
              'Откройте студию для полного функционала',
              'Просмотрите готовые треки в библиотеке'
            ],
            emoji: '💡',
            style: 'list'
          }
        ]
      });
      
      const keyboard = new ButtonBuilder()
        .addButton({
          text: 'Создать трек',
          emoji: '🎼',
          action: { type: 'callback', data: 'nav_generate' }
        })
        .addButton({
          text: 'Мои треки',
          emoji: '📚',
          action: { type: 'callback', data: 'nav_library' }
        })
        .addButton({
          text: 'Главное меню',
          emoji: '🏠',
          action: { type: 'callback', data: 'nav_main' }
        })
        .build();
      
      if (messageId) {
        await editMessageText(chatId, messageId, statusMsg, keyboard);
        await trackMessage(chatId, messageId, 'status', 'generation', { expiresIn: 60000 });
      } else {
        const result = await sendMessage(chatId, statusMsg, keyboard, 'MarkdownV2');
        if (result?.result?.message_id) {
          await trackMessage(chatId, result.result.message_id, 'status', 'generation', { expiresIn: 60000 });
        }
      }
      return;
    }

    // Build task list
    const taskItems = tasks.map((task, index) => {
      const prompt = truncateText(task.prompt, 50);
      const timeAgo = formatRelativeTime(new Date(task.created_at));
      const statusEmoji = task.status === 'pending' ? '⏱️' : '🔄';
      const statusText = task.status === 'pending' ? 'В очереди' : 'Обрабатывается';
      
      return `${index + 1}\\. 🎵 ${escapeMarkdownV2(prompt)}\n   ${statusEmoji} ${statusText} \\(${timeAgo}\\)`;
    });
    
    const statusMsg = buildMessage({
      title: 'Статус генерации',
      emoji: '⏳',
      description: `Активных задач: ${tasks.length}`,
      sections: [
        {
          title: 'Треки в процессе',
          content: taskItems.join('\n\n'),
          emoji: '🎵'
        }
      ],
      footer: 'Нажмите кнопку для проверки статуса конкретного трека'
    });
    
    // Build keyboard with check buttons
    const keyboard = new ButtonBuilder();
    
    tasks.forEach((task, index) => {
      if (index < 5) { // Limit to 5 tasks to avoid too many buttons
        keyboard.addButton({
          text: `Проверить трек ${index + 1}`,
          emoji: '🔍',
          action: { type: 'callback', data: `check_task_${task.id}` }
        });
      }
    });
    
    keyboard
      .addButton({
        text: 'Обновить',
        emoji: '🔄',
        action: { type: 'callback', data: 'nav_status' }
      })
      .addButton({
        text: 'Главное меню',
        emoji: '🏠',
        action: { type: 'callback', data: 'nav_main' }
      });

    if (messageId) {
      await editMessageText(chatId, messageId, statusMsg, keyboard.build());
      await trackMessage(chatId, messageId, 'status', 'generation', { expiresIn: 120000 }); // 2 minutes
    } else {
      const result = await sendMessage(chatId, statusMsg, keyboard.build(), 'MarkdownV2');
      if (result?.result?.message_id) {
        await trackMessage(chatId, result.result.message_id, 'status', 'generation', { expiresIn: 120000 });
      }
    }

  } catch (error) {
    console.error('Error in handleStatus:', error);
    
    const errorMsg = createErrorMessage(
      'Ошибка при получении статуса',
      ['Повторите попытку', 'Проверьте соединение']
    );
    
    const keyboard = new ButtonBuilder()
      .addButton({
        text: 'Попробовать снова',
        emoji: '🔄',
        action: { type: 'callback', data: 'nav_status' }
      })
      .addButton({
        text: 'Главное меню',
        emoji: '🏠',
        action: { type: 'callback', data: 'nav_main' }
      })
      .build();
    
    await sendMessage(chatId, errorMsg, keyboard, 'MarkdownV2');
  }
}
