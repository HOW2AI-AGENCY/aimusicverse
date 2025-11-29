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

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
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
      // Get track details
      const { data: track } = await supabase
        .from('tracks')
        .select('title, style')
        .eq('id', track_id)
        .single();

      const title = track?.title || 'Трек';
      const style = track?.style || '';

      message = `✅ <b>Ваш трек готов!</b>\n\n`;
      message += `🎵 ${title}\n`;
      if (style) {
        message += `🎸 Стиль: ${style}\n`;
      }

      const miniAppUrl = Deno.env.get('MINI_APP_URL') || 'https://t.me/your_bot/app';
      replyMarkup = {
        inline_keyboard: [[
          { 
            text: '▶️ Прослушать', 
            web_app: { url: `${miniAppUrl}?startapp=track_${track_id}` }
          }
        ]]
      };
    } else if (status === 'failed') {
      message = `❌ <b>Ошибка при генерации</b>\n\n`;
      if (error_message) {
        message += `Причина: ${error_message}\n\n`;
      }
      message += `Попробуйте еще раз с помощью команды /generate`;
    }

    // Send notification
    await sendTelegramMessage(chat_id, message, replyMarkup);

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
