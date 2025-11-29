import { CommandContext } from 'https://deno.land/x/grammy@v1.21.1/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG, MESSAGES } from '../config.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

export async function handleGenerate(ctx: CommandContext<any>) {
  const prompt = ctx.match;
  
  if (!prompt || String(prompt).trim().length === 0) {
    await ctx.reply('❌ Укажите описание трека.\n\nПример: /generate энергичный рок трек');
    return;
  }

  const telegramUserId = ctx.from?.id;
  if (!telegramUserId) {
    await ctx.reply('❌ Не удалось определить пользователя.');
    return;
  }

  try {
    // Get user from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', telegramUserId)
      .single();

    if (!profile) {
      await ctx.reply('❌ Пользователь не найден. Сначала откройте Mini App.');
      return;
    }

    // Create generation task
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .insert({
        user_id: profile.user_id,
        prompt: String(prompt),
        telegram_chat_id: ctx.chat?.id,
        source: 'telegram_bot',
        status: 'pending',
      })
      .select()
      .single();

    if (taskError || !task) {
      console.error('Task creation error:', taskError);
      await ctx.reply(MESSAGES.generationError);
      return;
    }

    // Start generation via edge function
    const { error: generateError } = await supabase.functions.invoke('generate-music', {
      body: {
        prompt: String(prompt),
        taskId: task.id,
      },
    });

    if (generateError) {
      console.error('Generation error:', generateError);
      await supabase
        .from('generation_tasks')
        .update({ status: 'failed', error_message: generateError.message })
        .eq('id', task.id);
      
      await ctx.reply(MESSAGES.generationError);
      return;
    }

    await ctx.reply(MESSAGES.generationStarted);
  } catch (error) {
    console.error('Error in generate command:', error);
    await ctx.reply(MESSAGES.generationError);
  }
}
