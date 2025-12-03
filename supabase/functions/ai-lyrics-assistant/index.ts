import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type LyricsAction = 
  | 'generate'           // Full generation
  | 'improve'            // Improve text
  | 'add_tags'           // Add tags
  | 'suggest_structure'  // Suggest structure
  | 'generate_section'   // Generate one section
  | 'continue_line'      // Continue line (collaboration)
  | 'suggest_rhymes'     // Suggest rhymes
  | 'analyze_lyrics'     // Analyze existing lyrics
  | 'optimize_for_suno'; // Optimize for Suno API

interface LyricsRequest {
  action: LyricsAction;
  theme?: string;
  mood?: string;
  genre?: string;
  language?: string;
  existingLyrics?: string;
  lyrics?: string;
  structure?: string;
  // New fields for advanced actions
  sectionType?: string;
  sectionName?: string;
  previousLyrics?: string;
  linesCount?: number;
  currentLyrics?: string;
  word?: string;
  context?: string;
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
    const { 
      action, theme, mood, genre, language = 'ru', existingLyrics, lyrics, structure,
      sectionType, sectionName, previousLyrics, linesCount, currentLyrics, word, context
    } = body;

    // Fetch all Suno meta tags from database for comprehensive context
    const { data: metaTags } = await supabase
      .from('suno_meta_tags')
      .select('tag_name, category, description, syntax_format');

    // Organize tags by category
    const tagsByCategory: Record<string, string[]> = {};
    metaTags?.forEach(tag => {
      if (!tagsByCategory[tag.category]) {
        tagsByCategory[tag.category] = [];
      }
      tagsByCategory[tag.category].push(tag.syntax_format || `[${tag.tag_name}]`);
    });

    const structureTags = tagsByCategory['structure']?.join(', ') || '[Verse], [Chorus], [Bridge], [Intro], [Outro]';
    const vocalTags = tagsByCategory['vocal']?.join(', ') || '[Male Vocal], [Female Vocal], [Falsetto]';
    const moodTags = tagsByCategory['mood_energy']?.join(', ') || '';
    const instrumentTags = tagsByCategory['instrument']?.join(', ') || '';

    const baseSystemPrompt = `Ты опытный автор песен и музыкальный продюсер. Ты помогаешь создавать тексты песен для AI генерации музыки (Suno AI).

ДОСТУПНЫЕ ТЕГИ SUNO:
- Структурные: ${structureTags}
- Вокальные: ${vocalTags}
- Настроение: ${moodTags}
- Инструменты: ${instrumentTags}

ПРАВИЛА ФОРМАТИРОВАНИЯ:
1. Структурные теги в квадратных скобках: [Verse 1], [Chorus], [Bridge]
2. Вокальные указания в круглых скобках: (softly), (with passion), (whisper)
3. Инструментальные вставки: [Guitar Solo], [Piano Break]
4. Динамические указания: [Build], [Drop], [Breakdown]

Язык: ${language === 'ru' ? 'русский' : 'английский'}`;

    let systemPrompt = baseSystemPrompt;
    let userPrompt = '';

    switch (action) {
      case 'generate':
        userPrompt = `Создай полный текст песни.

Тема: "${theme || 'любовь и надежда'}"
Жанр: ${genre || 'поп'}
Настроение: ${mood || 'вдохновляющее'}
${structure ? `Структура: ${structure}` : 'Структура: Intro, Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus, Chorus, Bridge, Final Chorus, Outro'}

Требования:
- Каждая секция начинается с тега в []
- Текст ритмичный, подходит для пения
- Используй рифмы
- Добавь вокальные указания в () где уместно

Верни ТОЛЬКО текст песни с тегами.`;
        break;

      case 'improve':
        userPrompt = `Улучши текст песни, сохраняя смысл:

${existingLyrics || lyrics}

Задачи:
1. Сделай текст более поэтичным
2. Улучши рифмы
3. Добавь структурные теги если нет
4. Добавь вокальные указания где уместно

Верни только улучшенный текст.`;
        break;

      case 'add_tags':
        userPrompt = `Добавь теги Suno к тексту:

${existingLyrics || lyrics}

Задачи:
1. Определи секции и добавь структурные теги [Verse], [Chorus], etc.
2. Добавь вокальные указания (softly), (powerfully), etc.
3. Добавь динамические теги [Build], [Drop] где уместно

Верни текст с тегами.`;
        break;

      case 'suggest_structure':
        userPrompt = `Предложи структуру песни:

Жанр: ${genre || 'поп'}
Настроение: ${mood || 'энергичное'}
${theme ? `Тема: ${theme}` : ''}

Верни список секций с тегами, по одному на строку:
[Intro]
[Verse 1]
...`;
        break;

      case 'generate_section':
        systemPrompt = baseSystemPrompt + `\n\nТы пишешь одну конкретную секцию песни. Секция должна органично продолжать предыдущий текст.`;
        userPrompt = `Напиши секцию "${sectionName}" (тип: ${sectionType}) для песни.

Тема: "${theme || 'любовь'}"
Жанр: ${genre || 'поп'}
Настроение: ${mood || 'романтичное'}
Количество строк: примерно ${linesCount || 4}

${previousLyrics ? `Предыдущие секции:\n${previousLyrics}\n` : ''}

Требования:
- НЕ добавляй тег секции, только текст
- Текст должен продолжать историю
- Используй рифмы
- Можно добавить вокальные указания в ()

Верни ТОЛЬКО текст секции (${linesCount || 4} строк).`;
        break;

      case 'continue_line':
        systemPrompt = baseSystemPrompt + `\n\nТы помогаешь в режиме коллаборации - предлагаешь следующую строку текста.`;
        userPrompt = `Предложи следующую строку для песни.

Текущий текст секции (${sectionType || 'verse'}):
${currentLyrics}

Тема: ${theme || 'любовь'}
Жанр: ${genre || 'поп'}  
Настроение: ${mood || 'романтичное'}

Требования:
- Одна строка, продолжающая текст
- Рифма с предыдущей строкой если возможно
- Сохраняй ритм
- Можно добавить (указание) если уместно

Верни ТОЛЬКО одну строку.`;
        break;

      case 'suggest_rhymes':
        systemPrompt = `Ты эксперт по рифмам на ${language === 'ru' ? 'русском' : 'английском'} языке.`;
        userPrompt = `Предложи рифмы к слову "${word}".

${context ? `Контекст:\n${context}\n` : ''}

Требования:
- 6-10 хороших рифм
- Разнообразные (точные и ассонансные)
- Подходящие для песенного текста

Верни рифмы через запятую.`;
        break;

      case 'analyze_lyrics':
        systemPrompt = baseSystemPrompt + `\n\nТы анализируешь текст песни и предлагаешь улучшения.`;
        userPrompt = `Проанализируй текст песни и предложи теги:

${lyrics || existingLyrics}

Жанр: ${genre || 'поп'}
Настроение: ${mood || 'неизвестно'}

Верни анализ в формате:
ВОКАЛ: рекомендуемые вокальные теги
ИНСТРУМЕНТЫ: рекомендуемые инструменты
ДИНАМИКА: рекомендуемые динамические теги
ЭМОЦИИ: рекомендуемые эмоциональные указания

Используй только теги из доступных.`;
        break;

      case 'optimize_for_suno':
        systemPrompt = baseSystemPrompt + `\n\nТы оптимизируешь текст для лучшей генерации в Suno AI.`;
        userPrompt = `Оптимизируй текст песни для Suno AI:

${lyrics || existingLyrics}

Жанр: ${genre || 'поп'}

Задачи:
1. Убедись что текст < 3000 символов
2. Проверь структурные теги
3. Добавь/улучши вокальные указания
4. Удали лишние символы
5. Убедись в правильном форматировании

Верни оптимизированный текст.`;
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

    console.log('AI Lyrics request:', { action, theme, mood, genre, language, sectionType });

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
        max_tokens: action === 'suggest_rhymes' ? 200 : action === 'continue_line' ? 100 : 2000,
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
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Необходимо пополнить баланс.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      
      throw new Error('AI service error');
    }

    const aiData = await aiResponse.json();
    const generatedLyrics = aiData.choices?.[0]?.message?.content || '';

    console.log('Generated content length:', generatedLyrics.length, 'action:', action);

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
