import type { LyricsAction } from "../types.ts";

type SystemFn = (basePrompt: string, body: any) => string;
type UserFn = (body: any) => string;

export const systemPrompts: Partial<Record<LyricsAction, SystemFn>> = {
  drill_prompt_builder: (_basePrompt, body) =>
    `Ты эксперт по UK Drill, US Drill, Trap и aggressive Hip-Hop. Создаёшь профессиональные промпты уровня коммерческих релизов.

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

Язык текста: ${body.language === "ru" ? "русский" : "английский"}`,

  epic_prompt_builder: (_basePrompt, body) =>
    `Ты эксперт по эпическому, киберпанк и cinematic саунду. Создаёшь промпты для масштабных треков.

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

Язык текста: ${body.language === "ru" ? "русский" : "английский"}`,

  validate_suno_v5: () =>
    `Ты валидатор синтаксиса Suno V5. Проверяешь тексты на соответствие всем правилам.

ПРОВЕРЯЕМЫЕ АСПЕКТЫ:
1. Все теги на английском (не русском!)
2. [End] присутствует
3. Нет конфликтующих тегов ([Whisper]+[Shout], [Acapella]+[Guitar Solo])
4. Не более 3 тегов на строку
5. Слоги: 6-12 оптимально, >16 проблема
6. Круглые скобки только для пения (ooh, aah)
7. Составные теги правильно отформатированы [A | B | C]
8. Инструментальные соло с дескрипторами`,
};

export const userPrompts: Partial<Record<LyricsAction, UserFn>> = {
  drill_prompt_builder: (body) =>
    `Создай ПРОФЕССИОНАЛЬНЫЙ Drill/Trap промпт:

ТЕМА: ${body.theme || "уличная жизнь, ночной город, неоновые огни"}
ПОДСТИЛЬ: ${body.targetStyle || "UK Drill"}
НАСТРОЕНИЕ: ${body.mood || "агрессивное, уличное"}
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
}`,

  epic_prompt_builder: (body) =>
    `Создай ЭПИЧЕСКИЙ промпт:

ТЕМА: ${body.theme || "героическое противостояние, борьба"}
СТИЛЬ: ${body.targetStyle || "Cinematic Epic"}
НАСТРОЕНИЕ: ${body.mood || "триумфальное, героическое"}

Верни JSON:
{
  "title": "Эпическое название",
  "style": "cinematic epic, orchestral, choir, massive build...",
  "lyrics": "Полный текст с эпическими тегами"
}`,

  validate_suno_v5: (body) =>
    `Проведи ГЛУБОКУЮ валидацию V5:

ТЕКСТ:
${body.lyrics || body.existingLyrics}

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
}`,
};
