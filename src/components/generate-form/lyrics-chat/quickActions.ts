/**
 * Quick action templates for lyrics assistant
 * Common requests that users can select with one click
 */

export interface LyricsQuickAction {
  id: string;
  label: string;
  emoji: string;
  description: string;
  prompt: string;
  category: 'generate' | 'improve' | 'structure' | 'tags';
}

export const LYRICS_QUICK_ACTIONS: LyricsQuickAction[] = [
  // Generate actions
  {
    id: 'love_song',
    label: 'Песня о любви',
    emoji: '❤️',
    description: 'Создать романтическую песню',
    prompt: 'Создай романтическую песню о любви с красивыми метафорами и запоминающимся припевом',
    category: 'generate',
  },
  {
    id: 'motivational',
    label: 'Мотивационный трек',
    emoji: '💪',
    description: 'Вдохновляющая песня о достижениях',
    prompt: 'Создай мотивационную песню о преодолении трудностей и достижении целей, с энергичным ритмом',
    category: 'generate',
  },
  {
    id: 'nostalgic',
    label: 'Ностальгическая',
    emoji: '🌅',
    description: 'Песня о воспоминаниях',
    prompt: 'Создай ностальгическую песню о воспоминаниях прошлого, с теплым и мягким звучанием',
    category: 'generate',
  },
  {
    id: 'party',
    label: 'Вечеринка',
    emoji: '🎉',
    description: 'Энергичный трек для танцев',
    prompt: 'Создай энергичную танцевальную песню для вечеринки с запоминающимся припевом',
    category: 'generate',
  },
  {
    id: 'sad_ballad',
    label: 'Грустная баллада',
    emoji: '😢',
    description: 'Медленная эмоциональная песня',
    prompt: 'Создай грустную балладу о расставании или потере, с глубокими эмоциями',
    category: 'generate',
  },
  {
    id: 'summer_vibes',
    label: 'Летний хит',
    emoji: '☀️',
    description: 'Легкая летняя песня',
    prompt: 'Создай легкую летнюю песню о море, солнце и отдыхе, с позитивным настроением',
    category: 'generate',
  },
  
  // Improve actions
  {
    id: 'add_emotion',
    label: 'Добавить эмоций',
    emoji: '💫',
    description: 'Усилить эмоциональность текста',
    prompt: 'Сделай текст более эмоциональным, добавь выразительные вокальные указания (softly), (with passion) и т.д.',
    category: 'improve',
  },
  {
    id: 'improve_rhymes',
    label: 'Улучшить рифмы',
    emoji: '🎭',
    description: 'Сделать рифмы более точными',
    prompt: 'Улучши рифмы, используй более точные и изысканные созвучия, сохраняя смысл',
    category: 'improve',
  },
  {
    id: 'make_catchier',
    label: 'Сделать запоминающимся',
    emoji: '🎵',
    description: 'Усилить припев',
    prompt: 'Сделай припев более запоминающимся и цепляющим, добавь повторы и яркие образы',
    category: 'improve',
  },
  {
    id: 'simplify',
    label: 'Упростить текст',
    emoji: '✨',
    description: 'Сделать проще для восприятия',
    prompt: 'Упрости текст, замени сложные слова на более простые и понятные, сохраняя смысл',
    category: 'improve',
  },
  
  // Structure actions
  {
    id: 'add_bridge',
    label: 'Добавить бридж',
    emoji: '🌉',
    description: 'Контрастная секция в песне',
    prompt: 'Добавь секцию [Bridge] с контрастным настроением и новой мелодической линией',
    category: 'structure',
  },
  {
    id: 'add_prechorus',
    label: 'Добавить пред-припев',
    emoji: '📈',
    description: 'Нарастание перед припевом',
    prompt: 'Добавь секцию [Pre-Chorus] с нарастанием [Build] перед каждым припевом',
    category: 'structure',
  },
  {
    id: 'add_intro_outro',
    label: 'Intro/Outro',
    emoji: '🎬',
    description: 'Вступление и завершение',
    prompt: 'Добавь инструментальное вступление [Intro] и плавное завершение [Outro] с [Fade Out]',
    category: 'structure',
  },
  
  // Tags actions
  {
    id: 'add_all_tags',
    label: 'Полный набор тегов',
    emoji: '🏷️',
    description: 'Все теги Suno V5',
    prompt: 'Добавь полный профессиональный набор тегов Suno V5: структурные, вокальные, динамические и инструментальные',
    category: 'tags',
  },
  {
    id: 'add_vocal_tags',
    label: 'Вокальные теги',
    emoji: '🎤',
    description: 'Указания для исполнения',
    prompt: 'Добавь вокальные теги и эмоциональные указания (softly), (powerful), (whisper), (belt) к каждой секции',
    category: 'tags',
  },
  {
    id: 'add_dynamics',
    label: 'Динамические теги',
    emoji: '🌊',
    description: 'Управление энергией',
    prompt: 'Добавь динамические теги [Build], [Drop], [Breakdown], [Climax] для управления энергией песни',
    category: 'tags',
  },
  {
    id: 'add_instruments',
    label: 'Инструменты',
    emoji: '🎸',
    description: 'Указать инструменты',
    prompt: 'Добавь инструментальные теги [Guitar Solo], [Piano], [Drums], [Synth] для ключевых моментов',
    category: 'tags',
  },
];

// Group actions by category
export const QUICK_ACTIONS_BY_CATEGORY = {
  generate: LYRICS_QUICK_ACTIONS.filter(a => a.category === 'generate'),
  improve: LYRICS_QUICK_ACTIONS.filter(a => a.category === 'improve'),
  structure: LYRICS_QUICK_ACTIONS.filter(a => a.category === 'structure'),
  tags: LYRICS_QUICK_ACTIONS.filter(a => a.category === 'tags'),
};

// Get actions for specific context
export function getContextualQuickActions(hasLyrics: boolean): LyricsQuickAction[] {
  if (hasLyrics) {
    // User already has lyrics, show improvement and tagging actions
    return [
      ...QUICK_ACTIONS_BY_CATEGORY.improve.slice(0, 3),
      ...QUICK_ACTIONS_BY_CATEGORY.structure.slice(0, 2),
      ...QUICK_ACTIONS_BY_CATEGORY.tags.slice(0, 2),
    ];
  } else {
    // User has no lyrics, show generation actions
    return QUICK_ACTIONS_BY_CATEGORY.generate;
  }
}

// Category metadata
export const CATEGORY_INFO = {
  generate: {
    label: 'Создать',
    emoji: '✨',
    description: 'Создание нового текста песни',
  },
  improve: {
    label: 'Улучшить',
    emoji: '💫',
    description: 'Улучшение существующего текста',
  },
  structure: {
    label: 'Структура',
    emoji: '📐',
    description: 'Изменение структуры песни',
  },
  tags: {
    label: 'Теги',
    emoji: '🏷️',
    description: 'Добавление тегов Suno V5',
  },
};
