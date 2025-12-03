import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LyricsRequest {
  action: 'generate' | 'improve' | 'add_tags' | 'suggest_structure';
  theme?: string;
  mood?: string;
  genre?: string;
  language?: string;
  existingLyrics?: string;
  structure?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const body: LyricsRequest = await req.json();
    const { action, theme, mood, genre, language = 'ru', existingLyrics, structure } = body;

    // Fetch Suno meta tags from database for context
    const { data: metaTags } = await supabase
      .from('suno_meta_tags')
      .select('tag_name, category, description, syntax_format')
      .in('category', ['structure', 'vocal', 'mood_energy']);

    // Build tag reference for AI
    const structureTags = metaTags?.filter(t => t.category === 'structure').map(t => t.syntax_format || `[${t.tag_name}]`).join(', ') || '';
    const vocalTags = metaTags?.filter(t => t.category === 'vocal').map(t => t.syntax_format || `[${t.tag_name}]`).join(', ') || '';

    let systemPrompt = `Ты опытный автор песен и музыкальный продюсер. Ты помогаешь создавать тексты песен для AI генерации музыки.

ВАЖНО: Используй структурные теги Suno в квадратных скобках для разметки текста:
- Структурные теги: ${structureTags}
- Вокальные теги: ${vocalTags}

Примеры правильного форматирования:
[Intro]
(Мягкое начало)

[Verse 1]
Текст куплета здесь...

[Chorus]
Текст припева здесь...

[Bridge]
Текст бриджа...

[Outro]
Завершение...

Правила:
1. Каждая секция должна начинаться с тега в квадратных скобках
2. Можно добавлять пояснения в круглых скобках для вокальных указаний
3. Текст должен быть ритмичным и подходить для пения
4. Учитывай язык: ${language === 'ru' ? 'русский' : 'английский'}`;

    let userPrompt = '';

    switch (action) {
      case 'generate':
        userPrompt = `Создай текст песни на тему: "${theme || 'любовь и надежда'}"
Жанр: ${genre || 'поп'}
Настроение: ${mood || 'вдохновляющее'}
${structure ? `Структура: ${structure}` : 'Структура: стандартная (Intro, Verse, Chorus, Verse, Chorus, Bridge, Outro)'}

Верни только текст песни с тегами, без дополнительных пояснений.`;
        break;

      case 'improve':
        userPrompt = `Улучши следующий текст песни, сохраняя общий смысл но делая его более поэтичным и подходящим для пения:

${existingLyrics}

Добавь структурные теги если их нет. Верни только улучшенный текст.`;
        break;

      case 'add_tags':
        userPrompt = `Добавь структурные теги Suno к следующему тексту песни. Определи секции (куплеты, припевы, бриджи) и добавь соответствующие теги:

${existingLyrics}

Верни текст с добавленными тегами в квадратных скобках.`;
        break;

      case 'suggest_structure':
        userPrompt = `Предложи структуру песни для жанра "${genre || 'поп'}" с настроением "${mood || 'энергичное'}".
Верни только список секций с тегами, например:
[Intro]
[Verse 1]
[Pre-Chorus]
[Chorus]
...`;
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

    console.log('AI Lyrics request:', { action, theme, mood, genre, language });

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Слишком много запросов. Попробуйте позже.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      
      throw new Error('AI service error');
    }

    const aiData = await aiResponse.json();
    const generatedLyrics = aiData.choices?.[0]?.message?.content || '';

    console.log('Generated lyrics length:', generatedLyrics.length);

    return new Response(
      JSON.stringify({
        success: true,
        lyrics: generatedLyrics,
        action,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in ai-lyrics-assistant:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});