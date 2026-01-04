import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, context } = await req.json()
    
    if (!text) {
      throw new Error('No text provided')
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Correcting text:', text.substring(0, 100));

    // System prompt for text correction
    const systemPrompt = `Ты — умный помощник для исправления текста, распознанного из голоса.
Твоя задача:
1. Исправить грамматические и орфографические ошибки
2. Расставить знаки препинания
3. Убрать слова-паразиты (ну, э, ммм, ааа и т.д.)
4. Сохранить смысл и стиль речи пользователя
5. НЕ добавлять ничего от себя, только исправлять

${context === 'lyrics' ? 'Контекст: это текст песни/лирика. Сохраняй поэтический стиль, разбивай на строки где уместно.' : ''}
${context === 'style' ? 'Контекст: это описание музыкального стиля. Используй музыкальную терминологию.' : ''}
${context === 'description' ? 'Контекст: это описание для генерации музыки. Сохраняй теги в формате [Тег: значение].' : ''}

Верни ТОЛЬКО исправленный текст, без объяснений.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI correction error:', response.status, errorText);
      // Return original text if correction fails
      return new Response(
        JSON.stringify({ correctedText: text, wasModified: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const correctedText = data.choices?.[0]?.message?.content?.trim() || text;
    const wasModified = correctedText !== text;

    console.log('Corrected text:', correctedText.substring(0, 100));

    return new Response(
      JSON.stringify({ correctedText, wasModified }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Text correction error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
