import type { LyricsAction } from "../types.ts";

type SystemFn = (basePrompt: string, body: any) => string;
type UserFn = (body: any) => string;

export const systemPrompts: Partial<Record<LyricsAction, SystemFn>> = {
  fit_structure: (basePrompt) => basePrompt + `\n\nТы адаптируешь текст под заданную структуру песни.`,

  generate_compound_tags: () => `Ты эксперт по тегам Suno AI V4.5+ и составным (compound) тегам.`,
};

export const userPrompts: Partial<Record<LyricsAction, UserFn>> = {
  suggest_structure: (body) =>
    `Предложи оптимальную структуру песни:

ЖАНР: ${body.genre || "поп"}
НАСТРОЕНИЕ: ${body.mood || "энергичное"}
${body.theme ? `ТЕМА: ${body.theme}` : ""}

Верни структуру с описанием каждой секции:

[Intro]
Описание: инструментальное вступление
Рекомендуемые теги: [Soft Piano], [Atmospheric]

[Verse 1]
Описание: введение в историю
Рекомендуемые теги: (intimate), (storytelling)

...и так далее`,

  generate_compound_tags: (body) =>
    `Сгенерируй оптимальные составные теги для секций песни.

ЖАНР: ${body.genre || "поп"}
НАСТРОЕНИЕ: ${body.mood || "романтичное"}
${body.theme ? `ТЕМА: ${body.theme}` : ""}

${body.lyrics ? `ТЕКСТ:\n${body.lyrics}\n` : ""}

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

Учитывай жанр ${body.genre || "поп"} и настроение ${body.mood || "романтичное"}.`,

  fit_structure: (body) =>
    `Подгони текст под структуру песни:

ИСХОДНЫЙ ТЕКСТ:
${body.lyrics || body.existingLyrics}

ЦЕЛЕВАЯ СТРУКТУРА: ${body.structure || "Intro, Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus, Chorus, Bridge, Final Chorus, Outro"}

ЖАНР: ${body.genre || "поп"}
НАСТРОЕНИЕ: ${body.mood || "романтичное"}

ЗАДАЧИ:
1. Распределить/переписать текст по заданным секциям
2. Добавить составные теги V4.5+ к каждой секции
3. Добавить вокальные направляющие
4. Добавить бэк-вокальные партии где уместно
5. Убедиться что припевы повторяются (можно с вариациями)
6. Добавить динамические переходы [Build], [Drop]

Верни полный отформатированный текст.`,
};
