import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Максимум символов для промпта (оставляем запас до 500)
const MAX_PROMPT_LENGTH = 450;

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

    const { content, targetLength = MAX_PROMPT_LENGTH } = await req.json();

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
            content: `Ты эксперт по AI музыке и Suno API v5. Улучши описание музыкального стиля.

КРИТИЧЕСКИ ВАЖНО:
- Результат СТРОГО до ${targetLength} символов (сейчас лимит API = 500)
- Пиши на РУССКОМ языке
- Используй компактный формат: описание + теги в квадратных скобках
- Максимум 4-5 тегов, только самые важные

ФОРМАТ ОТВЕТА:
Краткое описание музыки [Жанр: X] [Настроение: X] [Вокал: X] [Темп: X]

ПРИМЕРЫ:
"грустная песня" → "Меланхоличная баллада с мягким вокалом [Жанр: Инди-фолк] [Настроение: Грустный] [Вокал: Нежный] [Темп: Медленный]"

"энергичный рок" → "Мощный рок с драйвовыми гитарами [Жанр: Рок] [Настроение: Энергичный] [Инструменты: Гитары, ударные] [Темп: Быстрый]"

НИКОГДА:
- Не превышай ${targetLength} символов
- Не используй английские слова
- Не добавляй лишние теги
- Не пиши пояснений, только результат`,
          },
          {
            role: 'user',
            content: `Улучши это описание (макс ${targetLength} символов):\n\n${content}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let boostedStyle = aiData.choices?.[0]?.message?.content?.trim();

    if (!boostedStyle) {
      console.error('No style in AI response:', aiData);
      return new Response(
        JSON.stringify({ error: 'No style generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure the result doesn't exceed the target length
    if (boostedStyle.length > targetLength) {
      console.log(`Trimming boosted style from ${boostedStyle.length} to ${targetLength}`);
      // Try to trim intelligently - find last complete tag
      const lastBracket = boostedStyle.lastIndexOf(']', targetLength);
      if (lastBracket > 100) {
        boostedStyle = boostedStyle.substring(0, lastBracket + 1);
      } else {
        boostedStyle = boostedStyle.substring(0, targetLength);
      }
    }

    console.log(`Style boosted: ${boostedStyle.length} chars`);

    return new Response(
      JSON.stringify({ 
        boostedStyle,
        original: content,
        length: boostedStyle.length,
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
