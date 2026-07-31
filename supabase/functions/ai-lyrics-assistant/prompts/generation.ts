import type { LyricsAction } from "../types.ts";

type SystemFn = (basePrompt: string, body: any) => string;
type UserFn = (body: any) => string;

export const systemPrompts: Partial<Record<LyricsAction, SystemFn>> = {
  generate_section: (basePrompt) =>
    basePrompt + `\n\nТы пишешь одну конкретную секцию песни с профессиональными тегами.`,

  continue_line: (basePrompt) => basePrompt + `\n\nТы помогаешь в режиме коллаборации.`,

  suggest_rhymes: (_basePrompt, body) =>
    `Ты эксперт по рифмам на ${body.language === "ru" ? "русском" : "английском"} языке.`,

  optimize_for_suno: (basePrompt) =>
    basePrompt + `\n\nТы оптимизируешь текст для максимального качества генерации в Suno AI.`,
};

export const userPrompts: Partial<Record<LyricsAction, UserFn>> = {
  generate: (body) => buildGenerateUserPrompt(body),

  smart_generate: (body) => buildGenerateUserPrompt(body),

  improve: (body) =>
    `Улучши текст песни, добавив профессиональные теги:

ИСХОДНЫЙ ТЕКСТ:
${body.existingLyrics || body.lyrics}

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

ВАЖНО: Верни ТОЛЬКО валидный JSON.`,

  add_tags: (body) =>
    `Добавь профессиональные теги Suno к тексту:

ТЕКСТ:
${body.existingLyrics || body.lyrics}

ЖАНР: ${body.genre || "поп"}
НАСТРОЕНИЕ: ${body.mood || "романтичное"}

ЗАДАЧИ:
1. Определи секции и добавь структурные теги [Verse], [Chorus], [Bridge], etc.
2. Добавь вокальные указания: (softly), (powerfully), (with emotion), etc.
3. Вставь динамические теги [Build], [Drop], [Breakdown] перед ключевыми моментами
4. Добавь инструментальные указания [Guitar Solo], [Piano Break] если уместно
5. Используй рекомендованные теги для жанра ${body.genre}

ФОРМАТ ОТВЕТА (строго JSON):
{
  "title": "Название песни (определи из текста или создай)",
  "style": "Стиль для Suno: ${body.genre || "поп"}, ${body.mood || "романтичное"}, характерные инструменты",
  "lyrics": "Текст с ПОЛНЫМ набором профессиональных тегов Suno V5",
  "tagsSummary": {
    "structural": ["список использованных структурных тегов"],
    "vocal": ["список вокальных указаний"],
    "dynamic": ["список динамических тегов"],
    "instrumental": ["список инструментальных тегов"]
  }
}

ВАЖНО: Верни ТОЛЬКО валидный JSON.`,

  generate_section: (body) => {
    const sectionType = body.sectionType || "verse";
    const linesCount = body.linesCount || 4;
    return `Напиши секцию "${body.sectionName}" (тип: ${sectionType}) для песни.

КОНТЕКСТ:
- Тема: "${body.theme || "любовь"}"
- Жанр: ${body.genre || "поп"}
- Настроение: ${body.mood || "романтичное"}
- Количество строк: ${linesCount}

${body.previousLyrics ? `ПРЕДЫДУЩИЕ СЕКЦИИ:\n${body.previousLyrics}\n` : ""}

ТРЕБОВАНИЯ:
1. НЕ добавляй тег секции (только контент)
2. Добавь вокальные указания (...) где уместно
3. Используй рифмы
4. Продолжай историю логически
5. Если это Pre-Chorus - добавь ощущение нарастания
6. Если это Chorus - сделай запоминающимся

Верни ТОЛЬКО текст секции (${linesCount} строк).`;
  },

  continue_line: (body) =>
    `Предложи следующую строку для секции ${body.sectionType || "verse"}.

ТЕКУЩИЙ ТЕКСТ:
${body.currentLyrics}

ТЕМА: ${body.theme || "любовь"}
ЖАНР: ${body.genre || "поп"}
НАСТРОЕНИЕ: ${body.mood || "романтичное"}

ТРЕБОВАНИЯ:
- Одна строка, продолжающая текст
- Рифма с предыдущей строкой
- Сохраняй ритм
- Можно добавить (указание) если усилит эмоцию

Верни ТОЛЬКО одну строку.`,

  suggest_rhymes: (body) =>
    `Предложи рифмы к слову "${body.word}".

${body.context ? `КОНТЕКСТ:\n${body.context}\n` : ""}

Требования:
- 8-12 разнообразных рифм
- Точные рифмы (совпадение окончаний)
- Ассонансные рифмы (совпадение гласных)
- Рифмы подходящие для песенного текста

Формат ответа:
ТОЧНЫЕ: рифма1, рифма2, рифма3
АССОНАНСНЫЕ: рифма1, рифма2, рифма3
СОСТАВНЫЕ: фраза1, фраза2`,

  optimize_for_suno: (body) =>
    `Оптимизируй текст для Suno AI:

ТЕКСТ:
${body.lyrics || body.existingLyrics}

ЖАНР: ${body.genre || "поп"}

ЗАДАЧИ ОПТИМИЗАЦИИ:
1. ✅ Убедись что текст < 3000 символов (обрежь если нужно)
2. ✅ Проверь все структурные теги (каждая секция должна иметь [...])
3. ✅ Добавь/улучши вокальные указания для ключевых моментов
4. ✅ Удали лишние символы и эмодзи
5. ✅ Убедись что [Build] стоит перед припевами
6. ✅ Добавь [Outro] в конце если нет
7. ✅ Замени сложные слова на более музыкальные
8. ✅ Проверь рифмы на благозвучность

Верни оптимизированный текст готовый для генерации.`,
};

function buildGenerateUserPrompt(body: any): string {
  const { theme, mood, genre, structure, vocalTags, instrumentTags, dynamicTags, emotionalCues, useAdvancedTags } =
    body;

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
  "style": "Стиль-промпт для Suno (${genre || "поп"}, ${mood || "вдохновляющее"}, инструменты, до 120 символов)",
  "lyrics": "ПОЛНЫЙ текст песни с правильными тегами Suno V5"
}

ВАЖНО: Верни ТОЛЬКО валидный JSON, без дополнительного текста до или после.`;
}
