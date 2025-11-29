import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, projectId, field, language } = await req.json();

    console.log('AI Action request:', { action, projectId, field, language });

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('music_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'translate') {
      const targetLang = language === 'en' ? 'English' : 'Russian';
      systemPrompt = `You are a professional translator specializing in music project content. Translate the content naturally while preserving the creative tone and style.`;
      
      userPrompt = `Translate the following music project to ${targetLang}:
      
Title: ${project.title}
Description: ${project.description || 'N/A'}
Concept: ${project.concept || 'N/A'}
Target Audience: ${project.target_audience || 'N/A'}

Return ONLY a JSON object with these exact fields:
{
  "title": "translated title",
  "description": "translated description or null",
  "concept": "translated concept or null",
  "target_audience": "translated target audience or null"
}`;

    } else if (action === 'improve_options') {
      systemPrompt = `Ты - креативный консультант по музыкальной индустрии. Генерируй несколько вариантов улучшения для поля музыкального проекта, объясняя различия между ними. ВСЕ тексты должны быть НА РУССКОМ ЯЗЫКЕ.`;
      
      const currentValue = project[field as keyof typeof project];
      userPrompt = `Сгенерируй 3 разных варианта улучшения для поля "${field}" этого музыкального проекта.

Текущее значение: ${currentValue || 'Не указано'}
Контекст проекта:
- Название: ${project.title}
- Жанр: ${project.genre || 'Не указано'}
- Тип проекта: ${project.project_type || 'Не указано'}

Верни JSON объект с массивом из 3 вариантов:
{
  "options": [
    {
      "title": "Короткий описательный заголовок (на русском)",
      "value": "Улучшенный контент (на русском)",
      "explanation": "Почему этот подход работает и что делает его уникальным (на русском)",
      "tone": "профессиональный|креативный|коммерческий|экспериментальный"
    }
  ]
}

Сделай каждый вариант заметно отличающимся по подходу и тону.`;
    }

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
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;

    // Parse JSON response
    let result;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ action, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in project-ai-actions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});