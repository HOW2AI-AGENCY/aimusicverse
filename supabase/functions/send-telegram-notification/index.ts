import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  task_id?: string;
  chat_id?: number;
  chatId?: number;
  status?: string;
  track_id?: string;
  trackId?: string;
  type?: string;
  error_message?: string;
}

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

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
    replyMarkup?: any;
  }
) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

  // Download cover image if provided
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

  // Prepare form data for sending audio with file thumbnail
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    const { chat_id, chatId, status, track_id, trackId, type, error_message } = payload;
    
    const finalChatId = chat_id || chatId;
    const finalTrackId = track_id || trackId;

    if (!finalChatId) {
      throw new Error('chat_id is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let message = '';
    let replyMarkup = undefined;

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
        
        const miniAppUrl = Deno.env.get('MINI_APP_URL') || 'https://t.me/your_bot/app';
        
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

    if (status === 'completed' && finalTrackId) {
      // Get track details with full info
      const { data: track } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', finalTrackId)
        .single();

      const miniAppUrl = Deno.env.get('MINI_APP_URL') || 'https://t.me/your_bot/app';
      
      // If we have audio URL, send audio file directly
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
                { text: '🔄 Создать ремикс', callback_data: `remix_${finalTrackId}` },
                { text: '📥 Скачать MP3', callback_data: `download_${finalTrackId}` }
              ],
              [
                { text: '🎵 Создать еще', callback_data: 'generate' },
                { text: '📚 Библиотека', callback_data: 'library' }
              ]
            ]
          }
        });
      } else {
        // Fallback to text message
        message = `🎉 *Ваш трек готов!*\n\n🎵 *${track?.title || 'Новый трек'}*\n${track?.style ? `🎸 Стиль: ${track.style}` : ''}\n\nОткройте в приложении для прослушивания! 🎧`;
        
        replyMarkup = {
          inline_keyboard: [
            [{ text: '🎧 Открыть трек', web_app: { url: `${miniAppUrl}?startapp=track_${finalTrackId}` } }],
            [{ text: '🔄 Создать еще', callback_data: 'generate' }]
          ]
        };
        
        await sendTelegramMessage(finalChatId, message, replyMarkup);
      }
    } else if (status === 'failed') {
      message = `😔 *Не удалось создать трек*\n\n${error_message || 'Произошла ошибка при генерации'}\n\n💡 *Попробуйте:*\n• Упростить описание\n• Изменить стиль\n• Попробовать через минуту`;
      
      replyMarkup = {
        inline_keyboard: [
          [{ text: '🔄 Попробовать снова', callback_data: 'generate' }],
          [
            { text: '❓ Помощь', callback_data: 'help' },
            { text: '⬅️ Главное меню', callback_data: 'main_menu' }
          ]
        ]
      };
      
      await sendTelegramMessage(finalChatId, message, replyMarkup);
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
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
