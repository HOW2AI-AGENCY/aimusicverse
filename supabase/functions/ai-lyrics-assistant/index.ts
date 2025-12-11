import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('ai-lyrics-assistant');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type LyricsAction = 
  | 'generate'                // Full generation with advanced tags
  | 'improve'                 // Improve text
  | 'add_tags'                // Add tags
  | 'suggest_structure'       // Suggest structure
  | 'generate_section'        // Generate one section
  | 'continue_line'           // Continue line (collaboration)
  | 'suggest_rhymes'          // Suggest rhymes
  | 'analyze_lyrics'          // Analyze existing lyrics
  | 'optimize_for_suno'       // Optimize for Suno API
  | 'smart_generate'          // Smart generation with tag recommendations
  | 'chat'                    // Free chat mode with context
  | 'context_recommendations' // Get AI recommendations based on context
  | 'generate_compound_tags'  // Generate compound tags for sections
  | 'analyze_rhythm'          // Analyze text rhythm and syllables
  | 'fit_structure';          // Fit lyrics to song structure

interface LyricsRequest {
  action: LyricsAction;
  theme?: string;
  mood?: string;
  genre?: string;
  language?: string;
  existingLyrics?: string;
  lyrics?: string;
  structure?: string;
  sectionType?: string;
  sectionName?: string;
  previousLyrics?: string;
  linesCount?: number;
  currentLyrics?: string;
  word?: string;
  context?: any; // Chat context
  message?: string; // Chat message
  // NEW: Advanced tag options
  vocalTags?: string[];
  instrumentTags?: string[];
  dynamicTags?: string[];
  emotionalCues?: string[];
  useAdvancedTags?: boolean;
}

// Tag templates for different genres and moods
const GENRE_TAG_PROFILES: Record<string, { vocal: string[], instruments: string[], dynamics: string[], emotions: string[] }> = {
  'pop': {
    vocal: ['Female Vocal', 'Smooth', 'Catchy'],
    instruments: ['Synth', 'Electronic Drums', 'Piano'],
    dynamics: ['Build', 'Drop'],
    emotions: ['Uplifting', 'Energetic']
  },
  'rock': {
    vocal: ['Male Vocal', 'Powerful', 'Raspy'],
    instruments: ['Electric Guitar', 'Drums', 'Bass'],
    dynamics: ['Crescendo', 'Breakdown'],
    emotions: ['Intense', 'Raw']
  },
  'hip-hop': {
    vocal: ['Male Rap', 'Flow', 'Rhythmic'],
    instruments: ['808 Bass', 'Hi-Hats', 'Sample'],
    dynamics: ['Drop', 'Build'],
    emotions: ['Confident', 'Street']
  },
  'electronic': {
    vocal: ['Vocoder', 'Processed', 'Ethereal'],
    instruments: ['Synth Lead', 'Arpeggio', 'Pad'],
    dynamics: ['Build', 'Drop', 'Filter Sweep'],
    emotions: ['Hypnotic', 'Futuristic']
  },
  'r&b': {
    vocal: ['Soulful', 'Falsetto', 'Smooth'],
    instruments: ['Rhodes', 'Smooth Bass', 'Strings'],
    dynamics: ['Groove', 'Soft Build'],
    emotions: ['Sensual', 'Intimate']
  },
  'indie': {
    vocal: ['Airy', 'Intimate', 'Breathy'],
    instruments: ['Acoustic Guitar', 'Indie Drums', 'Ambient'],
    dynamics: ['Subtle Build', 'Atmospheric'],
    emotions: ['Dreamy', 'Nostalgic']
  },
  'folk': {
    vocal: ['Natural', 'Storytelling', 'Warm'],
    instruments: ['Acoustic Guitar', 'Banjo', 'Violin'],
    dynamics: ['Organic', 'Building'],
    emotions: ['Earthy', 'Heartfelt']
  },
  'jazz': {
    vocal: ['Smooth', 'Improvised', 'Swing'],
    instruments: ['Piano', 'Double Bass', 'Saxophone'],
    dynamics: ['Swing Feel', 'Solo Section'],
    emotions: ['Cool', 'Sophisticated']
  }
};

const MOOD_TAG_PROFILES: Record<string, { dynamics: string[], emotions: string[], vocal: string[] }> = {
  'romantic': {
    dynamics: ['Soft', 'Building', 'Intimate'],
    emotions: ['Tender', 'Passionate', 'Longing'],
    vocal: ['Gentle', 'Breathy', 'Emotional']
  },
  'energetic': {
    dynamics: ['Driving', 'Punchy', 'High Energy'],
    emotions: ['Exciting', 'Powerful', 'Anthemic'],
    vocal: ['Strong', 'Belting', 'Dynamic']
  },
  'melancholic': {
    dynamics: ['Sparse', 'Slow Build', 'Atmospheric'],
    emotions: ['Sad', 'Reflective', 'Bittersweet'],
    vocal: ['Vulnerable', 'Whispering', 'Trembling']
  },
  'happy': {
    dynamics: ['Upbeat', 'Bouncy', 'Light'],
    emotions: ['Joyful', 'Carefree', 'Bright'],
    vocal: ['Cheerful', 'Playful', 'Warm']
  },
  'dark': {
    dynamics: ['Heavy', 'Intense', 'Brooding'],
    emotions: ['Menacing', 'Mysterious', 'Ominous'],
    vocal: ['Deep', 'Growling', 'Whispered']
  },
  'nostalgic': {
    dynamics: ['Warm', 'Vintage', 'Gradual'],
    emotions: ['Wistful', 'Reminiscent', 'Bittersweet'],
    vocal: ['Soft', 'Reflective', 'Sincere']
  },
  'peaceful': {
    dynamics: ['Gentle', 'Flowing', 'Ambient'],
    emotions: ['Calm', 'Serene', 'Meditative'],
    vocal: ['Soft', 'Airy', 'Soothing']
  },
  'epic': {
    dynamics: ['Massive Build', 'Orchestral Swell', 'Climactic'],
    emotions: ['Triumphant', 'Heroic', 'Majestic'],
    vocal: ['Powerful', 'Choir', 'Soaring']
  }
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
      sectionType, sectionName, previousLyrics, linesCount, currentLyrics, word, context,
      vocalTags, instrumentTags, dynamicTags, emotionalCues, useAdvancedTags
    } = body;

    // Fetch all Suno meta tags from database
    const { data: metaTags } = await supabase
      .from('suno_meta_tags')
      .select('tag_name, category, description, syntax_format, usage_examples');

    // Organize tags by category with full details
    const tagsByCategory: Record<string, Array<{ name: string, format: string, desc: string, examples: string[] }>> = {};
    metaTags?.forEach(tag => {
      if (!tagsByCategory[tag.category]) {
        tagsByCategory[tag.category] = [];
      }
      tagsByCategory[tag.category].push({
        name: tag.tag_name,
        format: tag.syntax_format || `[${tag.tag_name}]`,
        desc: tag.description || '',
        examples: tag.usage_examples || []
      });
    });

    // Get recommended tags based on genre and mood
    const genreProfile = GENRE_TAG_PROFILES[genre || 'pop'] || GENRE_TAG_PROFILES.pop;
    const moodProfile = MOOD_TAG_PROFILES[mood || 'romantic'] || MOOD_TAG_PROFILES.romantic;

    // Build comprehensive tag reference
    const structureTags = tagsByCategory['structure']?.map(t => t.format).join(', ') || '[Verse], [Chorus], [Bridge], [Intro], [Outro], [Pre-Chorus], [Hook]';
    const vocalTagsList = tagsByCategory['vocal']?.map(t => t.format).join(', ') || '[Male Vocal], [Female Vocal], [Falsetto], [Whisper]';
    const moodTagsList = tagsByCategory['mood_energy']?.map(t => t.format).join(', ') || '';
    const instrumentTagsList = tagsByCategory['instrument']?.map(t => t.format).join(', ') || '';
    const productionTags = tagsByCategory['production_texture']?.map(t => t.format).join(', ') || '';
    const effectTags = tagsByCategory['effect_processing']?.map(t => t.format).join(', ') || '';
    const dynamicsList = tagsByCategory['transition_dynamics']?.map(t => t.format).join(', ') || '';

    // Create tag recommendation string based on genre/mood
    const recommendedTags = `
РЕКОМЕНДУЕМЫЕ ТЕГИ ДЛЯ ${genre?.toUpperCase() || 'POP'} + ${mood?.toUpperCase() || 'ROMANTIC'}:
- Вокал: ${[...genreProfile.vocal, ...moodProfile.vocal].slice(0, 4).join(', ')}
- Инструменты: ${genreProfile.instruments.join(', ')}
- Динамика: ${[...genreProfile.dynamics, ...moodProfile.dynamics].slice(0, 4).join(', ')}
- Эмоции: ${[...genreProfile.emotions, ...moodProfile.emotions].slice(0, 4).join(', ')}`;

    // User-provided custom tags
    const customTagsSection = (useAdvancedTags && (vocalTags?.length || instrumentTags?.length || dynamicTags?.length || emotionalCues?.length)) 
      ? `
ПОЛЬЗОВАТЕЛЬСКИЕ ТЕГИ (обязательно использовать):
${vocalTags?.length ? `- Вокал: ${vocalTags.join(', ')}` : ''}
${instrumentTags?.length ? `- Инструменты: ${instrumentTags.join(', ')}` : ''}
${dynamicTags?.length ? `- Динамика: ${dynamicTags.join(', ')}` : ''}
${emotionalCues?.length ? `- Эмоции: ${emotionalCues.join(', ')}` : ''}
` : '';

    const baseSystemPrompt = `Ты опытный автор песен и музыкальный продюсер, специализирующийся на создании текстов для AI генерации музыки (Suno AI V4.5+).

ПОЛНАЯ БИБЛИОТЕКА ТЕГОВ SUNO V4.5+:

📌 СТРУКТУРНЫЕ ТЕГИ (обязательно для каждой секции):
${structureTags}

🎤 ВОКАЛЬНЫЕ ТЕГИ (задают характер голоса):
${vocalTagsList}

🎸 ИНСТРУМЕНТАЛЬНЫЕ ТЕГИ:
${instrumentTagsList}

🌊 ДИНАМИЧЕСКИЕ ТЕГИ (управление энергией):
${dynamicsList}

💫 ЭФФЕКТЫ И ПРОДАКШН:
${effectTags}

🎨 ТЕКСТУРА И АТМОСФЕРА:
${productionTags}

😊 НАСТРОЕНИЕ:
${moodTagsList}

${recommendedTags}
${customTagsSection}

═══════════════════════════════════════════════════════
🆕 СОСТАВНЫЕ ТЕГИ SUNO V4.5+ (COMPOUND TAGS)
═══════════════════════════════════════════════════════

ПРАВИЛО: В квадратных скобках можно указывать несколько тегов подряд!

1. КОМБИНИРОВАННЫЕ ТЕГИ СЕКЦИЙ (самое мощное):
   [Verse 1] [Male Vocal] [Intimate] [Acoustic Guitar]
   [Chorus] [Female Vocal] [Powerful] [Full Band] [Anthemic]
   [Bridge] [Whisper] [Atmospheric] [Piano Only]
   [Pre-Chorus] [Building] [Soft Drums]

2. ВОКАЛЬНЫЕ УКАЗАНИЯ В КРУГЛЫХ СКОБКАХ = БЭК-ВОКАЛ:
   ⚠️ (текст в круглых скобках) → это инструкция для бэк-вокала
   (ooh, aah)        ← хор поёт "ooh, aah"
   (echo: любовь)    ← эхо повторяет "любовь"
   (harmony)         ← добавить гармонию
   (call and response) ← диалог голосов

3. ДИНАМИЧЕСКИЕ ИНСТРУКЦИИ (цепочки):
   [Build] → [Climax] → [Drop] → [Breakdown]
   [Soft] → [Building] → [Powerful]
   [Quiet] → [Explosive]

4. СПЕЦИАЛЬНЫЕ V4.5+ ТЕГИ:
   [Vocalist: Female Alto]
   [Vocalist: Male Tenor Raspy]
   [Vocal Style: Smooth, Emotional, Breathy]
   [Instrument Focus: Piano]
   [Tempo: Slow Building to Fast]
   [Energy: Low to High]
   [Mood Shift: Sad to Hopeful]

5. ЭМОЦИОНАЛЬНЫЕ НАПРАВЛЯЮЩИЕ (перед строкой):
   (softly) Я шепчу твоё имя...
   (with power) МЫ ПОБЕДИМ!
   (crying) Прощай навсегда...
   (laughing) Какой смешной денёк!
   (angry) ХВАТИТ ЭТОЙ ЛЖИ!
   (tender) Любимая моя...

═══════════════════════════════════════════════════════

ПРИМЕР ИДЕАЛЬНОГО ФОРМАТИРОВАНИЯ V4.5+:

[Intro] [Atmospheric] [Soft Piano] [Ambient Pad]

[Verse 1] [Male Vocal] [Intimate] [Acoustic Guitar]
(gentle, storytelling)
Когда ты рядом, мир замирает
И время тает, как снег весной
(building slowly)
Твой голос сердце моё пронзает
Ты стала песней, моей судьбой

[Pre-Chorus] [Building] [Adding Drums]
(emotional, yearning)
И я не знаю, куда бежать
(ooh, ooh)
Когда ты смотришь вот так...

[Chorus] [Full Band] [Powerful] [Anthemic]
(soaring, passionate)
Ты — моё солнце в ночи бескрайней
(harmony)
Ты — моя вечная весна
(belting)
Любовь такая необычайна
Что без тебя я не могу дышать
(ooh, aah)

[Bridge] [Breakdown] [Piano Only] [Whisper]
(vulnerable, trembling)
Тишина... между нами
(building slowly)
Но это молчание громче слов

[Outro] [Fade Out] [Soft] [Distant]
(echo: солнце)
Ты — моё солнце...
(ooh, aah)

Язык: ${language === 'ru' ? 'русский' : 'английский'}`;

    let systemPrompt = baseSystemPrompt;
    let userPrompt = '';

    switch (action) {
      case 'generate':
      case 'smart_generate':
        userPrompt = `Создай профессиональный текст песни с продуманным использованием тегов.

ЗАДАНИЕ:
- Тема: "${theme || 'любовь и надежда'}"
- Жанр: ${genre || 'поп'}
- Настроение: ${mood || 'вдохновляющее'}
- Структура: ${structure || 'Intro, Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus, Chorus, Bridge, Final Chorus, Outro'}

ТРЕБОВАНИЯ К КАЧЕСТВУ:
1. ✅ Каждая секция начинается со структурного тега [...]
2. ✅ Добавь вокальные указания (...) для передачи эмоций
3. ✅ Используй [Build] перед припевами для нарастания
4. ✅ Добавь [Breakdown] или [Bridge] для контраста
5. ✅ Рифмы: перекрёстные (ABAB) или парные (AABB)
6. ✅ Метафоры и образность вместо прямых описаний
7. ✅ Ритмичный текст, удобный для пения
8. ✅ Финальный припев усиль с помощью (powerful) или [Climax]

${useAdvancedTags ? `
ОБЯЗАТЕЛЬНО ИСПОЛЬЗОВАТЬ ЭТИ ТЕГИ:
${vocalTags?.length ? `Вокальные: ${vocalTags.map(t => `(${t})`).join(', ')}` : ''}
${instrumentTags?.length ? `Инструментальные: ${instrumentTags.map(t => `[${t}]`).join(', ')}` : ''}
${dynamicTags?.length ? `Динамические: ${dynamicTags.map(t => `[${t}]`).join(', ')}` : ''}
${emotionalCues?.length ? `Эмоциональные: ${emotionalCues.map(t => `(${t})`).join(', ')}` : ''}
` : ''}

Верни ТОЛЬКО текст песни с тегами, без объяснений.`;
        break;

      case 'improve':
        userPrompt = `Улучши текст песни, добавив профессиональные теги:

ИСХОДНЫЙ ТЕКСТ:
${existingLyrics || lyrics}

ЗАДАЧИ:
1. Проверь и добавь структурные теги [...] для каждой секции
2. Добавь вокальные указания (...) для эмоциональных моментов
3. Вставь динамические маркеры [Build], [Drop], [Breakdown]
4. Улучши рифмы если нужно
5. Добавь инструментальные указания где уместно
6. Сделай текст более поэтичным

Верни улучшенный текст с полным форматированием.`;
        break;

      case 'add_tags':
        userPrompt = `Добавь профессиональные теги Suno к тексту:

ТЕКСТ:
${existingLyrics || lyrics}

ЖАНР: ${genre || 'поп'}
НАСТРОЕНИЕ: ${mood || 'романтичное'}

ЗАДАЧИ:
1. Определи секции и добавь структурные теги [Verse], [Chorus], [Bridge], etc.
2. Добавь вокальные указания: (softly), (powerfully), (with emotion), etc.
3. Вставь динамические теги [Build], [Drop], [Breakdown] перед ключевыми моментами
4. Добавь инструментальные указания [Guitar Solo], [Piano Break] если уместно
5. Используй рекомендованные теги для жанра ${genre}

Верни текст с полным профессиональным форматированием.`;
        break;

      case 'suggest_structure':
        userPrompt = `Предложи оптимальную структуру песни:

ЖАНР: ${genre || 'поп'}
НАСТРОЕНИЕ: ${mood || 'энергичное'}
${theme ? `ТЕМА: ${theme}` : ''}

Верни структуру с описанием каждой секции:

[Intro]
Описание: инструментальное вступление
Рекомендуемые теги: [Soft Piano], [Atmospheric]

[Verse 1]
Описание: введение в историю
Рекомендуемые теги: (intimate), (storytelling)

...и так далее`;
        break;

      case 'generate_section':
        systemPrompt = baseSystemPrompt + `\n\nТы пишешь одну конкретную секцию песни с профессиональными тегами.`;
        userPrompt = `Напиши секцию "${sectionName}" (тип: ${sectionType}) для песни.

КОНТЕКСТ:
- Тема: "${theme || 'любовь'}"
- Жанр: ${genre || 'поп'}
- Настроение: ${mood || 'романтичное'}
- Количество строк: ${linesCount || 4}

${previousLyrics ? `ПРЕДЫДУЩИЕ СЕКЦИИ:\n${previousLyrics}\n` : ''}

ТРЕБОВАНИЯ:
1. НЕ добавляй тег секции (только контент)
2. Добавь вокальные указания (...) где уместно
3. Используй рифмы
4. Продолжай историю логически
5. Если это Pre-Chorus - добавь ощущение нарастания
6. Если это Chorus - сделай запоминающимся

Верни ТОЛЬКО текст секции (${linesCount || 4} строк).`;
        break;

      case 'continue_line':
        systemPrompt = baseSystemPrompt + `\n\nТы помогаешь в режиме коллаборации.`;
        userPrompt = `Предложи следующую строку для секции ${sectionType || 'verse'}.

ТЕКУЩИЙ ТЕКСТ:
${currentLyrics}

ТЕМА: ${theme || 'любовь'}
ЖАНР: ${genre || 'поп'}
НАСТРОЕНИЕ: ${mood || 'романтичное'}

ТРЕБОВАНИЯ:
- Одна строка, продолжающая текст
- Рифма с предыдущей строкой
- Сохраняй ритм
- Можно добавить (указание) если усилит эмоцию

Верни ТОЛЬКО одну строку.`;
        break;

      case 'suggest_rhymes':
        systemPrompt = `Ты эксперт по рифмам на ${language === 'ru' ? 'русском' : 'английском'} языке.`;
        userPrompt = `Предложи рифмы к слову "${word}".

${context ? `КОНТЕКСТ:\n${context}\n` : ''}

Требования:
- 8-12 разнообразных рифм
- Точные рифмы (совпадение окончаний)
- Ассонансные рифмы (совпадение гласных)
- Рифмы подходящие для песенного текста

Формат ответа:
ТОЧНЫЕ: рифма1, рифма2, рифма3
АССОНАНСНЫЕ: рифма1, рифма2, рифма3
СОСТАВНЫЕ: фраза1, фраза2`;
        break;

      case 'analyze_lyrics':
        systemPrompt = baseSystemPrompt + `\n\nТы анализируешь текст и даёшь профессиональные рекомендации.`;
        userPrompt = `Проанализируй текст песни и предложи улучшения:

ТЕКСТ:
${lyrics || existingLyrics}

ЖАНР: ${genre || 'поп'}
НАСТРОЕНИЕ: ${mood || 'неизвестно'}

Верни анализ в формате:

📊 АНАЛИЗ СТРУКТУРЫ:
- Найденные секции: ...
- Рекомендации: ...

🎤 ВОКАЛЬНЫЕ РЕКОМЕНДАЦИИ:
- Текущие теги: ...
- Добавить: (тег1) для строки X, (тег2) для строки Y

🎸 ИНСТРУМЕНТАЛЬНЫЕ РЕКОМЕНДАЦИИ:
- Добавить: [Guitar Solo] после припева, [Piano Break] в бридже

🌊 ДИНАМИЧЕСКИЕ РЕКОМЕНДАЦИИ:
- Добавить [Build] перед: ...
- Добавить [Drop] после: ...

💫 ОБЩИЕ УЛУЧШЕНИЯ:
- Рифмы: ...
- Метафоры: ...
- Ритм: ...`;
        break;

      case 'optimize_for_suno':
        systemPrompt = baseSystemPrompt + `\n\nТы оптимизируешь текст для максимального качества генерации в Suno AI.`;
        userPrompt = `Оптимизируй текст для Suno AI:

ТЕКСТ:
${lyrics || existingLyrics}

ЖАНР: ${genre || 'поп'}

ЗАДАЧИ ОПТИМИЗАЦИИ:
1. ✅ Убедись что текст < 3000 символов (обрежь если нужно)
2. ✅ Проверь все структурные теги (каждая секция должна иметь [...])
3. ✅ Добавь/улучши вокальные указания для ключевых моментов
4. ✅ Удали лишние символы и эмодзи
5. ✅ Убедись что [Build] стоит перед припевами
6. ✅ Добавь [Outro] в конце если нет
7. ✅ Замени сложные слова на более музыкальные
8. ✅ Проверь рифмы на благозвучность

Верни оптимизированный текст готовый для генерации.`;
        break;

      case 'context_recommendations':
        // Get AI recommendations based on project/track context
        const recContext = body.context || {};
        const recProject = recContext.projectContext;
        const recTrack = recContext.trackContext;
        
        systemPrompt = `Ты музыкальный продюсер, дающий персонализированные рекомендации.`;
        userPrompt = `Дай 5-7 креативных рекомендаций для написания текста песни.

КОНТЕКСТ:
${recProject ? `
- Проект: ${recProject.title}
- Жанр: ${recProject.genre || 'не указан'}
- Настроение: ${recProject.mood || 'не указано'}
- Концепция: ${recProject.concept || 'не указана'}
- Существующие треки: ${recProject.existingTracks?.map((t: any) => t.title).join(', ') || 'нет'}
` : 'Проект не указан'}

${recTrack ? `
- Текущий трек: ${recTrack.title}
- Позиция в альбоме: ${recTrack.position}
- Стиль: ${recTrack.stylePrompt || 'не указан'}
` : ''}

ТЕКУЩИЙ ТЕКСТ (если есть):
${recContext.currentLyrics || 'Текст ещё не создан'}

Верни JSON массив рекомендаций:
[
  {"label": "🎵 Краткое описание", "value": "действие", "description": "Подробное описание рекомендации"},
  ...
]

Учитывай:
- Позицию трека в альбоме (intro, кульминация, outro)
- Жанровые особенности
- Связность с другими треками проекта
- Уникальность относительно уже существующих тем`;
        break;

      case 'generate_compound_tags':
        systemPrompt = `Ты эксперт по тегам Suno AI V4.5+ и составным (compound) тегам.`;
        userPrompt = `Сгенерируй оптимальные составные теги для секций песни.

ЖАНР: ${genre || 'поп'}
НАСТРОЕНИЕ: ${mood || 'романтичное'}
${theme ? `ТЕМА: ${theme}` : ''}

${lyrics ? `ТЕКСТ:\n${lyrics}\n` : ''}

Для каждой типичной секции песни создай оптимальные составные теги:

Формат ответа (JSON):
{
  "intro": "[Intro] [тег1] [тег2]",
  "verse": "[Verse] [тег1] [тег2] [тег3]",
  "preChorus": "[Pre-Chorus] [тег1] [тег2]",
  "chorus": "[Chorus] [тег1] [тег2] [тег3]",
  "bridge": "[Bridge] [тег1] [тег2]",
  "outro": "[Outro] [тег1] [тег2]",
  "vocalDirections": ["(направление1)", "(направление2)"],
  "backingVocals": ["(ooh, aah)", "(harmony)"],
  "dynamics": ["[Build]", "[Drop]", "[Breakdown]"]
}

Учитывай жанр ${genre} и настроение ${mood}.`;
        break;

      case 'analyze_rhythm':
        systemPrompt = `Ты эксперт по ритмике и просодии песенных текстов.`;
        userPrompt = `Проанализируй ритмическую структуру текста:

ТЕКСТ:
${lyrics || existingLyrics}

Проведи анализ:
1. Количество слогов в каждой строке
2. Схема ударений (сильные/слабые доли)
3. Соответствие типичным песенным ритмам
4. Проблемные места (слишком длинные/короткие строки)
5. Рекомендации по улучшению

Формат ответа (JSON):
{
  "analysis": [
    {"line": "текст строки", "syllables": 8, "stress": "да-ДА-да-ДА-да-ДА-да-ДА", "ok": true},
    ...
  ],
  "issues": ["Строка 3 слишком длинная (12 слогов)", ...],
  "recommendations": ["Сократить строку 3 до 8 слогов", ...],
  "overallScore": 85
}`;
        break;

      case 'fit_structure':
        systemPrompt = baseSystemPrompt + `\n\nТы адаптируешь текст под заданную структуру песни.`;
        userPrompt = `Подгони текст под структуру песни:

ИСХОДНЫЙ ТЕКСТ:
${lyrics || existingLyrics}

ЦЕЛЕВАЯ СТРУКТУРА: ${structure || 'Intro, Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus, Chorus, Bridge, Final Chorus, Outro'}

ЖАНР: ${genre || 'поп'}
НАСТРОЕНИЕ: ${mood || 'романтичное'}

ЗАДАЧИ:
1. Распределить/переписать текст по заданным секциям
2. Добавить составные теги V4.5+ к каждой секции
3. Добавить вокальные направляющие
4. Добавить бэк-вокальные партии где уместно
5. Убедиться что припевы повторяются (можно с вариациями)
6. Добавить динамические переходы [Build], [Drop]

Верни полный отформатированный текст.`;
        break;

      case 'chat':
        // Build rich context from provided data
        const chatContext = body.context || {};
        const projectInfo = chatContext.projectContext;
        const trackInfo = chatContext.trackContext;
        const conversationHistory = chatContext.conversationHistory || [];
        
        systemPrompt = `Ты опытный автор песен и музыкальный продюсер, работающий как ассистент в чате.

КОНТЕКСТ ПРОЕКТА:
${projectInfo ? `
- Название проекта: ${projectInfo.title || 'не указано'}
- Жанр: ${projectInfo.genre || 'не указан'}
- Настроение: ${projectInfo.mood || 'не указано'}
- Концепция: ${projectInfo.concept || 'не указана'}
- Существующих треков: ${projectInfo.existingTracks?.length || 0}
` : 'Контекст проекта не задан'}

${trackInfo ? `
КОНТЕКСТ ТРЕКА:
- Название: ${trackInfo.title || 'не указано'}
- Стиль: ${trackInfo.stylePrompt || 'не указан'}
- Рекомендуемые теги: ${trackInfo.recommendedTags?.join(', ') || 'не заданы'}
` : ''}

ТЕКУЩИЙ ТЕКСТ ПЕСНИ:
${chatContext.currentLyrics || 'Текст ещё не создан'}

ИСТОРИЯ ДИАЛОГА:
${conversationHistory.slice(-5).map((m: any) => `${m.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${m.content}`).join('\n') || 'Начало диалога'}

ИНСТРУКЦИИ:
1. Понимай намерения пользователя из контекста
2. Если просят создать/изменить текст - верни его в поле "lyrics"
3. Если обсуждение/вопрос - верни ответ в поле "response"
4. Предлагай следующие шаги в поле "suggestions" (массив объектов с label и value)
5. Используй контекст проекта для релевантных предложений
6. При создании текста используй профессиональные теги Suno

ФОРМАТ ОТВЕТА (строго JSON):
{
  "lyrics": "текст песни (если создаёшь/меняешь)",
  "response": "текстовый ответ пользователю",
  "suggestions": [{"label": "🎵 Предложение", "value": "действие"}]
}

Язык: ${language === 'ru' ? 'русский' : 'английский'}`;

        userPrompt = body.message || 'Привет';
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

    logger.info('AI Lyrics request', { action, theme, mood, genre, language, useAdvancedTags });

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
        max_tokens: action === 'suggest_rhymes' ? 300 : action === 'continue_line' ? 150 : 2500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logger.error('AI Gateway error', null, { status: aiResponse.status, error: errorText });
      
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

    logger.success('Lyrics generated', { action, contentLength: generatedLyrics.length });

    // Return additional metadata for smart_generate
    let response: any = {
      success: true,
      action,
    };

    // Handle chat action response (JSON parsing)
    if (action === 'chat') {
      try {
        // Try to parse JSON response from AI
        const jsonMatch = generatedLyrics.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          response.lyrics = parsed.lyrics || null;
          response.response = parsed.response || generatedLyrics;
          response.suggestions = parsed.suggestions || null;
        } else {
          response.response = generatedLyrics;
        }
      } catch (e) {
        // If JSON parsing fails, return raw text as response
        response.response = generatedLyrics;
      }
    } else {
      response.lyrics = generatedLyrics;
    }

    if (action === 'smart_generate' || action === 'generate') {
      response.metadata = {
        genre,
        mood,
        recommendedTags: {
          vocal: [...(genreProfile?.vocal || []), ...(moodProfile?.vocal || [])],
          instruments: genreProfile?.instruments || [],
          dynamics: [...(genreProfile?.dynamics || []), ...(moodProfile?.dynamics || [])],
          emotions: [...(genreProfile?.emotions || []), ...(moodProfile?.emotions || [])],
        },
        customTagsUsed: useAdvancedTags ? { vocalTags, instrumentTags, dynamicTags, emotionalCues } : null,
      };
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logger.error('Error in ai-lyrics-assistant', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
