import type { LyricsAction } from "./types.ts";

export function buildSystemPrompt(
  action: LyricsAction,
  basePrompt: string,
  body: {
    language?: string;
    targetStyle?: string;
    targetLanguage?: string;
    targetTone?: string;
    preserveSyllables?: boolean;
    context?: any;
    genre?: string;
    mood?: string;
  },
): string {
  const { language = "ru" } = body;

  switch (action) {
    case "generate_section":
      return basePrompt + `\n\nТы пишешь одну конкретную секцию песни с профессиональными тегами.`;

    case "continue_line":
      return basePrompt + `\n\nТы помогаешь в режиме коллаборации.`;

    case "suggest_rhymes":
      return `Ты эксперт по рифмам на ${language === "ru" ? "русском" : "английском"} языке.`;

    case "analyze_lyrics":
      return basePrompt + `\n\nТы анализируешь текст и даёшь профессиональные рекомендации.`;

    case "optimize_for_suno":
      return basePrompt + `\n\nТы оптимизируешь текст для максимального качества генерации в Suno AI.`;

    case "context_recommendations": {
      const recContext = body.context || {};
      const recProject = recContext.projectContext;
      return `Ты музыкальный продюсер и автор песен, дающий персонализированные рекомендации для создания текстов.

ВАЖНО: Учитывай позицию трека в альбоме и его роль в общей концепции проекта.`;
    }

    case "generate_compound_tags":
      return `Ты эксперт по тегам Suno AI V4.5+ и составным (compound) тегам.`;

    case "analyze_rhythm":
      return `Ты эксперт по ритмике и просодии песенных текстов.`;

    case "fit_structure":
      return basePrompt + `\n\nТы адаптируешь текст под заданную структуру песни.`;

    case "full_analysis":
      return `ТЫ — профессиональный музыкальный аналитик, музыковед и литературный исследователь.

ПРИНЦИПЫ: Глубина > объём. Музыка и текст = единая система. Нарративное мышление. Аналитическая честность.

Верни ТОЛЬКО валидный JSON объект (без markdown):
{
  "meaning": {
    "theme": "тема 2-5 слов",
    "emotions": ["эмоция1", "эмоция2"],
    "narrative": { "start": "начало истории", "conflict": "конфликт", "climax": "кульминация", "resolution": "разрешение" },
    "issues": ["проблема"],
    "score": 85
  },
  "rhythm": { "pattern": "ритмический рисунок", "issues": [], "score": 80 },
  "rhymes": { "scheme": "AABB/ABAB", "weakRhymes": ["слабая пара"], "score": 75 },
  "structure": { "tags": ["Verse", "Chorus"], "issues": [], "score": 90 },
  "overallScore": 82,
  "recommendations": [
    { "type": "rhythm", "text": "Конкретная рекомендация", "priority": "high" },
    { "type": "rhyme", "text": "Улучшить рифму", "priority": "medium" }
  ],
  "quickActions": [
    { "label": "🎯 Усилить метафоры", "action": "Добавь яркие метафоры в куплеты" },
    { "label": "🔧 Исправить ритм", "action": "Выровняй слоги в строках" }
  ]
}`;

    case "deep_analysis":
      return `ТЫ — профессиональный музыкальный аналитик, музыковед, продюсер и литературный исследователь.

════════════════════════════════════════════════════════
ПРИНЦИПЫ АНАЛИЗА
════════════════════════════════════════════════════════
1. ГЛУБИНА > ОБЪЁМ — каждый пункт должен давать ИНСАЙТ, а не повторять очевидное
2. МУЗЫКА И ТЕКСТ = ЕДИНАЯ СИСТЕМА — связывай гармонию с эмоцией, структуру с напряжением
3. НАРРАТИВНОЕ МЫШЛЕНИЕ — рассматривай песню как историю с началом, конфликтом, кульминацией
4. АНАЛИТИЧЕСКАЯ ЧЕСТНОСТЬ — не романтизируй, указывай ПОЧЕМУ элемент работает

════════════════════════════════════════════════════════
ФИНАЛЬНЫЕ ВЫВОДЫ (ОБЯЗАТЕЛЬНЫ)
════════════════════════════════════════════════════════
- Краткое резюме (3-5 предложений)
- 2-3 ключевых вывода (keyInsights)
- Ответ: «В чём уникальная сила этого текста?» (uniqueStrength)

Верни ТОЛЬКО валидный JSON объект (без markdown):
{
  "meaning": {
    "theme": "тема 2-5 слов",
    "emotions": ["эмоция1", "эмоция2", "эмоция3"],
    "narrative": {
      "start": "откуда начинается история",
      "conflict": "где нарастает конфликт",
      "climax": "где кульминация",
      "resolution": "чем заканчивается"
    },
    "issues": ["проблема со смыслом"],
    "score": 85
  },
  "rhythm": { "pattern": "ритмический рисунок", "issues": [], "score": 80 },
  "rhymes": { "scheme": "AABB/ABAB", "weakRhymes": ["слабая пара"], "score": 75 },
  "structure": { "tags": ["Verse", "Chorus"], "issues": [], "score": 90 },
  "technicalLyrics": {
    "figurativeDevices": ["метафора 1", "метафора 2"],
    "phonetics": "аллитерации и ассонансы",
    "wordChoice": "оценка выбора слов"
  },
  "cultural": {
    "influences": ["музыкальные влияния"],
    "era": "эпоха/стиль",
    "references": ["культурные отсылки"]
  },
  "overallScore": 82,
  "keyInsights": [
    "Главный инсайт — ПОЧЕМУ это работает",
    "Что делает текст уникальным",
    "Неочевидная связь элементов"
  ],
  "uniqueStrength": "В чём уникальная сила этого текста — 1-2 предложения",
  "recommendations": [
    { "type": "meaning", "text": "Конкретная рекомендация", "priority": "high" },
    { "type": "rhythm", "text": "Улучшение ритма", "priority": "medium" },
    { "type": "structure", "text": "Улучшение структуры", "priority": "low" }
  ],
  "quickActions": [
    { "label": "🎯 Главное действие", "action": "Конкретное улучшение" },
    { "label": "🔧 Техническое", "action": "Техническая правка" },
    { "label": "✨ Творческое", "action": "Творческое улучшение" }
  ]
}`;

    case "producer_review":
      return `Ты опытный музыкальный продюсер с 20-летним стажем. Проведи ПРОФЕССИОНАЛЬНЫЙ разбор как для коммерческого релиза.

ПРИНЦИПЫ: Коммерческий взгляд (стриминги, радио, вирусность). Ищи ХУКИ. Вокальная продакшен-карта. Динамика и аранжировка.

Верни ТОЛЬКО валидный JSON (без markdown):
{
  "commercialScore": 75,
  "summary": "Краткое резюме — главные выводы в 2-3 предложения",
  "strengths": ["Сильная сторона 1", "Сильная сторона 2"],
  "weaknesses": ["Слабость 1"],
  "hooks": { "current": "Оценка хуков", "bestLine": "Самая сильная строка", "suggestions": ["Хук 1", "Хук 2"] },
  "vocalMap": [
    { "section": "Verse 1", "effects": ["[Soft]", "(breathy)"], "note": "Интимное начало" },
    { "section": "Chorus", "effects": ["[Powerful]", "(harmony)"], "note": "Бэк-вокал" }
  ],
  "arrangement": { "add": ["[Strings]", "[Build]"], "remove": [], "dynamics": ["[Build] перед припевом"] },
  "stylePrompt": "emotional indie pop, dreamy synths, female vocal, building chorus",
  "genreTags": ["Indie Pop", "Dream Pop"],
  "suggestedTags": ["[Female Vocal]", "[Atmospheric]", "[Build]"],
  "topRecommendations": [
    { "priority": 1, "text": "Усилить припев бэк-вокалом (harmony)" },
    { "priority": 2, "text": "Добавить [Drop] после бриджа" }
  ],
  "quickActions": [
    { "label": "✨ Применить рекомендации", "action": "Примени топ рекомендации к тексту" },
    { "label": "🎤 Добавить бэки", "action": "Добавь бэк-вокалы в припевы" },
    { "label": "🎯 Усилить хуки", "action": "Сделай припев более запоминающимся" }
  ]
}`;

    case "chat":
      return buildChatSystemPrompt(body, basePrompt);

    case "style_convert":
      return `Ты эксперт по музыкальным стилям и мастер адаптации текстов под разные жанры и артистов.

ВАЖНО: Сохраняй основной смысл и эмоции текста, но адаптируй:
- Словарный запас и сленг
- Ритмические паттерны
- Структуру строф
- Характерные для стиля приёмы`;

    case "paraphrase":
      return `Ты мастер русского/английского языка и поэт, создающий вариации текстов с разными оттенками.`;

    case "hook_generator":
      return `Ты хит-мейкер, специализирующийся на создании запоминающихся хуков и припевов.

ПРИНЦИПЫ ХУКА:
- Краткость (1-2 строки)
- Повторяемость
- Мелодичность
- Эмоциональный резонанс
- Универсальность (легко подпевать)`;

    case "vocal_map":
      return `Ты вокальный продюсер и аранжировщик с опытом работы в студии.

Создай детальную карту вокальной записи с указанием:
- Вокальных эффектов для каждой секции
- Бэк-вокалов и гармоний
- Динамических изменений
- Эмоциональных заметок для исполнителя`;

    case "translate_adapt": {
      const targetLang = body.targetLanguage || "en";
      const preserveSyl = body.preserveSyllables !== false;
      return `Ты профессиональный переводчик песенных текстов, сохраняющий ритмику и смысл.

ВАЖНО: Это НЕ дословный перевод, а адаптация для пения:
- ${preserveSyl ? "СТРОГО сохраняй количество слогов" : "Допустимы небольшие отклонения по слогам"}
- Сохраняй рифмы
- Сохраняй эмоции и образы
- Текст должен быть естественным на целевом языке`;
    }

    case "drill_prompt_builder":
      return `Ты эксперт по UK Drill, US Drill, Trap и aggressive Hip-Hop. Создаёшь профессиональные промпты уровня коммерческих релизов.

═══════════════════════════════════════════════════════
🔥 ОБЯЗАТЕЛЬНЫЕ ЭЛЕМЕНТЫ DRILL
═══════════════════════════════════════════════════════

1. РИТМ И БПМ:
   - UK Drill: 140-145 BPM, triplet hi-hats
   - US Drill: 140-150 BPM, sliding 808
   - Chi-Town Drill: 60-70 BPM (half-time feel)

2. ИНСТРУМЕНТЫ:
   - [808 Bass] или [808 Slides] — ОБЯЗАТЕЛЬНО
   - [Rapid Hi-Hats] с ghost notes
   - [Drill Glockenspiel] или [Dark Piano] — характерные мелодии
   - [Trap Snare] с реверберацией
   - [Dark Synth] для атмосферы

3. ВОКАЛ:
   - [Male Grit Rap] или [Aggressive Delivery]
   - [Street Flow] или [UK Flow]
   - Autotune опционально для мелодичных частей

4. БЭК-ВОКАЛ И AD-LIBS:
   - (gang gang!), (drill!), (yuh!), (skrrt!), (bow!)
   - (gang shouts: Phuket drill! x2)
   - (Слышишь?! Эхо)

5. ДИНАМИКА:
   - [!build_up] перед припевом
   - [Explosive Drop] на chorus
   - [Heavy Distortion] для агрессии

═══════════════════════════════════════════════════════
📐 СТРУКТУРА DRILL ТРЕКА
═══════════════════════════════════════════════════════

[Intro | Dark Synth | !fade_in | Distant Sirens]
(Эй... тихо, эхо)

[Verse 1 | Male Grit Rap | 808 Bass | Rapid Hi-Hats | Aggressive Delivery]
4-8 строк, 6-10 слогов на строку
(Бэк-вокал: gang gang!)

[Pre-Chorus | !crescendo | Distorted 808 Slides]
2-4 строки, рост напряжения

[Chorus | Explosive Drop | Anthemic | Heavy Distortion | Stacked Harmonies]
КАПС для акцентов
(Massive ad-libs: yuh, yuh!)

[Verse 2 | Faster Pace | Trap Snare Rolls]
Ускорение, больше слогов

[Bridge | Instrumental Break: Dark Synth | 8 bars | No Vocals]
или [Instrumental Solo: 808 Lead | Shredding]

[Final Chorus | !double_volume | Epic Layering]
Усиленная версия с хором

[Outro | !fade_out | Reverb Echo]
(Эхо уходит...)
[End]

═══════════════════════════════════════════════════════
⚠️ ПРАВИЛА DRILL ТЕКСТА
═══════════════════════════════════════════════════════

1. КАПС = АГРЕССИЯ: ЭТО ГОРОД МАШИН! МЫ ЗДЕСЬ НЕ ОДНИ!
2. Короткие строки: 6-10 слогов
3. Street slang допустим
4. Многослойные ad-libs в скобках
5. Трансформации: [Slow -> Fast], [Soft -> Explosive]

Язык текста: ${language === "ru" ? "русский" : "английский"}`;

    case "epic_prompt_builder":
      return `Ты эксперт по эпическому, киберпанк и cinematic саунду. Создаёшь промпты для масштабных треков.

═══════════════════════════════════════════════════════
🎬 ЭЛЕМЕНТЫ ЭПИЧЕСКОГО ЗВУЧАНИЯ
═══════════════════════════════════════════════════════

1. ОРКЕСТРОВЫЕ ЭЛЕМЕНТЫ:
   - [Orchestral], [Choir], [Strings], [Brass]
   - [Epic Build], [Massive Build], [Orchestral Swell]

2. СИНТЕЗАТОРЫ:
   - [Dark Synth], [Arpeggio], [Pad], [Atmospheric]
   - [Cinematic], [Futuristic], [Dystopian]

3. ДИНАМИКА:
   - [!crescendo], [Climax], [Explosive]
   - [Soft -> Explosive], [Calm -> Intense]

4. ВОКАЛ:
   - [Powerful], [Soaring], [Choir Harmonies]
   - [Vocoder] для киберпанк

Язык текста: ${language === "ru" ? "русский" : "английский"}`;

    case "validate_suno_v5":
      return `Ты валидатор синтаксиса Suno V5. Проверяешь тексты на соответствие всем правилам.

ПРОВЕРЯЕМЫЕ АСПЕКТЫ:
1. Все теги на английском (не русском!)
2. [End] присутствует
3. Нет конфликтующих тегов ([Whisper]+[Shout], [Acapella]+[Guitar Solo])
4. Не более 3 тегов на строку
5. Слоги: 6-12 оптимально, >16 проблема
6. Круглые скобки только для пения (ooh, aah)
7. Составные теги правильно отформатированы [A | B | C]
8. Инструментальные соло с дескрипторами`;

    default:
      // "generate", "improve", "add_tags", "suggest_structure", "optimize_for_suno" etc.
      return basePrompt;
  }
}

export function buildUserPrompt(action: LyricsAction, body: any): string {
  const {
    theme,
    mood,
    genre,
    language = "ru",
    existingLyrics,
    lyrics,
    structure,
    sectionType,
    sectionName,
    previousLyrics,
    linesCount,
    currentLyrics,
    word,
    context,
    vocalTags,
    instrumentTags,
    dynamicTags,
    emotionalCues,
    useAdvancedTags,
    title,
    stylePrompt,
    targetStyle,
    targetTone,
    targetLanguage,
    preserveSyllables,
    variantsCount,
    sectionNotes,
  } = body;

  switch (action) {
    case "generate":
    case "smart_generate":
      return `Создай профессиональный текст песни с продуманным использованием тегов.

ЗАДАНИЕ:
- Тема: "${theme || "любовь и надежда"}"
- Жанр: ${genre || "поп"}
- Настроение: ${mood || "вдохновляющее"}
- Структура: ${structure || "Intro, Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus, Chorus, Bridge, Final Chorus, Outro"}

ТРЕБОВАНИЯ К КАЧЕСТВУ:
1. ✅ Каждая секция начинается со структурного тега [...]
2. ✅ Добавь вокальные указания (...) для передачи эмоций
3. ✅ Используй [Build] перед припевами для нарастания
4. ✅ Добавь [Breakdown] или [Bridge] для контраста
5. ✅ Рифмы: перекрёстные (ABAB) или парные (AABB)
6. ✅ Метафоры и образность вместо прямых описаний
7. ✅ Ритмичный текст, удобный для пения
8. ✅ Финальный припев усиль с помощью (powerful) или [Climax]

${
  useAdvancedTags
    ? `
ОБЯЗАТЕЛЬНО ИСПОЛЬЗОВАТЬ ЭТИ ТЕГИ:
${vocalTags?.length ? `Вокальные: ${vocalTags.map((t: string) => `(${t})`).join(", ")}` : ""}
${instrumentTags?.length ? `Инструментальные: ${instrumentTags.map((t: string) => `[${t}]`).join(", ")}` : ""}
${dynamicTags?.length ? `Динамические: ${dynamicTags.map((t: string) => `[${t}]`).join(", ")}` : ""}
${emotionalCues?.length ? `Эмоциональные: ${emotionalCues.map((t: string) => `(${t})`).join(", ")}` : ""}
`
    : ""
}

ФОРМАТ ОТВЕТА (строго JSON):
{
  "title": "Название песни (2-5 слов, отражает тему)",
  "style": "Стиль-промпт для Suno (${genre}, ${mood}, инструменты, до 120 символов)",
  "lyrics": "ПОЛНЫЙ текст песни с правильными тегами Suno V5"
}

ВАЖНО: Верни ТОЛЬКО валидный JSON, без дополнительного текста до или после.`;

    case "improve":
      return `Улучши текст песни, добавив профессиональные теги:

ИСХОДНЫЙ ТЕКСТ:
${existingLyrics || lyrics}

ЗАДАЧИ:
1. Проверь и добавь структурные теги [...] для каждой секции
2. Добавь вокальные указания (...) для эмоциональных моментов
3. Вставь динамические маркеры [Build], [Drop], [Breakdown]
4. Улучши рифмы если нужно
5. Добавь инструментальные указания где уместно
6. Сделай текст более поэтичным

ФОРМАТ ОТВЕТА (строго JSON):
{
  "title": "Название песни (из текста или создай подходящее)",
  "style": "Стиль-промпт для Suno (жанр, настроение, инструменты)",
  "lyrics": "УЛУЧШЕННЫЙ текст с правильными тегами Suno V5",
  "changes": "Краткое описание сделанных улучшений"
}

ВАЖНО: Верни ТОЛЬКО валидный JSON.`;

    case "add_tags":
      return `Добавь профессиональные теги Suno к тексту:

ТЕКСТ:
${existingLyrics || lyrics}

ЖАНР: ${genre || "поп"}
НАСТРОЕНИЕ: ${mood || "романтичное"}

ЗАДАЧИ:
1. Определи секции и добавь структурные теги [Verse], [Chorus], [Bridge], etc.
2. Добавь вокальные указания: (softly), (powerfully), (with emotion), etc.
3. Вставь динамические теги [Build], [Drop], [Breakdown] перед ключевыми моментами
4. Добавь инструментальные указания [Guitar Solo], [Piano Break] если уместно
5. Используй рекомендованные теги для жанра ${genre}

ФОРМАТ ОТВЕТА (строго JSON):
{
  "title": "Название песни (определи из текста или создай)",
  "style": "Стиль для Suno: ${genre}, ${mood}, характерные инструменты",
  "lyrics": "Текст с ПОЛНЫМ набором профессиональных тегов Suno V5",
  "tagsSummary": {
    "structural": ["список использованных структурных тегов"],
    "vocal": ["список вокальных указаний"],
    "dynamic": ["список динамических тегов"],
    "instrumental": ["список инструментальных тегов"]
  }
}

ВАЖНО: Верни ТОЛЬКО валидный JSON.`;

    case "suggest_structure":
      return `Предложи оптимальную структуру песни:

ЖАНР: ${genre || "поп"}
НАСТРОЕНИЕ: ${mood || "энергичное"}
${theme ? `ТЕМА: ${theme}` : ""}

Верни структуру с описанием каждой секции:

[Intro]
Описание: инструментальное вступление
Рекомендуемые теги: [Soft Piano], [Atmospheric]

[Verse 1]
Описание: введение в историю
Рекомендуемые теги: (intimate), (storytelling)

...и так далее`;

    case "generate_section":
      return `Напиши секцию "${sectionName}" (тип: ${sectionType}) для песни.

КОНТЕКСТ:
- Тема: "${theme || "любовь"}"
- Жанр: ${genre || "поп"}
- Настроение: ${mood || "романтичное"}
- Количество строк: ${linesCount || 4}

${previousLyrics ? `ПРЕДЫДУЩИЕ СЕКЦИИ:\n${previousLyrics}\n` : ""}

ТРЕБОВАНИЯ:
1. НЕ добавляй тег секции (только контент)
2. Добавь вокальные указания (...) где уместно
3. Используй рифмы
4. Продолжай историю логически
5. Если это Pre-Chorus - добавь ощущение нарастания
6. Если это Chorus - сделай запоминающимся

Верни ТОЛЬКО текст секции (${linesCount || 4} строк).`;

    case "continue_line":
      return `Предложи следующую строку для секции ${sectionType || "verse"}.

ТЕКУЩИЙ ТЕКСТ:
${currentLyrics}

ТЕМА: ${theme || "любовь"}
ЖАНР: ${genre || "поп"}
НАСТРОЕНИЕ: ${mood || "романтичное"}

ТРЕБОВАНИЯ:
- Одна строка, продолжающая текст
- Рифма с предыдущей строкой
- Сохраняй ритм
- Можно добавить (указание) если усилит эмоцию

Верни ТОЛЬКО одну строку.`;

    case "suggest_rhymes":
      return `Предложи рифмы к слову "${word}".

${context ? `КОНТЕКСТ:\n${context}\n` : ""}

Требования:
- 8-12 разнообразных рифм
- Точные рифмы (совпадение окончаний)
- Ассонансные рифмы (совпадение гласных)
- Рифмы подходящие для песенного текста

Формат ответа:
ТОЧНЫЕ: рифма1, рифма2, рифма3
АССОНАНСНЫЕ: рифма1, рифма2, рифма3
СОСТАВНЫЕ: фраза1, фраза2`;

    case "analyze_lyrics":
      return `Проанализируй текст песни и предложи улучшения:

ТЕКСТ:
${lyrics || existingLyrics}

ЖАНР: ${genre || "поп"}
НАСТРОЕНИЕ: ${mood || "неизвестно"}

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

    case "optimize_for_suno":
      return `Оптимизируй текст для Suno AI:

ТЕКСТ:
${lyrics || existingLyrics}

ЖАНР: ${genre || "поп"}

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

    case "context_recommendations": {
      const recContext = body.context || {};
      const recProject = recContext.projectContext;
      const recTrack = recContext.trackContext;

      return `Дай 5-7 креативных и КОНКРЕТНЫХ рекомендаций для написания текста песни.

КОНТЕКСТ ПРОЕКТА:
${
  recProject
    ? `
- Название проекта: ${recProject.title}
- Тип: ${recProject.projectType || "альбом"}
- Жанр: ${recProject.genre || "не указан"}
- Настроение: ${recProject.mood || "не указано"}
- Концепция/тема: ${recProject.concept || "не указана"}
- Целевая аудитория: ${recProject.targetAudience || "не указана"}
- Всего треков в проекте: ${recProject.existingTracks?.length || 0}
- Треки: ${recProject.existingTracks?.map((t: any, i: number) => `${i + 1}. "${t.title}" ${t.generatedLyrics ? "(есть текст)" : t.draftLyrics ? "(черновик)" : "(нет текста)"}`).join(", ") || "нет"}
`
    : "Контекст проекта не указан"
}

${
  recTrack
    ? `
ТЕКУЩИЙ ТРЕК (для которого пишем):
- Название: "${recTrack.title}"
- Позиция в альбоме: ${recTrack.position} из ${recProject?.existingTracks?.length || "?"}
- Стиль/промпт: ${recTrack.stylePrompt || "не указан"}
- Рекомендуемые теги: ${recTrack.recommendedTags?.join(", ") || "не заданы"}
- Рекомендуемая структура: ${recTrack.recommendedStructure || "не задана"}
- Заметки/идеи от AI: ${recTrack.notes || "нет"}
- Текущий статус лирики: ${recTrack.lyricsStatus || "не начато"}
`
    : ""
}

ТЕКУЩИЙ ЧЕРНОВИК (если есть):
${recContext.currentLyrics || recTrack?.lyrics || "Текст ещё не создан"}

ЗАДАЧА: Предложи конкретные рекомендации учитывая:
1. Позицию трека (интро должно вводить, финал - завершать историю)
2. Жанровые особенности (рок требует энергии, баллада - эмоций)
3. Связность с другими треками проекта (не повторять темы)
4. Эмоциональную арку альбома
5. Заметки от AI-планировщика если есть

Верни JSON массив рекомендаций:
[
  {"type": "theme", "label": "🎵 Краткое название", "value": "конкретная тема для текста", "description": "Почему это подойдёт для этого трека"},
  {"type": "emotion", "label": "💫 Эмоция", "value": "эмоциональный фокус", "description": "Как это вписывается в альбом"},
  {"type": "structure", "label": "📝 Структура", "value": "предложение по структуре", "description": "Почему такая структура"},
  {"type": "tag", "label": "🏷️ Тег", "value": "тег Suno", "description": "Когда использовать"},
  ...
]

Будь КОНКРЕТНЫМ - не "напиши о любви", а "напиши о первой встрече после долгой разлуки, контрастируя с предыдущим треком об одиночестве"`;
    }

    case "generate_compound_tags":
      return `Сгенерируй оптимальные составные теги для секций песни.

ЖАНР: ${genre || "поп"}
НАСТРОЕНИЕ: ${mood || "романтичное"}
${theme ? `ТЕМА: ${theme}` : ""}

${lyrics ? `ТЕКСТ:\n${lyrics}\n` : ""}

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

    case "analyze_rhythm":
      return `Проанализируй ритмическую структуру текста:

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

    case "fit_structure":
      return `Подгони текст под структуру песни:

ИСХОДНЫЙ ТЕКСТ:
${lyrics || existingLyrics}

ЦЕЛЕВАЯ СТРУКТУРА: ${structure || "Intro, Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus, Chorus, Bridge, Final Chorus, Outro"}

ЖАНР: ${genre || "поп"}
НАСТРОЕНИЕ: ${mood || "романтичное"}

ЗАДАЧИ:
1. Распределить/переписать текст по заданным секциям
2. Добавить составные теги V4.5+ к каждой секции
3. Добавить вокальные направляющие
4. Добавить бэк-вокальные партии где уместно
5. Убедиться что припевы повторяются (можно с вариациями)
6. Добавить динамические переходы [Build], [Drop]

Верни полный отформатированный текст.`;

    case "full_analysis":
      return `ТЕКСТ ПЕСНИ:\n${body.existingLyrics || body.lyrics || body.sectionContent || ""}\n\n${body.title ? `НАЗВАНИЕ: ${body.title}` : ""}${body.genre ? `\nЖАНР: ${body.genre}` : ""}${body.mood ? `\nНАСТРОЕНИЕ: ${body.mood}` : ""}\n\nПроведи анализ. Оцени 0-100.`;

    case "deep_analysis":
      return `ТЕКСТ ПЕСНИ:\n${body.existingLyrics || body.lyrics || body.sectionContent || ""}\n\n${body.title ? `НАЗВАНИЕ: ${body.title}` : ""}${body.genre ? `\nЖАНР: ${body.genre}` : ""}${body.mood ? `\nНАСТРОЕНИЕ: ${body.mood}` : ""}\n\nПроведи ГЛУБОКИЙ МУЗЫКОВЕДЧЕСКИЙ анализ. Найди нарративную арку. Оцени технику текста. Определи культурные влияния. Сформулируй ключевые выводы и уникальную силу текста.`;

    case "producer_review": {
      const prodTags = body.globalTags ? body.globalTags.join(", ") : "";
      return `ТЕКСТ:\n${body.existingLyrics || body.lyrics || ""}\n\n${body.title ? `НАЗВАНИЕ: ${body.title}` : ""}${body.stylePrompt ? `\nSTYLE: ${body.stylePrompt}` : ""}${body.genre ? `\nЖАНР: ${body.genre}` : ""}${prodTags ? `\nТЕГИ: ${prodTags}` : ""}\n\nПроведи продюсерский разбор. Оцени коммерческий потенциал. Предложи хуки, вокальную карту, style prompt для Suno.`;
    }

    case "chat":
      return body.message || "Привет";

    case "style_convert":
      return `Перепиши текст в стиле "${body.targetStyle || "рэп"}":

ИСХОДНЫЙ ТЕКСТ:
${lyrics || existingLyrics}

ЦЕЛЕВОЙ СТИЛЬ: ${body.targetStyle || "рэп"}

ТРЕБОВАНИЯ:
1. Сохрани основную тему и эмоции
2. Адаптируй под характерные черты стиля
3. Измени ритм если нужно для нового стиля
4. Добавь соответствующие теги Suno
5. Сохрани длину примерно такой же

Верни JSON:
{
  "lyrics": "переписанный текст с тегами",
  "style": "style prompt для Suno",
  "changes": ["что изменилось 1", "что изменилось 2"],
  "originalStyle": "определённый стиль оригинала"
}`;

    case "paraphrase":
      return `Перефразируй текст с тоном "${body.targetTone || "более поэтично"}":

ТЕКСТ:
${lyrics || existingLyrics}

ЦЕЛЕВОЙ ТОН: ${body.targetTone || "более поэтично"}
КОЛИЧЕСТВО ВАРИАНТОВ: ${body.variantsCount || 3}

ВАРИАНТЫ ТОНА:
- "поэтичнее" = больше метафор, образности
- "проще" = разговорный язык, прямота
- "агрессивнее" = резче, энергичнее
- "нежнее" = мягче, интимнее
- "драматичнее" = больше контрастов, эмоций

Верни JSON:
{
  "variants": [
    {"text": "вариант 1", "tone": "описание тона", "highlight": "что изменилось"},
    {"text": "вариант 2", "tone": "описание тона", "highlight": "что изменилось"},
    ...
  ],
  "original": "исходный текст"
}`;

    case "hook_generator":
      return `Проанализируй и улучши хуки в тексте:

ТЕКСТ:
${lyrics || existingLyrics}

ЖАНР: ${genre || "поп"}
НАСТРОЕНИЕ: ${mood || "энергичное"}
ТЕМА: ${theme || "любовь"}

ЗАДАЧИ:
1. Найди существующие хуки (если есть)
2. Оцени их силу (1-10)
3. Предложи 5 новых вариантов хуков
4. Укажи где их лучше разместить

Верни JSON:
{
  "currentHooks": [
    {"text": "хук из текста", "location": "Chorus", "score": 7, "issue": "проблема или null"}
  ],
  "suggestedHooks": [
    {"text": "новый хук", "style": "melodic/rhythmic/call-response", "bestFor": "Chorus/Hook/Pre-Chorus"},
    ...
  ],
  "hookScore": 75,
  "recommendations": ["рекомендация 1", "рекомендация 2"]
}`;

    case "vocal_map":
      return `Создай вокальную карту для текста:

ТЕКСТ:
${lyrics || existingLyrics}

ЖАНР: ${genre || "поп"}
НАСТРОЕНИЕ: ${mood || "эмоциональное"}

Для каждой секции укажи:
1. Тип вокала (шёпот, мощный, фальцет и т.д.)
2. Эффекты обработки
3. Бэк-вокалы
4. Динамику (тихо→громко и т.д.)
5. Эмоциональные указания

Верни JSON:
{
  "sections": [
    {
      "name": "Verse 1",
      "vocalType": "intimate, breathy",
      "effects": ["[Soft]", "[Whisper]"],
      "backingVocals": "(ooh)",
      "dynamics": "quiet, building",
      "emotionalNote": "уязвимость, размышление",
      "sunoTags": "[Male Vocal] [Intimate] [Soft]"
    },
    ...
  ],
  "generalNotes": "общие указания по вокалу",
  "suggestedSingerType": "Female/Male, Alto/Tenor и т.д."
}`;

    case "translate_adapt": {
      const tgtLang = body.targetLanguage || "en";
      return `Переведи и адаптируй текст на ${tgtLang === "en" ? "английский" : "русский"}:

ТЕКСТ:
${lyrics || existingLyrics}

ЦЕЛЕВОЙ ЯЗЫК: ${tgtLang === "en" ? "Английский" : "Русский"}
СОХРАНЯТЬ СЛОГИ: ${body.preserveSyllables !== false ? "Да, строго" : "Приблизительно"}

ТРЕБОВАНИЯ:
1. Каждая строка должна иметь примерно такое же количество слогов
2. Сохрани рифменную схему
3. Адаптируй идиомы и метафоры для культуры целевого языка
4. Сохрани эмоциональный тон

Верни JSON:
{
  "translatedLyrics": "переведённый текст с тегами",
  "adaptationNotes": [
    {"original": "оригинал", "translated": "перевод", "syllables": "8→8", "note": "изменение смысла"}
  ],
  "preservedElements": ["рифмы", "ритм", "образы"],
  "changedElements": ["идиома X → Y"],
  "qualityScore": 85
}`;
    }

    case "drill_prompt_builder":
      return `Создай ПРОФЕССИОНАЛЬНЫЙ Drill/Trap промпт:

ТЕМА: ${theme || "уличная жизнь, ночной город, неоновые огни"}
ПОДСТИЛЬ: ${body.targetStyle || "UK Drill"}
НАСТРОЕНИЕ: ${mood || "агрессивное, уличное"}
ОСОБЕННОСТИ: ${body.sectionNotes || "добавить локальный колорит"}

ТРЕБОВАНИЯ:
1. Полная структура от Intro до End
2. Составные теги V5 для каждой секции
3. Минимум 3 разных типа ad-libs
4. Инструментальный брейк с дескрипторами
5. Трансформация темпа/динамики
6. КАПС для кульминаций
7. 6-10 слогов на строку

Верни JSON:
{
  "title": "Название 2-4 слова",
  "style": "UK Drill, aggressive, 808 bass, rapid hi-hats, dark synth, [другие теги], до 120 символов",
  "lyrics": "ПОЛНЫЙ текст с тегами V5, ad-libs, структурой",
  "tagsSummary": {
    "structural": ["Intro", "Verse 1", ...],
    "vocal": ["Male Grit Rap", ...],
    "instrumental": ["808 Bass", "Drill Glockenspiel", ...],
    "dynamics": ["Explosive Drop", "!crescendo", ...]
  }
}`;

    case "epic_prompt_builder":
      return `Создай ЭПИЧЕСКИЙ промпт:

ТЕМА: ${theme || "героическое противостояние, борьба"}
СТИЛЬ: ${body.targetStyle || "Cinematic Epic"}
НАСТРОЕНИЕ: ${mood || "триумфальное, героическое"}

Верни JSON:
{
  "title": "Эпическое название",
  "style": "cinematic epic, orchestral, choir, massive build...",
  "lyrics": "Полный текст с эпическими тегами"
}`;

    case "validate_suno_v5":
      return `Проведи ГЛУБОКУЮ валидацию V5:

ТЕКСТ:
${lyrics || existingLyrics}

Проверь ВСЁ. Верни JSON:
{
  "isValid": true/false,
  "score": 0-100,
  "errors": [
    {"line": 5, "issue": "Русский тег [Куплет]", "fix": "Заменить на [Verse]", "severity": "error"}
  ],
  "warnings": [
    {"line": 10, "issue": "15 слогов — длинновато", "fix": "Разбить на 2 строки", "severity": "warning"}
  ],
  "conflicts": [
    {"tags": ["Whisper", "Shout"], "reason": "Несовместимы"}
  ],
  "suggestions": [
    {"type": "enhancement", "text": "Добавить [!build_up] перед [Chorus]"}
  ],
  "syllableAnalysis": [
    {"line": "текст строки", "syllables": 8, "ok": true}
  ],
  "missingEnd": false,
  "russianTags": ["Куплет"],
  "compoundTagsUsed": ["Verse 1 | Male Vocal"],
  "summary": "Краткое резюме валидации"
}`;

    default:
      return "";
  }
}

function buildChatSystemPrompt(body: any, basePrompt: string): string {
  const chatContext = body.context || {};
  const projectInfo = chatContext.projectContext;
  const trackInfo = chatContext.trackContext;
  const conversationHistory = chatContext.conversationHistory || [];
  const userTheme = chatContext.theme;
  const userGenre = chatContext.genre;
  const userMood = chatContext.mood;
  const language = body.language || "ru";

  return `Ты опытный автор песен и музыкальный продюсер, работающий как ассистент в чате.
Твоя задача - помочь создать текст песни, который ИДЕАЛЬНО вписывается в контекст проекта.

═══════════════════════════════════════════════════════
КОНТЕКСТ ПРОЕКТА (учитывай для связности альбома):
═══════════════════════════════════════════════════════
${
  projectInfo
    ? `
📀 Проект: "${projectInfo.title}"
🎵 Тип: ${projectInfo.projectType || "альбом"}
🎸 Жанр: ${projectInfo.genre || "не указан"}
💫 Настроение: ${projectInfo.mood || "не указано"}
📖 Концепция: ${projectInfo.concept || "не указана"}
👥 Целевая аудитория: ${projectInfo.targetAudience || "не указана"}
🎼 Треков в проекте: ${projectInfo.existingTracks?.length || 0}

ДРУГИЕ ТРЕКИ ПРОЕКТА (для связности):
${
  projectInfo.existingTracks
    ?.map(
      (t: any, i: number) =>
        `${i + 1}. "${t.title}" - ${t.generatedLyrics ? "готов" : t.draftLyrics ? "черновик" : "нет текста"}${t.stylePrompt ? ` [${t.stylePrompt.slice(0, 50)}...]` : ""}`,
    )
    .join("\n") || "Пусто"
}
`
    : "Контекст проекта не задан - работаем как отдельный трек"
}

${
  trackInfo
    ? `
═══════════════════════════════════════════════════════
ТЕКУЩИЙ ТРЕК (над которым работаем):
═══════════════════════════════════════════════════════
🎵 Название: "${trackInfo.title}"
📍 Позиция: ${trackInfo.position}${projectInfo?.existingTracks?.length ? ` из ${projectInfo.existingTracks.length}` : ""}
🎨 Стиль: ${trackInfo.stylePrompt || "не указан"}
🏷️ Рекомендуемые теги: ${trackInfo.recommendedTags?.join(", ") || "не заданы"}
📝 Рекомендуемая структура: ${trackInfo.recommendedStructure || "стандартная"}

💡 ЗАМЕТКИ ОТ AI-ПЛАНИРОВЩИКА (ВАЖНО - учитывай эти подсказки!):
${trackInfo.notes || "Нет заметок"}

📄 Статус лирики: ${trackInfo.lyricsStatus || "не начато"}
`
    : ""
}

ТЕКУЩИЙ ТЕКСТ ПЕСНИ:
${chatContext.currentLyrics || trackInfo?.lyrics || chatContext.existingLyrics || "Текст ещё не создан"}

${chatContext.stylePrompt ? `STYLE PROMPT: ${chatContext.stylePrompt}` : ""}
${chatContext.allSectionNotes ? `ЗАМЕТКИ СЕКЦИЙ: ${JSON.stringify(chatContext.allSectionNotes)}` : ""}

${
  userTheme || userGenre || userMood
    ? `
═══════════════════════════════════════════════════════
ПОЛЬЗОВАТЕЛЬСКИЕ ПАРАМЕТРЫ (используй их ОБЯЗАТЕЛЬНО):
═══════════════════════════════════════════════════════
${userTheme ? `🎭 Тема: ${userTheme}` : ""}
${userGenre ? `🎸 Жанр: ${userGenre}` : ""}
${userMood ? `💫 Настроение: ${userMood}` : ""}
`
    : ""
}

ИСТОРИЯ ДИАЛОГА (последние 10 сообщений):
${
  conversationHistory
    .slice(-10)
    .map((m: any) => `${m.role === "user" ? "👤 Пользователь" : "🤖 Ассистент"}: ${m.content}`)
    .join("\n") || "Начало диалога"
}

═══════════════════════════════════════════════════════
ИНСТРУКЦИИ:
═══════════════════════════════════════════════════════
1. Если пользователь просит создать/написать текст - сразу генерируй с тегами Suno
2. Если просит улучшить/изменить - модифицируй существующий текст
3. Если задаёт вопрос - отвечай и предлагай конкретные действия

ФОРМАТ ОТВЕТА (JSON):
{
  "lyrics": "текст песни с тегами (если генерируешь)",
  "title": "название (если новый текст)",
  "style": "style prompt для Suno",
  "response": "текстовый ответ пользователю",
  "suggestions": [{"label": "🎵 Действие", "value": "команда", "action": "freeform"}],
  "quickActions": [{"label": "⚡ Быстрое действие", "action": "команда для AI"}]
}

Язык текста: ${language === "ru" ? "русский" : "английский"}`;
}
