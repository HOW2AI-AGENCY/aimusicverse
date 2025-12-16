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

    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    const { chatId, trackId, audioUrl, coverUrl, title, duration, status, errorMessage, versionLabel } = await req.json();

    if (!chatId) {
      throw new Error('chatId is required');
    }

    const telegramApiUrl = `https://api.telegram.org/bot${botToken}`;

    if (status === 'failed') {
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

    // Sanitize title for filename
    const sanitizeFilename = (name: string) => {
      return name
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 60);
    };

    const trackTitle = title || 'Новый трек';
    const filename = `${sanitizeFilename(trackTitle)}.mp3`;

    console.log(`📤 Sending audio to Telegram: ${trackTitle}`);
    console.log(`📎 Audio URL: ${audioUrl.substring(0, 100)}...`);

    // Download audio file as blob for proper title display
    let audioBlob: Blob | null = null;
    try {
      console.log('⬇️ Downloading audio file...');
      const audioResponse = await fetch(audioUrl);
      if (audioResponse.ok) {
        audioBlob = await audioResponse.blob();
        console.log(`✅ Audio downloaded: ${audioBlob.size} bytes`);
      } else {
        console.warn(`⚠️ Failed to download audio: ${audioResponse.status}`);
      }
    } catch (downloadError) {
      console.warn('⚠️ Audio download error:', downloadError);
    }

    // Download thumbnail if available
    let thumbBlob: Blob | null = null;
    if (coverUrl) {
      try {
        const thumbResponse = await fetch(coverUrl);
        if (thumbResponse.ok) {
          thumbBlob = await thumbResponse.blob();
          console.log(`✅ Thumbnail downloaded: ${thumbBlob.size} bytes`);
        }
      } catch (thumbError) {
        console.warn('⚠️ Thumbnail download error:', thumbError);
      }
    }

    // Build unified caption format
    const versionSuffix = versionLabel ? ` — ${versionLabel}` : '';
    let caption = `🎵 *${trackTitle}${versionSuffix}*`;
    if (durationText) caption += `\n⏱️ ${durationText}`;
    caption += `\n\n🤖 _@AIMusicVerseBot_`;

    let response: Response;
    let result: any;

    // Unified inline keyboard
    const replyMarkup = {
      inline_keyboard: [
        [{ text: '▶️ Открыть трек', url: `${botDeepLink}?startapp=track_${trackId}` }],
        [
          { text: '🔄 Создать ещё', callback_data: 'generate_new' },
          { text: '🏠 Меню', callback_data: 'main_menu' }
        ]
      ]
    };

    // Use FormData for proper title display in Telegram
    if (audioBlob) {
      console.log('📦 Sending via FormData (blob)...');
      const formData = new FormData();
      formData.append('chat_id', chatId.toString());
      formData.append('audio', audioBlob, filename);
      formData.append('title', trackTitle);
      formData.append('performer', 'MusicVerse AI');
      formData.append('caption', caption);
      formData.append('parse_mode', 'Markdown');
      
      if (duration) {
        formData.append('duration', Math.round(duration).toString());
      }

      if (thumbBlob) {
        formData.append('thumbnail', thumbBlob, 'cover.jpg');
      }

      formData.append('reply_markup', JSON.stringify(replyMarkup));

      response = await fetch(`${telegramApiUrl}/sendAudio`, {
        method: 'POST',
        body: formData,
      });
      result = await response.json();
    } else {
      // Fallback: send URL directly (titles may not display correctly)
      console.log('📦 Sending via JSON (URL fallback)...');
      const audioMessage = {
        chat_id: chatId,
        audio: audioUrl,
        caption,
        parse_mode: 'Markdown',
        title: trackTitle,
        performer: 'MusicVerse AI',
        duration: duration ? Math.round(duration) : undefined,
        thumbnail: coverUrl || undefined,
        reply_markup: replyMarkup
      };

      response = await fetch(`${telegramApiUrl}/sendAudio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(audioMessage),
      });
      result = await response.json();
    }

    if (!response.ok) {
      console.error('❌ Telegram API error:', result);
      throw new Error(`Telegram API error: ${result.description || 'Unknown error'}`);
    }

    // Cache file_id for future use
    if (result.result?.audio?.file_id && trackId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('tracks')
          .update({ telegram_file_id: result.result.audio.file_id })
          .eq('id', trackId);
        
        console.log('✅ Cached telegram_file_id');
      } catch (cacheError) {
        console.warn('⚠️ Failed to cache file_id:', cacheError);
      }
    }

    console.log('✅ Audio sent successfully to Telegram');

    return new Response(
      JSON.stringify({ success: true, file_id: result.result?.audio?.file_id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Error in suno-send-audio:', error);
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