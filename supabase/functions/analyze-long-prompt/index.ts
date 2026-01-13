import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = getSupabaseClient();

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

    const { prompt, action } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log(`Analyzing prompt for user: ${user.id}, action: ${action}`);

    let systemPrompt = '';
    
    if (action === 'analyze') {
      systemPrompt = `Ты - эксперт по созданию музыкальных промптов для Suno AI. 
Suno API имеет ограничение в 200 символов на промпт для генерации лирики.

Проанализируй данный промпт и предложи:
1. Оптимальную разбивку на части (если промпт длинный)
2. Ключевые элементы, которые важно сохранить
3. Рекомендации по сжатию без потери смысла
4. Предложения по улучшению каждой части

Ответь в JSON формате:
{
  "needsSplit": boolean,
  "parts": [
    {
      "title": "Название части",
      "content": "Содержание части (до 200 символов)",
      "priority": "high|medium|low",
      "tips": "Рекомендации"
    }
  ],
  "overallTips": "Общие рекомендации"
}`;
    } else if (action === 'optimize') {
      systemPrompt = `Ты - эксперт по созданию музыкальных промптов для Suno AI.
Оптимизируй данный промпт, сохранив его суть, но сократив до 200 символов максимум.
Убери лишние слова, но сохрани ключевые элементы: жанр, настроение, инструменты, темп.

Ответь в JSON формате:
{
  "optimized": "Оптимизированный промпт",
  "removed": "Что было убрано",
  "kept": "Что было сохранено",
  "length": число_символов
}`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;

    console.log('AI response:', aiResponse);

    // Parse JSON from AI response
    let parsedResponse;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/);
      const jsonText = jsonMatch ? jsonMatch[1] : aiResponse;
      parsedResponse = JSON.parse(jsonText);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      parsedResponse = { raw: aiResponse };
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis: parsedResponse,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in analyze-long-prompt:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
