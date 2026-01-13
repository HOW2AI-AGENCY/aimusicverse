// Note: Supabase client not needed in this function

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, prompt, content } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'generate_article':
        systemPrompt = `Ты опытный копирайтер для музыкального AI-проекта MusicVerse. 
Пиши статьи на русском языке. Статьи должны быть:
- Информативными и полезными
- С хорошей структурой (заголовки, подзаголовки)
- Содержать практические советы
- Быть написаны дружелюбным тоном
Используй Markdown форматирование.`;
        userPrompt = `Напиши статью на тему: ${prompt}`;
        break;

      case 'improve_article':
        systemPrompt = `Ты редактор. Улучши статью: исправь ошибки, улучши стиль, добавь структуру. Сохрани основной смысл. Пиши на русском.`;
        userPrompt = `Улучши эту статью:\n\n${content}`;
        break;

      case 'generate_excerpt':
        systemPrompt = `Создай краткое описание (1-2 предложения) для статьи. На русском языке.`;
        userPrompt = `Создай краткое описание для статьи:\n\n${content?.substring(0, 1000)}`;
        break;

      case 'generate_title':
        systemPrompt = `Придумай привлекательный заголовок для статьи. Только заголовок, без кавычек и пояснений. На русском языке.`;
        userPrompt = `Придумай заголовок для статьи на тему: ${prompt}`;
        break;

      default:
        throw new Error('Invalid action');
    }

    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI service error');
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ content: generatedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('AI Blog Assistant error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
