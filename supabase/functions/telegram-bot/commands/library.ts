import { CommandContext } from 'https://deno.land/x/grammy@v1.21.1/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG, MESSAGES } from '../config.ts';
import { createTrackKeyboard } from '../keyboards/main-menu.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

export async function handleLibrary(ctx: CommandContext<any>) {
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

    // Get last 5 tracks
    const { data: tracks, error } = await supabase
      .from('tracks')
      .select('id, title, style, created_at, status')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching tracks:', error);
      await ctx.reply('❌ Ошибка при загрузке треков.');
      return;
    }

    if (!tracks || tracks.length === 0) {
      await ctx.reply(MESSAGES.noTracks);
      return;
    }

    let message = '🎵 Ваши последние треки:\n\n';
    
    for (const track of tracks) {
      const title = track.title || 'Без названия';
      const style = track.style || 'Без стиля';
      const statusEmoji = track.status === 'completed' ? '✅' : '⏳';
      
      message += `${statusEmoji} ${title}\n`;
      message += `   Стиль: ${style}\n`;
      message += `   /track_${track.id}\n\n`;
    }

    await ctx.reply(message, {
      reply_markup: createTrackKeyboard(tracks[0].id),
    });
  } catch (error) {
    console.error('Error in library command:', error);
    await ctx.reply('❌ Ошибка при загрузке библиотеки.');
  }
}
