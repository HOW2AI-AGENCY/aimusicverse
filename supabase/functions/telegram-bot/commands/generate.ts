import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG, MESSAGES } from '../config.ts';
import { sendMessage } from '../telegram-api.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

export async function handleGenerate(chatId: number, userId: number, prompt: string) {
  if (!prompt || prompt.trim().length === 0) {
    await sendMessage(chatId, '❌ Укажите описание трека.\n\nПример: /generate энергичный рок трек');
    return;
  }

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

    // Create generation task
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .insert({
        user_id: profile.user_id,
        prompt: prompt,
        telegram_chat_id: chatId,
        source: 'telegram_bot',
        status: 'pending',
      })
      .select()
      .single();

    if (taskError || !task) {
      console.error('Task creation error:', taskError);
      await sendMessage(chatId, MESSAGES.generationError);
      return;
    }

    // Start generation via edge function
    const { error: generateError } = await supabase.functions.invoke('generate-music', {
      body: {
        prompt: prompt,
        taskId: task.id,
      },
    });

    if (generateError) {
      console.error('Generation error:', generateError);
      await supabase
        .from('generation_tasks')
        .update({ status: 'failed', error_message: generateError.message })
        .eq('id', task.id);
      
      await sendMessage(chatId, MESSAGES.generationError);
      return;
    }

    await sendMessage(chatId, MESSAGES.generationStarted);
  } catch (error) {
    console.error('Error in generate command:', error);
    await sendMessage(chatId, MESSAGES.generationError);
  }
}
