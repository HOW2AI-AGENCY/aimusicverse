import type { LyricsAction } from "../types.ts";

type SystemFn = (basePrompt: string, body: any) => string;
type UserFn = (body: any) => string;

export const systemPrompts: Partial<Record<LyricsAction, SystemFn>> = {
  chat: (basePrompt, body) => buildChatSystemPrompt(body, basePrompt),

  context_recommendations: (_basePrompt, body) => {
    const recContext = body.context || {};
    const recProject = recContext.projectContext;
    return `Ты музыкальный продюсер и автор песен, дающий персонализированные рекомендации для создания текстов.

ВАЖНО: Учитывай позицию трека в альбоме и его роль в общей концепции проекта.`;
  },
};

export const userPrompts: Partial<Record<LyricsAction, UserFn>> = {
  chat: (body) => body.message || "Привет",

  context_recommendations: (body) => {
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
  },
};

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
