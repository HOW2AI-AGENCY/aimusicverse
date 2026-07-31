import type { LyricsAction } from "../types.ts";

type SystemFn = (basePrompt: string, body: any) => string;
type UserFn = (body: any) => string;

export const systemPrompts: Partial<Record<LyricsAction, SystemFn>> = {
  style_convert: () =>
    `Ты эксперт по музыкальным стилям и мастер адаптации текстов под разные жанры и артистов.

ВАЖНО: Сохраняй основной смысл и эмоции текста, но адаптируй:
- Словарный запас и сленг
- Ритмические паттерны
- Структуру строф
- Характерные для стиля приёмы`,

  paraphrase: () => `Ты мастер русского/английского языка и поэт, создающий вариации текстов с разными оттенками.`,

  hook_generator: () =>
    `Ты хит-мейкер, специализирующийся на создании запоминающихся хуков и припевов.

ПРИНЦИПЫ ХУКА:
- Краткость (1-2 строки)
- Повторяемость
- Мелодичность
- Эмоциональный резонанс
- Универсальность (легко подпевать)`,

  vocal_map: () =>
    `Ты вокальный продюсер и аранжировщик с опытом работы в студии.

Создай детальную карту вокальной записи с указанием:
- Вокальных эффектов для каждой секции
- Бэк-вокалов и гармоний
- Динамических изменений
- Эмоциональных заметок для исполнителя`,

  translate_adapt: (_basePrompt, body) => {
    const targetLang = body.targetLanguage || "en";
    const preserveSyl = body.preserveSyllables !== false;
    return `Ты профессиональный переводчик песенных текстов, сохраняющий ритмику и смысл.

ВАЖНО: Это НЕ дословный перевод, а адаптация для пения:
- ${preserveSyl ? "СТРОГО сохраняй количество слогов" : "Допустимы небольшие отклонения по слогам"}
- Сохраняй рифмы
- Сохраняй эмоции и образы
- Текст должен быть естественным на целевом языке`;
  },
};

export const userPrompts: Partial<Record<LyricsAction, UserFn>> = {
  style_convert: (body) =>
    `Перепиши текст в стиле "${body.targetStyle || "рэп"}:

ИСХОДНЫЙ ТЕКСТ:
${body.lyrics || body.existingLyrics}

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
}`,

  paraphrase: (body) =>
    `Перефразируй текст с тоном "${body.targetTone || "более поэтично"}:

ТЕКСТ:
${body.lyrics || body.existingLyrics}

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
}`,

  hook_generator: (body) =>
    `Проанализируй и улучши хуки в тексте:

ТЕКСТ:
${body.lyrics || body.existingLyrics}

ЖАНР: ${body.genre || "поп"}
НАСТРОЕНИЕ: ${body.mood || "энергичное"}
ТЕМА: ${body.theme || "любовь"}

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
}`,

  vocal_map: (body) =>
    `Создай вокальную карту для текста:

ТЕКСТ:
${body.lyrics || body.existingLyrics}

ЖАНР: ${body.genre || "поп"}
НАСТРОЕНИЕ: ${body.mood || "эмоциональное"}

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
}`,

  translate_adapt: (body) => {
    const tgtLang = body.targetLanguage || "en";
    return `Переведи и адаптируй текст на ${tgtLang === "en" ? "английский" : "русский"}:

ТЕКСТ:
${body.lyrics || body.existingLyrics}

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
  },
};
