import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');

    if (!sunoApiKey) {
      throw new Error('SUNO_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { 
      theme,
      style,
      mood,
      structure = 'verse-chorus-verse-chorus-bridge-chorus',
      artistPersona,
      language = 'en',
      trackId,
      projectId,
    } = await req.json();

    if (!theme) {
      throw new Error('Theme is required');
    }

    console.log(`Generating lyrics for user: ${user.id}, language: ${language}`);

    // Build language-aware prompt for SunoAPI
    let promptText = '';
    
    if (language === 'ru') {
      promptText = `Напиши текст песни на русском языке.\n`;
      promptText += `Тема: ${theme}\n`;
      if (style) promptText += `Стиль: ${style}\n`;
      if (mood) promptText += `Настроение: ${mood}\n`;
      if (structure) promptText += `Структура: ${structure}\n`;
      if (artistPersona) promptText += `Голос артиста: ${artistPersona}\n`;
    } else {
      promptText = `Write song lyrics in English.\n`;
      promptText += `Theme: ${theme}\n`;
      if (style) promptText += `Style: ${style}\n`;
      if (mood) promptText += `Mood: ${mood}\n`;
      if (structure) promptText += `Structure: ${structure}\n`;
      if (artistPersona) promptText += `Artist persona: ${artistPersona}\n`;
    }

    // Call SunoAPI to generate lyrics
    const callbackUrl = `${supabaseUrl}/functions/v1/lyrics-callback`;
    
    console.log('Calling SunoAPI with prompt:', promptText.substring(0, 100));

    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/lyrics', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: promptText,
        callBackUrl: callbackUrl,
      }),
    });

    if (!sunoResponse.ok) {
      const errorText = await sunoResponse.text();
      console.error('SunoAPI error:', sunoResponse.status, errorText);
      throw new Error(`SunoAPI error: ${sunoResponse.status} - ${errorText}`);
    }

    const sunoData = await sunoResponse.json();

    if (sunoData.code !== 200) {
      throw new Error(sunoData.msg || 'Failed to generate lyrics');
    }

    const taskId = sunoData.data.taskId;
    console.log('SunoAPI task created:', taskId);

    // Store task info in database for tracking
    await supabase
      .from('generation_tasks')
      .insert({
        user_id: user.id,
        prompt: promptText,
        status: 'pending',
        source: 'suno_lyrics',
        track_id: trackId || null,
      });

    // Log the generation attempt
    if (trackId) {
      await supabase.from('track_change_log').insert({
        track_id: trackId,
        user_id: user.id,
        change_type: 'suno_lyrics_request',
        changed_by: 'ai',
        ai_model_used: 'suno_api',
        prompt_used: promptText,
        metadata: {
          taskId,
          theme,
          style,
          mood,
          structure,
          language,
        },
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        taskId,
        message: language === 'ru' 
          ? 'Генерация лирики начата. Результат будет доступен через несколько секунд.'
          : 'Lyrics generation started. Results will be available in a few seconds.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-lyrics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
