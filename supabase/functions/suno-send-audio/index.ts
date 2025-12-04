import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getTelegramConfig } from '../_shared/telegram-config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const miniAppUrl = Deno.env.get('MINI_APP_URL');

    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    const { chatId, trackId, audioUrl, coverUrl, title, duration, status, errorMessage } = await req.json();

    if (!chatId) {
      throw new Error('chatId is required');
    }

    const telegramApiUrl = `https://api.telegram.org/bot${botToken}`;

    if (status === 'failed') {
      // Send error message
      await fetch(`${telegramApiUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `❌ Ошибка генерации трека\n\n${errorMessage || 'Неизвестная ошибка'}`,
          reply_markup: {
            inline_keyboard: [[
              { text: '🔄 Попробовать ещё', callback_data: 'generate_retry' }
            ]]
          }
        }),
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!audioUrl) {
      throw new Error('audioUrl is required for successful generation');
    }

    // Format duration
    const formatDuration = (seconds: number) => {
      if (!seconds) return '';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const durationText = duration ? formatDuration(duration) : '';

    const telegramConfig = getTelegramConfig();
    const botDeepLink = telegramConfig.deepLinkBase;

    // Send audio file
    const audioMessage: any = {
      chat_id: chatId,
      audio: audioUrl,
      caption: `🎵 ${title || 'Новый трек'}\n${durationText ? `⏱ ${durationText}` : ''}\n\n✨ Сгенерировано с помощью MusicVerse AI`,
      title: title || 'Новый трек',
      performer: 'MusicVerse AI',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '▶️ Открыть в приложении', url: `${botDeepLink}?startapp=track_${trackId}` }
          ],
          [
            { text: '🔄 Создать ещё', callback_data: 'generate_new' }
          ]
        ]
      }
    };

    // Add thumbnail if available
    if (coverUrl) {
      audioMessage.thumb = coverUrl;
    }

    const response = await fetch(`${telegramApiUrl}/sendAudio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(audioMessage),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Telegram API error:', result);
      throw new Error(`Telegram API error: ${result.description || 'Unknown error'}`);
    }

    console.log('Audio sent successfully to Telegram');

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in suno-send-audio:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});