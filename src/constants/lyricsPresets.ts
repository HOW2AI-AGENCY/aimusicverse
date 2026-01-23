/**
 * Lyrics AI Presets - Pre-configured templates for AI lyrics generation
 * 
 * Templates for quick lyrics creation with predefined
 * structure, style, and thematic elements
 */

export interface LyricsPreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  genre: string;
  structure: string;
  structureDescription: string;
  features: string[];
  exampleLines?: string[];
  promptHint: string;
  hasVocals: boolean;
  colorClass: string;
  bgClass: string;
  // Workflow integration
  aiWorkflow?: string;
}

export const LYRICS_PRESETS: LyricsPreset[] = [
  {
    id: 'love-ballad',
    name: 'Любовная баллада',
    emoji: '💕',
    description: 'Романтическая песня о любви с глубокими метафорами',
    genre: 'Pop, R&B',
    structure: '[Verse] [Chorus] [Verse] [Chorus] [Bridge] [Chorus]',
    structureDescription: 'Verse-Chorus-Bridge',
    features: ['Романтика', 'Метафоры', 'Эмоции'],
    exampleLines: [
      'Ты как рассвет в моём окне...',
      'Сердце бьётся только для тебя...',
    ],
    promptHint: 'Напиши романтическую песню о любви',
    hasVocals: true,
    colorClass: 'text-pink-400',
    bgClass: 'bg-pink-500/10',
  },
  {
    id: 'drill-banger',
    name: 'Drill Бэнгер',
    emoji: '🔥',
    description: 'Агрессивный drill с мощным flow',
    genre: 'Drill, Trap',
    structure: '[Hook] [Verse] [Hook] [Verse] [Hook]',
    structureDescription: 'Hook-Verse-Hook',
    features: ['Агрессивный flow', 'Adlibs', 'Street'],
    exampleLines: [
      'На биту вхожу как босс...',
      'Gang-gang, не лезь...',
    ],
    promptHint: 'Напиши агрессивный drill трек',
    hasVocals: true,
    colorClass: 'text-red-400',
    bgClass: 'bg-red-500/10',
    aiWorkflow: 'drill_track',
  },
  {
    id: 'lofi-vibes',
    name: 'Lofi атмосфера',
    emoji: '🌙',
    description: 'Спокойный текст для lofi-музыки',
    genre: 'Lofi, Chill',
    structure: '[Intro] [Verse] [Verse] [Outro]',
    structureDescription: 'Intro-Verse-Outro',
    features: ['Короткие строки', 'Атмосфера', 'Меланхолия'],
    exampleLines: [
      'Дождь за окном...',
      'Кофе остыл, а мысли всё те же...',
    ],
    promptHint: 'Напиши атмосферный текст для lofi',
    hasVocals: true,
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10',
  },
  {
    id: 'party-anthem',
    name: 'Пати-гимн',
    emoji: '🎉',
    description: 'Энергичный клубный трек',
    genre: 'EDM, Pop',
    structure: '[Build] [Drop] [Verse] [Build] [Drop]',
    structureDescription: 'Build-Drop-Build',
    features: ['Энергия', 'Повторения', 'Кричалки'],
    exampleLines: [
      'Руки вверх! Это наша ночь!',
      'Let\'s go! До рассвета!',
    ],
    promptHint: 'Напиши клубный гимн для вечеринки',
    hasVocals: true,
    colorClass: 'text-yellow-400',
    bgClass: 'bg-yellow-500/10',
  },
  {
    id: 'storytelling',
    name: 'Storytelling',
    emoji: '📖',
    description: 'Нарративный хип-хоп с историей',
    genre: 'Hip-Hop',
    structure: '[Verse] [Verse] [Verse] [Outro]',
    structureDescription: 'Verse-Heavy',
    features: ['Нарратив', 'Детали', 'Развитие сюжета'],
    exampleLines: [
      'Это было в 95-м году, на окраине...',
      'Он не знал тогда, что жизнь изменится...',
    ],
    promptHint: 'Напиши историю в формате рэпа',
    hasVocals: true,
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
  },
  {
    id: 'emotional-pop',
    name: 'Эмоциональный поп',
    emoji: '💔',
    description: 'Искренняя песня о переживаниях',
    genre: 'Pop',
    structure: '[Verse] [Pre-Chorus] [Chorus] [Verse] [Pre-Chorus] [Chorus] [Bridge] [Chorus]',
    structureDescription: 'Standard Pop',
    features: ['Искренность', 'Уязвимость', 'Катарсис'],
    exampleLines: [
      'Я больше не боюсь признаться...',
      'Каждый шрам — это часть меня...',
    ],
    promptHint: 'Напиши эмоциональную поп-песню',
    hasVocals: true,
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10',
  },
  {
    id: 'motivational',
    name: 'Мотивация',
    emoji: '💪',
    description: 'Вдохновляющий гимн силы',
    genre: 'Pop, Hip-Hop',
    structure: '[Verse] [Chorus] [Verse] [Chorus] [Bridge] [Chorus] [Outro]',
    structureDescription: 'Anthem-style',
    features: ['Вдохновение', 'Сила', 'Призыв к действию'],
    exampleLines: [
      'Вставай, это твой момент!',
      'Никто не остановит нас...',
    ],
    promptHint: 'Напиши мотивационный гимн',
    hasVocals: true,
    colorClass: 'text-orange-400',
    bgClass: 'bg-orange-500/10',
  },
  {
    id: 'summer-hit',
    name: 'Летний хит',
    emoji: '☀️',
    description: 'Лёгкая позитивная песня о лете',
    genre: 'Pop, Dance',
    structure: '[Verse] [Chorus] [Verse] [Chorus] [Chorus]',
    structureDescription: 'Catchy-chorus',
    features: ['Лёгкость', 'Позитив', 'Запоминающийся'],
    exampleLines: [
      'Солнце, пляж и ты рядом...',
      'Лето не закончится никогда...',
    ],
    promptHint: 'Напиши летний хит',
    hasVocals: true,
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
  },
];

// Get preset by ID
export function getLyricsPresetById(id: string): LyricsPreset | undefined {
  return LYRICS_PRESETS.find(p => p.id === id);
}

// Get presets for specific genre
export function getLyricsPresetsByGenre(genre: string): LyricsPreset[] {
  return LYRICS_PRESETS.filter(p => 
    p.genre.toLowerCase().includes(genre.toLowerCase())
  );
}

// Get quick presets for homepage (first 4)
export function getQuickLyricsPresets(): LyricsPreset[] {
  return LYRICS_PRESETS.slice(0, 4);
}
