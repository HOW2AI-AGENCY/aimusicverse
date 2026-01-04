/**
 * Comprehensive Suno AI Meta-Tags Reference
 * Based on official Suno AI V5 documentation and best practices
 * 
 * Syntax Rules:
 * - Square brackets [...] = meta-tags (structure, roles, instructions)
 * - Parentheses (...) = ad-libs, backing vocals, vocal remarks
 * - Exclamation mark ! = technical/dynamic effects [!reverb]
 * - Keep tags short: 1-3 words work best
 * - Place tags on separate line before text block
 */

export interface SunoMetaTag {
  /** English value for insertion (without brackets) */
  value: string;
  /** Russian display name */
  label: string;
  /** Description/hint */
  hint: string;
  /** Example usage */
  example?: string;
  /** Is critical for proper generation */
  critical?: boolean;
}

export interface SunoTagCategory {
  id: string;
  label: string;
  labelEn: string;
  icon: string;
  description: string;
  tags: SunoMetaTag[];
}

// ═══════════════════════════════════════════════════════
// I. STRUCTURE TAGS (Arrangement)
// ═══════════════════════════════════════════════════════
export const STRUCTURE_TAGS: SunoMetaTag[] = [
  { value: 'Intro', label: 'Интро', hint: 'Вступление песни', example: '[Intro]' },
  { value: 'Instrumental Intro', label: 'Инстр. интро', hint: 'Инструментальное вступление', example: '[Instrumental Intro]' },
  { value: 'Verse', label: 'Куплет', hint: 'Основная часть с текстом', example: '[Verse 1]' },
  { value: 'Verse 1', label: 'Куплет 1', hint: 'Первый куплет', example: '[Verse 1]' },
  { value: 'Verse 2', label: 'Куплет 2', hint: 'Второй куплет', example: '[Verse 2]' },
  { value: 'Verse 3', label: 'Куплет 3', hint: 'Третий куплет', example: '[Verse 3]' },
  { value: 'Pre-Chorus', label: 'Пре-припев', hint: 'Подводка к припеву, рост напряжения', example: '[Pre-Chorus]' },
  { value: 'Chorus', label: 'Припев', hint: 'Главная часть, хук', example: '[Chorus]' },
  { value: 'Post-Chorus', label: 'Пост-припев', hint: 'Переход после припева', example: '[Post-Chorus]' },
  { value: 'Hook', label: 'Хук', hint: 'Запоминающийся момент', example: '[Hook]' },
  { value: 'Bridge', label: 'Бридж', hint: 'Контрастная часть, смена гармонии', example: '[Bridge]' },
  { value: 'Interlude', label: 'Интерлюдия', hint: 'Короткая инструментальная вставка', example: '[Interlude]' },
  { value: 'Break', label: 'Брейк', hint: 'Резкая пауза или смена динамики', example: '[Break]' },
  { value: 'Drop', label: 'Дроп', hint: 'Кульминация в EDM, мощный момент', example: '[Drop]' },
  { value: 'Breakdown', label: 'Брейкдаун', hint: 'Замедление, минимальное звучание', example: '[Breakdown]' },
  { value: 'Build', label: 'Билд-ап', hint: 'Нарастание к дропу/кульминации', example: '[Build]' },
  { value: 'Instrumental', label: 'Инструментал', hint: 'Секция без вокала', example: '[Instrumental]' },
  { value: 'Solo', label: 'Соло', hint: 'Сольная партия инструмента', example: '[Solo]' },
  { value: 'Outro', label: 'Аутро', hint: 'Финальная секция', example: '[Outro]' },
  { value: 'End', label: 'Конец', hint: 'Критически важный тег — полное завершение', example: '[End]', critical: true },
];

// ═══════════════════════════════════════════════════════
// II. VOCAL TAGS
// ═══════════════════════════════════════════════════════
export const VOCAL_TYPE_TAGS: SunoMetaTag[] = [
  { value: 'Male Singer', label: 'Мужской вокал', hint: 'Мужской голос', example: '[Male Singer]' },
  { value: 'Female Singer', label: 'Женский вокал', hint: 'Женский голос', example: '[Female Singer]' },
  { value: 'Male Vocal', label: 'Муж. вокал', hint: 'Мужской голос (альт.)', example: '[Male Vocal]' },
  { value: 'Female Vocal', label: 'Жен. вокал', hint: 'Женский голос (альт.)', example: '[Female Vocal]' },
  { value: 'Duet', label: 'Дуэт', hint: 'Два голоса вместе', example: '[Duet]' },
  { value: 'Vocalist: Alto', label: 'Альт', hint: 'Низкий женский голос', example: '[Vocalist: Alto]' },
  { value: 'Vocalist: Soprano', label: 'Сопрано', hint: 'Высокий женский голос', example: '[Vocalist: Soprano]' },
  { value: 'Vocalist: Tenor', label: 'Тенор', hint: 'Высокий мужской голос', example: '[Vocalist: Tenor]' },
  { value: 'Vocalist: Bass', label: 'Бас', hint: 'Низкий мужской голос', example: '[Vocalist: Bass]' },
  { value: 'Child voice', label: 'Детский голос', hint: 'Голос ребёнка', example: '[Child voice]' },
  { value: 'Diva solo', label: 'Дива соло', hint: 'Сольный вокал звезды', example: '[Diva solo]' },
  { value: 'Choir', label: 'Хор', hint: 'Многоголосие', example: '[Choir]' },
  { value: 'Gospel Choir', label: 'Госпел хор', hint: 'Госпел-хор', example: '[Gospel Choir]' },
  { value: 'Harmonized Chorus', label: 'Гармонии', hint: 'Хор с гармониями', example: '[Harmonized Chorus]' },
];

export const VOCAL_STYLE_TAGS: SunoMetaTag[] = [
  { value: 'Spoken word', label: 'Речитатив', hint: 'Разговорный стиль', example: '[Spoken word]' },
  { value: 'Whisper', label: 'Шёпот', hint: 'Тихий, шёпотный вокал', example: '[Whisper]' },
  { value: 'Shout', label: 'Крик', hint: 'Громкий, экспрессивный', example: '[Shout]' },
  { value: 'Acapella', label: 'Акапелла', hint: 'Вокал без инструментов', example: '[Acapella]' },
  { value: 'Falsetto', label: 'Фальцет', hint: 'Высокий головной регистр', example: '[Falsetto]' },
  { value: 'Belting', label: 'Белтинг', hint: 'Мощный грудной вокал', example: '[Belting]' },
  { value: 'Raspy', label: 'Хриплый', hint: 'Сиплый тембр', example: '[Raspy]' },
  { value: 'Smooth', label: 'Гладкий', hint: 'Мягкий, плавный вокал', example: '[Smooth]' },
  { value: 'Breathy', label: 'Придыхательный', hint: 'С дыханием, интимный', example: '[Breathy]' },
  { value: 'Powerful', label: 'Мощный', hint: 'Сильный голос', example: '[Powerful]' },
  { value: 'Gentle', label: 'Нежный', hint: 'Мягкий, аккуратный', example: '[Gentle]' },
  { value: 'Emotional', label: 'Эмоциональный', hint: 'Глубокие чувства', example: '[Emotional]' },
  { value: 'Rap', label: 'Рэп', hint: 'Речитатив, читка', example: '[Rap]' },
  { value: 'Autotune', label: 'Автотюн', hint: 'Обработанный вокал', example: '[Autotune]' },
  { value: 'Vocoder', label: 'Вокодер', hint: 'Роботизированный голос', example: '[Vocoder]' },
];

// ═══════════════════════════════════════════════════════
// III. INSTRUMENTAL TAGS
// ═══════════════════════════════════════════════════════
export const SOLO_TAGS: SunoMetaTag[] = [
  { value: 'Guitar Solo', label: 'Гитарное соло', hint: 'Соло на гитаре', example: '[Guitar Solo]' },
  { value: 'Piano Solo', label: 'Пианино соло', hint: 'Соло на фортепиано', example: '[Piano Solo]' },
  { value: 'Sax Solo', label: 'Сакс соло', hint: 'Соло на саксофоне', example: '[Sax Solo]' },
  { value: 'Synth Solo', label: 'Синт соло', hint: 'Соло на синтезаторе', example: '[Synth Solo]' },
  { value: 'Violin Solo', label: 'Скрипка соло', hint: 'Соло на скрипке', example: '[Violin Solo]' },
  { value: 'Drum Solo', label: 'Барабанное соло', hint: 'Соло на ударных', example: '[Drum Solo]' },
];

export const TECHNIQUE_TAGS: SunoMetaTag[] = [
  { value: 'fingerpicked guitar', label: 'Пальцевая гитара', hint: 'Перебор пальцами', example: '[fingerpicked guitar]' },
  { value: 'slapped bass', label: 'Слэп бас', hint: 'Техника слэпа', example: '[slapped bass]' },
  { value: 'brushes drums', label: 'Щётки', hint: 'Игра щётками', example: '[brushes drums]' },
  { value: 'pizzicato strings', label: 'Пиццикато', hint: 'Щипковые струнные', example: '[pizzicato strings]' },
  { value: 'guitar riff', label: 'Гитарный рифф', hint: 'Повторяющаяся фраза', example: '[guitar riff]' },
  { value: 'arpeggiated', label: 'Арпеджио', hint: 'Перебор аккорда', example: '[arpeggiated]' },
  { value: 'strummed', label: 'Бой', hint: 'Гитарный бой', example: '[strummed]' },
  { value: 'muted', label: 'Мьют', hint: 'Приглушённые ноты', example: '[muted]' },
];

// ═══════════════════════════════════════════════════════
// IV. DYNAMICS & SFX
// ═══════════════════════════════════════════════════════
export const DYNAMICS_TAGS: SunoMetaTag[] = [
  { value: '!crescendo', label: 'Крещендо', hint: 'Нарастание громкости', example: '[!crescendo]' },
  { value: '!diminuendo', label: 'Диминуэндо', hint: 'Ослабление громкости', example: '[!diminuendo]' },
  { value: '!build_up', label: 'Нарастание', hint: 'Подготовка к кульминации', example: '[!build_up]' },
  { value: 'Fade Out', label: 'Затухание', hint: 'Плавное затухание', example: '[Fade Out]' },
  { value: 'Fade In', label: 'Нарастание', hint: 'Плавное появление', example: '[Fade In]' },
  { value: 'Soft', label: 'Тихо', hint: 'Тихий момент', example: '[Soft]' },
  { value: 'Loud', label: 'Громко', hint: 'Громкий момент', example: '[Loud]' },
  { value: 'Intense', label: 'Интенсивно', hint: 'Напряжённо', example: '[Intense]' },
  { value: 'Calm', label: 'Спокойно', hint: 'Расслабленно', example: '[Calm]' },
  { value: 'Climax', label: 'Кульминация', hint: 'Пиковый момент', example: '[Climax]' },
  { value: 'Explosive', label: 'Взрывной', hint: 'Резкий мощный момент', example: '[Explosive]' },
];

export const SFX_TAGS: SunoMetaTag[] = [
  { value: 'Applause', label: 'Аплодисменты', hint: 'Звук аплодисментов', example: '[Applause]' },
  { value: 'Birds chirping', label: 'Пение птиц', hint: 'Звуки птиц', example: '[Birds chirping]' },
  { value: 'Phone ringing', label: 'Телефон', hint: 'Звонок телефона', example: '[Phone ringing]' },
  { value: 'Bleep', label: 'Бип', hint: 'Звук сигнала', example: '[Bleep]' },
  { value: 'Silence', label: 'Тишина', hint: 'Момент тишины', example: '[Silence]' },
  { value: 'Thunder', label: 'Гром', hint: 'Звук грома', example: '[Thunder]' },
  { value: 'Rain', label: 'Дождь', hint: 'Звуки дождя', example: '[Rain]' },
  { value: 'Wind', label: 'Ветер', hint: 'Звуки ветра', example: '[Wind]' },
  { value: 'Crowd', label: 'Толпа', hint: 'Шум толпы', example: '[Crowd]' },
  { value: 'Heartbeat', label: 'Сердцебиение', hint: 'Звук сердца', example: '[Heartbeat]' },
];

// ═══════════════════════════════════════════════════════
// V. PRODUCTION TAGS
// ═══════════════════════════════════════════════════════
export const PRODUCTION_TAGS: SunoMetaTag[] = [
  { value: '!reverb', label: 'Реверберация', hint: 'Эхо, пространство', example: '[!reverb]' },
  { value: '!delay', label: 'Дилей', hint: 'Задержка звука', example: '[!delay]' },
  { value: '!distortion', label: 'Дисторшн', hint: 'Перегруз, грязь', example: '[!distortion]' },
  { value: '!filter', label: 'Фильтр', hint: 'Обрезка частот', example: '[!filter]' },
  { value: '!chorus', label: 'Хорус', hint: 'Расширение звука', example: '[!chorus]' },
  { value: '!phaser', label: 'Фейзер', hint: 'Космический эффект', example: '[!phaser]' },
  { value: 'Mono Vocal Pull', label: 'Моно вокал', hint: 'Вокал в моно', example: '[Mono Vocal Pull]' },
  { value: 'Texture: Gritty', label: 'Грязная текстура', hint: 'Грязный, сырой звук', example: '[Texture: Gritty]' },
  { value: 'Texture: Clean', label: 'Чистая текстура', hint: 'Чистый звук', example: '[Texture: Clean]' },
  { value: 'Lo-fi', label: 'Лоу-фай', hint: 'Тёплый ретро-звук', example: '[Lo-fi]' },
  { value: 'Hi-fi', label: 'Хай-фай', hint: 'Кристально чистый', example: '[Hi-fi]' },
  { value: 'Vintage', label: 'Винтаж', hint: 'Старинное звучание', example: '[Vintage]' },
  { value: 'Atmospheric', label: 'Атмосферный', hint: 'Объёмный, глубокий', example: '[Atmospheric]' },
];

// ═══════════════════════════════════════════════════════
// TEXT FORMATTING TIPS
// ═══════════════════════════════════════════════════════
export const TEXT_FORMATTING_TIPS = {
  hyphen: {
    name: 'Дефис для распева',
    description: 'Используйте дефис для легато/распева слога',
    example: 'so-o-o much, ni-i-ight',
  },
  caps: {
    name: 'КАПС для акцента',
    description: 'ЗАГЛАВНЫЕ буквы = акцент, усиление, агрессия',
    example: 'I LOVE you, NEVER give up',
  },
  parentheses: {
    name: 'Круглые скобки для бэк-вокала',
    description: 'Ад-либы, подпевки, хоры',
    examples: ['(ooh, aah)', '(la-la-la)', '(yeah, yeah)', '(harmony)', '(echo: love)'],
  },
};

// ═══════════════════════════════════════════════════════
// BEST PRACTICES & ANTI-PATTERNS
// ═══════════════════════════════════════════════════════
export const BEST_PRACTICES = [
  { rule: '1-2 тега на секцию', description: 'Не перегружайте секцию тегами, 1-2 достаточно' },
  { rule: 'Порядок: структура → вокал → эффекты', description: '[Chorus] [Female Vocal] [!reverb]' },
  { rule: 'Всегда используйте [End]', description: 'Критически важно для завершения трека' },
  { rule: 'Теги на отдельной строке', description: 'Размещайте теги перед блоком текста' },
  { rule: 'Краткость: 1-3 слова', description: 'Короткие теги работают стабильнее' },
];

export const ANTI_PATTERNS = [
  { issue: 'Конфликтующие теги', example: '[Acapella] + [Full band]', fix: 'Выберите один вариант' },
  { issue: 'Перегрузка тегами', example: '>3 тегов в строке', fix: 'Сократите до 1-2 тегов' },
  { issue: 'Русские теги', example: '[Куплет], [Припев]', fix: 'Только английские: [Verse], [Chorus]' },
  { issue: 'Отсутствие [End]', example: 'Песня без [End]', fix: 'Добавьте [End] в конце' },
  { issue: 'Теги в круглых скобках', example: '(Verse 1)', fix: 'Используйте [Verse 1]' },
];

// ═══════════════════════════════════════════════════════
// CONFLICTING TAG PAIRS
// ═══════════════════════════════════════════════════════
export const CONFLICTING_TAGS: Array<[string, string, string]> = [
  ['Acapella', 'Full band', 'Акапелла исключает инструменты'],
  ['Whisper', 'Shout', 'Шёпот и крик несовместимы'],
  ['Soft', 'Loud', 'Выберите одну громкость'],
  ['Soft', 'Explosive', 'Мягкое и взрывное несовместимы'],
  ['Calm', 'Intense', 'Спокойное и интенсивное несовместимы'],
  ['Fade Out', 'Fade In', 'Используйте один эффект'],
  ['Lo-fi', 'Hi-fi', 'Выберите один тип качества'],
  ['Clean', 'Distortion', 'Чистый и перегруженный звук'],
];

// ═══════════════════════════════════════════════════════
// ALL CATEGORIES COMBINED
// ═══════════════════════════════════════════════════════
export const SUNO_META_TAG_CATEGORIES: SunoTagCategory[] = [
  {
    id: 'structure',
    label: 'Структура',
    labelEn: 'Structure',
    icon: 'LayoutList',
    description: 'Теги для структуры песни',
    tags: STRUCTURE_TAGS,
  },
  {
    id: 'vocal_type',
    label: 'Тип вокала',
    labelEn: 'Vocal Type',
    icon: 'User',
    description: 'Тип и роль вокала',
    tags: VOCAL_TYPE_TAGS,
  },
  {
    id: 'vocal_style',
    label: 'Манера исполнения',
    labelEn: 'Vocal Style',
    icon: 'Mic',
    description: 'Стиль и манера вокала',
    tags: VOCAL_STYLE_TAGS,
  },
  {
    id: 'solo',
    label: 'Соло',
    labelEn: 'Solos',
    icon: 'Zap',
    description: 'Сольные партии',
    tags: SOLO_TAGS,
  },
  {
    id: 'techniques',
    label: 'Приёмы игры',
    labelEn: 'Techniques',
    icon: 'Settings2',
    description: 'Техники исполнения',
    tags: TECHNIQUE_TAGS,
  },
  {
    id: 'dynamics',
    label: 'Динамика',
    labelEn: 'Dynamics',
    icon: 'TrendingUp',
    description: 'Динамические изменения',
    tags: DYNAMICS_TAGS,
  },
  {
    id: 'sfx',
    label: 'Звуковые эффекты',
    labelEn: 'SFX',
    icon: 'Sparkles',
    description: 'Атмосферные звуки',
    tags: SFX_TAGS,
  },
  {
    id: 'production',
    label: 'Продакшн',
    labelEn: 'Production',
    icon: 'Sliders',
    description: 'Производственные эффекты',
    tags: PRODUCTION_TAGS,
  },
];

// ═══════════════════════════════════════════════════════
// VI. COMPOUND TAG TEMPLATES (V5)
// ═══════════════════════════════════════════════════════
export const COMPOUND_TAG_TEMPLATES: SunoMetaTag[] = [
  { value: 'Verse | Male Vocal | Intimate', label: 'Куплет интимный', hint: 'Мужской голос, интимно', example: '[Verse | Male Vocal | Intimate]' },
  { value: 'Verse | Female Vocal | Powerful', label: 'Куплет мощный', hint: 'Женский вокал, мощный', example: '[Verse | Female Vocal | Powerful]' },
  { value: 'Chorus | Full Band | Anthemic', label: 'Припев антемный', hint: 'Полный состав, гимновый', example: '[Chorus | Full Band | Anthemic]' },
  { value: 'Chorus | Stacked Harmonies | Explosive', label: 'Припев взрывной', hint: 'Многоголосие, взрыв', example: '[Chorus | Stacked Harmonies | Explosive]' },
  { value: 'Bridge | Whisper | Atmospheric | Piano Only', label: 'Бридж атмосферный', hint: 'Шёпот, атмосфера, пианино', example: '[Bridge | Whisper | Atmospheric | Piano Only]' },
  { value: 'Pre-Chorus | Building | Soft Drums', label: 'Пре-припев нарастающий', hint: 'Нарастание, мягкие ударные', example: '[Pre-Chorus | Building | Soft Drums]' },
  { value: 'Intro | Dark Synth | !fade_in', label: 'Интро тёмное', hint: 'Тёмный синт, плавное появление', example: '[Intro | Dark Synth | !fade_in]' },
  { value: 'Outro | Fade Out | Echo', label: 'Аутро с эхо', hint: 'Затухание с эхом', example: '[Outro | Fade Out | Echo]' },
];

// ═══════════════════════════════════════════════════════
// VII. SOLO DESCRIPTOR TEMPLATES (V5)
// ═══════════════════════════════════════════════════════
export const SOLO_DESCRIPTOR_TEMPLATES: SunoMetaTag[] = [
  { value: 'Instrumental Solo: Electric Guitar | Shredding | High Gain', label: 'Гитара шреддинг', hint: 'Скоростное соло на перегрузе', example: '[Instrumental Solo: Electric Guitar | Shredding | High Gain]' },
  { value: 'Instrumental Solo: Piano | Emotional | Rubato', label: 'Пианино эмоциональное', hint: 'Выразительное соло со свободным темпом', example: '[Instrumental Solo: Piano | Emotional | Rubato]' },
  { value: 'Instrumental Solo: Synth | Modulated | Spacey', label: 'Синт космический', hint: 'Модулированный космический звук', example: '[Instrumental Solo: Synth | Modulated | Spacey]' },
  { value: 'Instrumental Solo: Saxophone | Smooth | Jazz', label: 'Саксофон джазовый', hint: 'Гладкое джазовое соло', example: '[Instrumental Solo: Saxophone | Smooth | Jazz]' },
  { value: 'Instrumental Break: Dark Synth | 8 bars | No Vocals', label: 'Брейк 8 тактов', hint: 'Инструментальная вставка без вокала', example: '[Instrumental Break: Dark Synth | 8 bars | No Vocals]' },
];

// ═══════════════════════════════════════════════════════
// VIII. TRANSFORM TAGS (V5)
// ═══════════════════════════════════════════════════════
export const TRANSFORM_TAGS: SunoMetaTag[] = [
  { value: 'Slow -> Fast', label: 'Медленно → Быстро', hint: 'Ускорение темпа', example: '[Slow -> Fast]' },
  { value: 'Soft -> Explosive', label: 'Мягко → Взрыв', hint: 'Нарастание к кульминации', example: '[Soft -> Explosive]' },
  { value: 'Sad -> Hopeful', label: 'Грустно → Надежда', hint: 'Эмоциональный сдвиг', example: '[Sad -> Hopeful]' },
  { value: 'Calm -> Intense', label: 'Спокойно → Интенсивно', hint: 'Нарастание напряжения', example: '[Calm -> Intense]' },
  { value: 'Acoustic -> Electric', label: 'Акустика → Электро', hint: 'Смена звучания', example: '[Acoustic -> Electric]' },
  { value: 'Verse -> Breakdown', label: 'Куплет → Брейкдаун', hint: 'Переход в минимализм', example: '[Verse -> Breakdown]' },
];

// ═══════════════════════════════════════════════════════
// IX. SILENCE & CONTROL TAGS (V5)
// ═══════════════════════════════════════════════════════
export const SILENCE_CONTROL_TAGS: SunoMetaTag[] = [
  { value: 'Stop', label: 'Стоп', hint: 'Жёсткая остановка перед мощным моментом', example: '[Stop]', critical: true },
  { value: 'Silence', label: 'Тишина', hint: 'Мягкое "зависание", атмосферная пауза', example: '[Silence]' },
  { value: 'Pause', label: 'Пауза', hint: 'Короткая пауза для драматического эффекта', example: '[Pause]' },
  { value: 'Breath', label: 'Вдох', hint: 'Естественный вдох перед фразой', example: '[Breath]' },
];

// ═══════════════════════════════════════════════════════
// X. DRILL/TRAP SPECIFIC TAGS (V5)
// ═══════════════════════════════════════════════════════
export const DRILL_TRAP_TAGS: SunoMetaTag[] = [
  { value: '808 Bass', label: '808 бас', hint: 'Глубокий sub-bass', example: '[808 Bass]' },
  { value: '808 Slides', label: '808 слайды', hint: 'Глиссандо на 808', example: '[808 Slides]' },
  { value: 'Rapid Hi-Hats', label: 'Быстрые хэты', hint: 'Скоростные хай-хэты', example: '[Rapid Hi-Hats]' },
  { value: 'Drill Glockenspiel', label: 'UK Drill глокеншпиль', hint: 'Характерная мелодия UK Drill', example: '[Drill Glockenspiel]' },
  { value: 'Dark Piano', label: 'Тёмное пианино', hint: 'Мрачные клавишные для drill', example: '[Dark Piano]' },
  { value: 'Trap Snare', label: 'Трэп-снэйр', hint: 'Резкий snare с реверберацией', example: '[Trap Snare]' },
  { value: 'Male Grit Rap', label: 'Агрессивный рэп', hint: 'Мужской агрессивный флоу', example: '[Male Grit Rap]' },
  { value: 'Aggressive Delivery', label: 'Агрессивная подача', hint: 'Напористая манера исполнения', example: '[Aggressive Delivery]' },
  { value: 'Street Flow', label: 'Уличный флоу', hint: 'Уличная манера читки', example: '[Street Flow]' },
  { value: 'Gang Shouts', label: 'Выкрики банды', hint: 'Групповые выкрики', example: '(gang gang!)', critical: false },
];

// ═══════════════════════════════════════════════════════
// ADD NEW CATEGORIES TO MAIN EXPORT
// ═══════════════════════════════════════════════════════
export const SUNO_V5_TAG_CATEGORIES: SunoTagCategory[] = [
  {
    id: 'compound',
    label: 'Составные теги V5',
    labelEn: 'Compound Tags V5',
    icon: 'Layers',
    description: 'Комбинированные теги для сложных секций',
    tags: COMPOUND_TAG_TEMPLATES,
  },
  {
    id: 'solo_descriptors',
    label: 'Соло с дескрипторами',
    labelEn: 'Solo Descriptors',
    icon: 'Music',
    description: 'Инструментальные соло с техническими указаниями',
    tags: SOLO_DESCRIPTOR_TEMPLATES,
  },
  {
    id: 'transforms',
    label: 'Трансформации',
    labelEn: 'Transforms',
    icon: 'ArrowRightLeft',
    description: 'Смена жанра/темпа внутри трека',
    tags: TRANSFORM_TAGS,
  },
  {
    id: 'silence_control',
    label: 'Управление тишиной',
    labelEn: 'Silence Control',
    icon: 'VolumeX',
    description: 'Паузы и остановки для драматизма',
    tags: SILENCE_CONTROL_TAGS,
  },
  {
    id: 'drill_trap',
    label: 'Drill / Trap',
    labelEn: 'Drill / Trap',
    icon: 'Flame',
    description: 'Специфические теги для drill и trap',
    tags: DRILL_TRAP_TAGS,
  },
];

// Combine all categories
export const ALL_SUNO_TAG_CATEGORIES: SunoTagCategory[] = [
  ...SUNO_META_TAG_CATEGORIES,
  ...SUNO_V5_TAG_CATEGORIES,
];

/**
 * Get all meta tags as flat array
 */
export function getAllSunoMetaTags(): SunoMetaTag[] {
  return ALL_SUNO_TAG_CATEGORIES.flatMap(cat => cat.tags);
}

/**
 * Find meta tag by value
 */
export function findSunoMetaTag(value: string): SunoMetaTag | undefined {
  const lowerValue = value.toLowerCase();
  return getAllSunoMetaTags().find(t => t.value.toLowerCase() === lowerValue);
}

/**
 * Format tag for insertion with brackets
 */
export function formatMetaTagForInsertion(value: string): string {
  const clean = value.replace(/[\[\]]/g, '').trim();
  return `[${clean}]`;
}

/**
 * Extract tags from lyrics text
 */
export function extractTagsFromLyrics(text: string): string[] {
  const matches = text.match(/\[([^\]]+)\]/g) || [];
  return matches.map(m => m.slice(1, -1).trim()).filter(Boolean);
}

/**
 * Check if [End] tag is present
 */
export function hasEndTag(text: string): boolean {
  return /\[End\]/i.test(text);
}

/**
 * Get critical tags that are missing
 */
export function getMissingCriticalTags(text: string): string[] {
  const missing: string[] = [];
  if (!hasEndTag(text)) {
    missing.push('[End]');
  }
  return missing;
}

/**
 * Validate compound tag syntax
 */
export function isValidCompoundTag(tag: string): boolean {
  // [Part1 | Part2 | Part3]
  return /^\[[^\]]+\s*\|\s*[^\]]+\]$/.test(tag);
}

/**
 * Parse compound tag into parts
 */
export function parseCompoundTag(tag: string): string[] {
  const match = tag.match(/^\[([^\]]+)\]$/);
  if (!match) return [];
  return match[1].split('|').map(p => p.trim());
}

/**
 * Build compound tag from parts
 */
export function buildCompoundTag(parts: string[]): string {
  return `[${parts.join(' | ')}]`;
}

/**
 * Get tags by genre profile
 */
export function getTagsByGenre(genre: string): SunoMetaTag[] {
  const genreMap: Record<string, string[]> = {
    'drill': ['808 Bass', '808 Slides', 'Rapid Hi-Hats', 'Drill Glockenspiel', 'Male Grit Rap'],
    'uk-drill': ['808 Slides', 'Drill Glockenspiel', 'Dark Piano', 'Aggressive Delivery'],
    'trap': ['808 Bass', 'Trap Snare', 'Rapid Hi-Hats', 'Autotune'],
    'phonk': ['808 Bass', 'Cowbell', 'Deep Voice', 'Distortion'],
  };
  
  const tagNames = genreMap[genre.toLowerCase()] || [];
  return getAllSunoMetaTags().filter(t => tagNames.includes(t.value));
}
