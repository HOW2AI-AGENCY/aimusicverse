import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SetMusicProfileRequest {
  trackId: string;
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { trackId, userId } = await req.json() as SetMusicProfileRequest;
    
    if (!trackId || !userId) {
      return new Response(
        JSON.stringify({ error: 'trackId and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[set-music-profile] Setting profile music for user ${userId}, track ${trackId}`);

    // Get track details
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('id, title, audio_url, telegram_file_id, user_id')
      .eq('id', trackId)
      .single();

    if (trackError || !track) {
      console.error('[set-music-profile] Track not found:', trackError);
      return new Response(
        JSON.stringify({ error: 'Track not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's telegram chat ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('telegram_id, telegram_chat_id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.telegram_id) {
      console.error('[set-music-profile] Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found or no Telegram linked' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const chatId = profile.telegram_chat_id || profile.telegram_id;

    // Telegram doesn't have a direct API to set profile music,
    // but we can send the audio to the user with instructions
    // or store the preference for future use
    
    // Store the user's profile music preference
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        profile_theme: {
          ...(typeof profile === 'object' ? {} : {}),
          profile_music_track_id: trackId
        }
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[set-music-profile] Failed to update profile:', updateError);
    }

    // Send the audio to the user with a message
    let audioSource = track.telegram_file_id || track.audio_url;
    
    if (!audioSource) {
      return new Response(
        JSON.stringify({ error: 'No audio available for this track' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send audio message to user
    const sendAudioUrl = `https://api.telegram.org/bot${telegramBotToken}/sendAudio`;
    
    const audioResponse = await fetch(sendAudioUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        audio: audioSource,
        title: track.title || 'MusicVerse Track',
        caption: `🎵 *${track.title || 'Трек'}*\n\n` +
          `Чтобы установить как музыку профиля:\n` +
          `1. Нажмите на аудио выше\n` +
          `2. Нажмите ⋮ (три точки)\n` +
          `3. Выберите "Set as Profile Music"`,
        parse_mode: 'Markdown',
      }),
    });

    const audioResult = await audioResponse.json();
    
    if (!audioResult.ok) {
      console.error('[set-music-profile] Failed to send audio:', audioResult);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send audio to Telegram',
          details: audioResult.description 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[set-music-profile] Successfully sent audio to user ${chatId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Audio sent to Telegram. Follow the instructions to set as profile music.',
        telegram_message_id: audioResult.result?.message_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('[set-music-profile] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
