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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { content } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Boosting style with AI:', content.substring(0, 100));

    // Use Lovable AI to enhance the style description
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Ты профессиональный музыкальный продюсер. Твоя задача - улучшить описание музыкального стиля для Suno AI v5.

Правила улучшения:
1. Используй формат Suno v5: [Category: Value]
2. Добавь 5-8 релевантных мета-тегов из категорий: Genre, Mood, Instrument, Vocal Style, Production, Texture, Energy
3. Сделай описание более детальным и профессиональным
4. Убери противоречивые элементы
5. Максимум 2 жанра, 3-4 инструмента
6. Отвечай ТОЛЬКО улучшенным текстом стиля, без пояснений

Пример улучшения:
Вход: "грустная медленная песня"
Выход: "[Genre: Indie Folk, Acoustic] [Mood: Melancholic, Introspective] [Instrument: Acoustic Guitar, Piano, Cello] [Vocal Style: Soft, Breathy] [Production: Intimate, Lo-Fi] [Texture: Sparse, Reverb-Light] [Energy: Low] [BPM: 65-75]"`,
          },
          {
            role: 'user',
            content: `Улучши это описание стиля:\n\n${content}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const boostedStyle = aiData.choices?.[0]?.message?.content?.trim();

    if (!boostedStyle) {
      console.error('No style in AI response:', aiData);
      return new Response(
        JSON.stringify({ error: 'No style generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Style boosted successfully');

    return new Response(
      JSON.stringify({ 
        boostedStyle,
        original: content,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in suno-boost-style:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});