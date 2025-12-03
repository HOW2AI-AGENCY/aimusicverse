import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  task_id?: string;
  chat_id?: number;
  chatId?: number;
  user_id?: string;
  status?: string;
  track_id?: string;
  trackId?: string;
  type?: string;
  error_message?: string;
  audioUrl?: string;
  coverUrl?: string;
  title?: string;
  duration?: number;
  tags?: string;
  style?: string;
  versionsCount?: number;
  generationMode?: string;
}

interface NotificationSettings {
  notify_completed: boolean;
  notify_failed: boolean;
  notify_progress: boolean;
  notify_stem_ready: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: unknown) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN not configured');

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      reply_markup: replyMarkup,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram API error: ${error}`);
  }

  return response.json();
}

async function sendTelegramAudio(
  chatId: number, 
  audioUrl: string, 
  options: {
    caption?: string;
    title?: string;
    performer?: string;
    duration?: number;
    coverUrl?: string;
    replyMarkup?: unknown;
  }
) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN not configured');

  let thumbBlob: Blob | null = null;
  if (options.coverUrl) {
    try {
      const thumbResponse = await fetch(options.coverUrl);
      if (thumbResponse.ok) {
        thumbBlob = await thumbResponse.blob();
      }
    } catch (error) {
      console.error('Error downloading cover:', error);
    }
  }

  const formData = new FormData();
  formData.append('chat_id', chatId.toString());
  formData.append('audio', audioUrl);
  if (options.caption) formData.append('caption', options.caption);
  if (options.title) formData.append('title', options.title);
  if (options.performer) formData.append('performer', options.performer);
  if (options.duration) formData.append('duration', options.duration.toString());
  if (thumbBlob) formData.append('thumbnail', thumbBlob, 'cover.jpg');
  formData.append('parse_mode', 'Markdown');
  if (options.replyMarkup) formData.append('reply_markup', JSON.stringify(options.replyMarkup));

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram API error: ${error}`);
  }

  return response.json();
}

/**
 * Check if notification should be sent based on user settings
 */
async function canSendNotification(
  supabase: any,
  userId: string | undefined,
  chatId: number,
  notificationType: string
): Promise<boolean> {
  try {
    let settings: NotificationSettings | null = null;

    if (userId) {
      const { data } = await supabase
        .from('user_notification_settings')
        .select('notify_completed, notify_failed, notify_progress, notify_stem_ready')
        .eq('user_id', userId)
        .single();
      settings = data as NotificationSettings | null;
    }

    if (!settings) {
      const { data } = await supabase
        .from('user_notification_settings')
        .select('notify_completed, notify_failed, notify_progress, notify_stem_ready')
        .eq('telegram_chat_id', chatId)
        .single();
      settings = data as NotificationSettings | null;
    }

    if (!settings) return true;

    switch (notificationType) {
      case 'completed':
      case 'generation_complete':
        return settings.notify_completed !== false;
      case 'failed':
        return settings.notify_failed !== false;
      case 'progress':
        return settings.notify_progress === true;
      case 'stem_ready':
        return settings.notify_stem_ready !== false;
      default:
        return true;
    }
  } catch {
    return true;
  }
}

/**
 * Get chat_id for a user
 */
async function getChatIdForUser(
  supabase: any,
  userId: string
): Promise<number | null> {
  try {
    const { data: settings } = await supabase
      .from('user_notification_settings')
      .select('telegram_chat_id')
      .eq('user_id', userId)
      .single();

    if (settings?.telegram_chat_id) {
      return settings.telegram_chat_id as number;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('telegram_chat_id, telegram_id')
      .eq('user_id', userId)
      .single();

    return (profile?.telegram_chat_id || profile?.telegram_id || null) as number | null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    const { 
      chat_id, chatId, user_id, status, track_id, trackId, type, error_message,
      audioUrl, coverUrl, title, duration, tags, style, versionsCount, generationMode
    } = payload;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Determine chat_id
    let finalChatId = chat_id || chatId;
    
    // If no chat_id provided but user_id is, look up chat_id
    if (!finalChatId && user_id) {
      finalChatId = await getChatIdForUser(supabase, user_id) || undefined;
    }

    const finalTrackId = track_id || trackId;

    if (!finalChatId) {
      console.warn('No chat_id available for notification');
      return new Response(
        JSON.stringify({ success: false, error: 'No chat_id available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user wants this type of notification
    const notificationType = type || status || 'general';
    const canSend = await canSendNotification(supabase, user_id, finalChatId, notificationType);
    
    if (!canSend) {
      console.log('Notification blocked by user settings:', { chatId: finalChatId, type: notificationType });
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'user_settings' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const miniAppUrl = Deno.env.get('MINI_APP_URL') || 'https://t.me/AIMusicVerseBot/app';

    // Handle generation complete with direct data
    if (type === 'generation_complete' && audioUrl) {
      console.log('📤 Sending generation complete notification with audio');
      
      const durationText = duration 
        ? `⏱️ ${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`
        : '';
      
      const tagsText = tags 
        ? `\n🏷️ ${tags.split(',').slice(0, 3).map(t => `#${t.trim().replace(/\s/g, '_')}`).join(' ')}`
        : '';
      
      const versionsText = versionsCount && versionsCount > 1
        ? `\n🎭 Создано версий: ${versionsCount}`
        : '';
      
      const modeEmoji = generationMode === 'upload_cover' ? '🎤' 
        : generationMode === 'upload_extend' ? '⏩'
        : generationMode === 'add_vocals' ? '🎙️'
        : generationMode === 'add_instrumental' ? '🎸'
        : '🎵';
      
      const modeText = generationMode === 'upload_cover' ? 'Кавер готов' 
        : generationMode === 'upload_extend' ? 'Расширение готово'
        : generationMode === 'add_vocals' ? 'Вокал добавлен'
        : generationMode === 'add_instrumental' ? 'Инструментал добавлен'
        : 'Генерация завершена';
      
      const caption = `${modeEmoji} *${modeText}!*\n\n🎵 *${title || 'Новый трек'}*${style ? `\n🎸 ${style.split(',')[0]}` : ''}${durationText ? `\n${durationText}` : ''}${tagsText}${versionsText}\n\n✨ _Создано с помощью AI_ ✨`;
      
      await sendTelegramAudio(finalChatId, audioUrl, {
        caption,
        title: title || 'AI Music Track',
        performer: 'AIMusicVerse AI',
        duration: duration ? Math.round(duration) : undefined,
        coverUrl: coverUrl,
        replyMarkup: {
          inline_keyboard: [
            [{ text: '🎵 Открыть в приложении', web_app: { url: `${miniAppUrl}?startapp=track_${finalTrackId}` } }],
            [
              { text: '📝 Текст', callback_data: `lyrics_${finalTrackId}` },
              { text: '📊 Статистика', callback_data: `stats_${finalTrackId}` }
            ],
            [
              { text: '🔄 Ремикс', callback_data: `remix_${finalTrackId}` },
              { text: '🎨 Студия', callback_data: `studio_${finalTrackId}` }
            ],
            [
              { text: '🎵 Создать еще', callback_data: 'generate' },
              { text: '📚 Библиотека', callback_data: 'library' }
            ]
          ]
        }
      });

      return new Response(
        JSON.stringify({ success: true, type: 'generation_complete' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle track share type
    if (type === 'track_share' && finalTrackId) {
      const { data: track } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', finalTrackId)
        .single();

      if (track?.audio_url) {
        const durationText = track.duration_seconds 
          ? `⏱️ ${Math.floor(track.duration_seconds / 60)}:${String(Math.floor(track.duration_seconds % 60)).padStart(2, '0')}`
          : '';
        
        const tagsText = track.tags 
          ? `\n🏷️ ${track.tags.split(',').slice(0, 3).map((t: string) => `#${t.trim()}`).join(' ')}`
          : '';
        
        const caption = `🎵 *${track.title || 'Новый трек'}*${track.style ? `\n🎸 ${track.style}` : ''}${durationText ? `\n${durationText}` : ''}${tagsText}\n\n_Создано в AIMusicVerse_ ✨`;
        
        await sendTelegramAudio(finalChatId, track.audio_url, {
          caption,
          title: track.title || 'AIMusicVerse Track',
          performer: 'AIMusicVerse AI',
          duration: track.duration_seconds || undefined,
          coverUrl: track.cover_url,
          replyMarkup: {
            inline_keyboard: [
              [{ text: '🎵 Открыть в приложении', web_app: { url: `${miniAppUrl}?startapp=track_${finalTrackId}` } }],
              [
                { text: '🔄 Создать ремикс', callback_data: `remix_${finalTrackId}` },
                { text: '📤 Поделиться', callback_data: `share_${finalTrackId}` }
              ]
            ]
          }
        });

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle completed status
    if (status === 'completed' && finalTrackId) {
      const { data: track } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', finalTrackId)
        .single();
      
      if (track?.audio_url) {
        const durationSeconds = track.duration_seconds || 0;
        const durationText = `${Math.floor(durationSeconds / 60)}:${String(Math.floor(durationSeconds % 60)).padStart(2, '0')}`;
        
        const tagsText = track.tags 
          ? `\n🏷️ ${track.tags.split(',').slice(0, 3).map((t: string) => `#${t.trim()}`).join(' ')}`
          : '';
        
        const lyricsPreview = track.lyrics 
          ? `\n\n📝 _${track.lyrics.slice(0, 100)}${track.lyrics.length > 100 ? '...' : ''}_`
          : '';
        
        const caption = `🎉 *Ваш трек готов!*\n\n🎵 *${track.title || 'Новый трек'}*${track.style ? `\n🎸 ${track.style}` : ''}\n⏱️ ${durationText}${tagsText}${lyricsPreview}\n\n✨ _Создано с помощью AI_ ✨`;
        
        await sendTelegramAudio(finalChatId, track.audio_url, {
          caption,
          title: track.title || 'MusicVerse Track',
          performer: 'MusicVerse AI',
          duration: durationSeconds,
          coverUrl: track.cover_url,
          replyMarkup: {
            inline_keyboard: [
              [{ text: '🎵 Открыть в приложении', web_app: { url: `${miniAppUrl}?startapp=track_${finalTrackId}` } }],
              [
                { text: '📝 Текст', callback_data: `lyrics_${finalTrackId}` },
                { text: '📊 Статистика', callback_data: `stats_${finalTrackId}` }
              ],
              [
                { text: '🔄 Ремикс', callback_data: `remix_${finalTrackId}` },
                { text: '📥 Скачать', callback_data: `dl_${finalTrackId}` }
              ],
              [
                { text: '🎵 Создать еще', callback_data: 'generate' },
                { text: '📚 Библиотека', callback_data: 'library' }
              ]
            ]
          }
        });
      } else {
        const message = `🎉 *Ваш трек готов!*\n\n🎵 *${track?.title || 'Новый трек'}*\n${track?.style ? `🎸 Стиль: ${track.style}` : ''}\n\nОткройте в приложении для прослушивания! 🎧`;
        
        await sendTelegramMessage(finalChatId, message, {
          inline_keyboard: [
            [{ text: '🎧 Открыть трек', web_app: { url: `${miniAppUrl}?startapp=track_${finalTrackId}` } }],
            [{ text: '🔄 Создать еще', callback_data: 'generate' }]
          ]
        });
      }
    } else if (status === 'failed') {
      const message = `😔 *Не удалось создать трек*\n\n${error_message || 'Произошла ошибка при генерации'}\n\n💡 *Попробуйте:*\n• Упростить описание\n• Изменить стиль\n• Попробовать через минуту`;
      
      await sendTelegramMessage(finalChatId, message, {
        inline_keyboard: [
          [{ text: '🔄 Попробовать снова', callback_data: 'generate' }],
          [
            { text: '❓ Помощь', callback_data: 'help' },
            { text: '⬅️ Главное меню', callback_data: 'main_menu' }
          ]
        ]
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
