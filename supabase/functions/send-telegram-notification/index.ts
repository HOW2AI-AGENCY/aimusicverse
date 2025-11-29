import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  task_id: string;
  chat_id: number;
  status: string;
  track_id?: string;
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
    thumbnail?: string;
    replyMarkup?: any;
  }
) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      audio: audioUrl,
      caption: options.caption,
      title: options.title,
      performer: options.performer,
      duration: options.duration,
      thumbnail: options.thumbnail,
      parse_mode: 'Markdown',
      reply_markup: options.replyMarkup,
    }),
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
    const { chat_id, status, track_id, error_message } = payload;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let message = '';
    let replyMarkup = undefined;

    if (status === 'completed' && track_id) {
      // Get track details with full info
      const { data: track } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', track_id)
        .single();

      const miniAppUrl = Deno.env.get('MINI_APP_URL') || 'https://t.me/your_bot/app';
      
      // If we have audio URL, send audio file directly
      if (track?.audio_url) {
        const durationSeconds = track.duration_seconds || 0;
        const caption = `🎉 *Ваш трек готов!*\n\n🎵 *${track.title || 'Новый трек'}*\n${track.style ? `🎸 Стиль: ${track.style}` : ''}\n⏱️ Длительность: ${Math.floor(durationSeconds / 60)}:${String(Math.floor(durationSeconds % 60)).padStart(2, '0')}\n\nСлушайте прямо здесь или откройте в приложении! 🎧`;
        
        await sendTelegramAudio(chat_id, track.audio_url, {
          caption,
          title: track.title || 'MusicVerse Track',
          performer: 'MusicVerse AI',
          duration: durationSeconds,
          thumbnail: track.cover_url,
          replyMarkup: {
            inline_keyboard: [
              [{ text: '🎵 Открыть в приложении', web_app: { url: `${miniAppUrl}?startapp=track_${track_id}` } }],
              [
                { text: '🔄 Создать еще', callback_data: 'generate' },
                { text: '📚 Моя библиотека', callback_data: 'library' }
              ]
            ]
          }
        });
      } else {
        // Fallback to text message
        message = `🎉 *Ваш трек готов!*\n\n🎵 *${track?.title || 'Новый трек'}*\n${track?.style ? `🎸 Стиль: ${track.style}` : ''}\n\nОткройте в приложении для прослушивания! 🎧`;
        
        replyMarkup = {
          inline_keyboard: [
            [{ text: '🎧 Открыть трек', web_app: { url: `${miniAppUrl}?startapp=track_${track_id}` } }],
            [{ text: '🔄 Создать еще', callback_data: 'generate' }]
          ]
        };
        
        await sendTelegramMessage(chat_id, message, replyMarkup);
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
      
      await sendTelegramMessage(chat_id, message, replyMarkup);
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
