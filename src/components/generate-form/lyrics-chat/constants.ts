import type { GenreOption, MoodOption, StructureOption } from './types';

export const GENRES: GenreOption[] = [
  { value: 'pop', label: 'Поп', emoji: '🎤' },
  { value: 'rock', label: 'Рок', emoji: '🎸' },
  { value: 'hip-hop', label: 'Хип-хоп', emoji: '🎧' },
  { value: 'electronic', label: 'Электроника', emoji: '🎹' },
  { value: 'r&b', label: 'R&B', emoji: '🎷' },
  { value: 'indie', label: 'Инди', emoji: '🌙' },
  { value: 'folk', label: 'Фолк', emoji: '🪕' },
  { value: 'jazz', label: 'Джаз', emoji: '🎺' },
  { value: 'metal', label: 'Метал', emoji: '🤘' },
  { value: 'classical', label: 'Классика', emoji: '🎻' },
  { value: 'reggae', label: 'Регги', emoji: '🌴' },
  { value: 'country', label: 'Кантри', emoji: '🤠' },
];

export const MOODS: MoodOption[] = [
  { value: 'romantic', label: 'Романтичное', emoji: '💕' },
  { value: 'energetic', label: 'Энергичное', emoji: '⚡' },
  { value: 'melancholic', label: 'Меланхоличное', emoji: '🌧️' },
  { value: 'happy', label: 'Радостное', emoji: '☀️' },
  { value: 'dark', label: 'Мрачное', emoji: '🌑' },
  { value: 'nostalgic', label: 'Ностальгическое', emoji: '📷' },
  { value: 'peaceful', label: 'Умиротворённое', emoji: '🕊️' },
  { value: 'epic', label: 'Эпичное', emoji: '🏔️' },
  { value: 'dreamy', label: 'Мечтательное', emoji: '💭' },
  { value: 'aggressive', label: 'Агрессивное', emoji: '🔥' },
  { value: 'mysterious', label: 'Таинственное', emoji: '🌌' },
  { value: 'hopeful', label: 'Надежда', emoji: '🌅' },
];

export const STRUCTURES: StructureOption[] = [
  { value: 'standard', label: 'Стандартная', desc: 'Куплет → Припев → Куплет → Припев → Бридж → Припев' },
  { value: 'simple', label: 'Простая', desc: 'Куплет → Припев → Куплет → Припев' },
  { value: 'extended', label: 'Расширенная', desc: 'Интро → Куплеты → Pre-Chorus → Припев → Бридж → Аутро' },
  { value: 'ballad', label: 'Баллада', desc: 'Интро → Куплет → Куплет → Припев → Бридж → Финал' },
  { value: 'anthem', label: 'Гимн', desc: 'Интро → Build → Припев → Куплет → Припев × 2 → Outro' },
];

export const STRUCTURE_MAP: Record<string, string> = {
  standard: 'Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus, Chorus, Bridge, Final Chorus',
  simple: 'Verse 1, Chorus, Verse 2, Chorus',
  extended: 'Intro, Verse 1, Verse 2, Pre-Chorus, Chorus, Verse 3, Bridge, Chorus, Outro',
  ballad: 'Intro, Verse 1, Verse 2, Chorus, Bridge, Final Chorus, Outro',
  anthem: 'Intro, Build, Chorus, Verse 1, Pre-Chorus, Chorus, Chorus, Outro',
};

export const INITIAL_MESSAGE_OPTIONS = [
  { label: '💕 Любовь', value: 'Песня о любви и отношениях' },
  { label: '✨ Мечты', value: 'Песня о погоне за мечтой' },
  { label: '🌃 Ночной город', value: 'Песня о ночном городе' },
  { label: '🦋 Свобода', value: 'Песня о свободе' },
  { label: '💔 Расставание', value: 'Песня о расставании и боли' },
  { label: '🚀 Успех', value: 'Песня о пути к успеху' },
];

// Advanced tag categories for smart generation
export const VOCAL_STYLE_TAGS = [
  'Gentle', 'Powerful', 'Whisper', 'Falsetto', 'Raspy', 
  'Soulful', 'Breathy', 'Belting', 'Smooth', 'Raw'
];

export const DYNAMIC_TAGS = [
  'Build', 'Drop', 'Breakdown', 'Climax', 'Crescendo',
  'Fade Out', 'Soft Intro', 'Explosive', 'Atmospheric'
];

export const EMOTIONAL_CUES = [
  'tender', 'passionate', 'vulnerable', 'confident', 'nostalgic',
  'hopeful', 'melancholic', 'triumphant', 'intimate', 'rebellious'
];

// Animation variants
export const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 500, damping: 30 }
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
};

export const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
};

export const badgeVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
  selected: { scale: 1.05, boxShadow: '0 0 0 2px hsl(var(--primary))' }
};
