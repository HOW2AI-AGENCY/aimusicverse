/**
 * Unified lyrics constants - single source of truth for genres, moods, structures, and section types.
 * All components should import from here instead of defining their own.
 */

// ==================== GENRES ====================

export interface GenreOption {
  value: string;
  label: string;
  labelEn: string;
  emoji: string;
}

export const GENRES: GenreOption[] = [
  { value: 'pop', label: 'Поп', labelEn: 'Pop', emoji: '🎤' },
  { value: 'rock', label: 'Рок', labelEn: 'Rock', emoji: '🎸' },
  { value: 'hip-hop', label: 'Хип-хоп', labelEn: 'Hip-Hop', emoji: '🎧' },
  { value: 'electronic', label: 'Электроника', labelEn: 'Electronic', emoji: '🎹' },
  { value: 'r&b', label: 'R&B', labelEn: 'R&B', emoji: '🎷' },
  { value: 'indie', label: 'Инди', labelEn: 'Indie', emoji: '🌙' },
  { value: 'folk', label: 'Фолк', labelEn: 'Folk', emoji: '🪕' },
  { value: 'jazz', label: 'Джаз', labelEn: 'Jazz', emoji: '🎺' },
  { value: 'metal', label: 'Метал', labelEn: 'Metal', emoji: '🤘' },
  { value: 'classical', label: 'Классика', labelEn: 'Classical', emoji: '🎻' },
  { value: 'reggae', label: 'Регги', labelEn: 'Reggae', emoji: '🌴' },
  { value: 'country', label: 'Кантри', labelEn: 'Country', emoji: '🤠' },
  { value: 'ballad', label: 'Баллада', labelEn: 'Ballad', emoji: '💔' },
];

// ==================== MOODS ====================

export interface MoodOption {
  value: string;
  label: string;
  labelEn: string;
  emoji: string;
}

export const MOODS: MoodOption[] = [
  { value: 'romantic', label: 'Романтичное', labelEn: 'Romantic', emoji: '💕' },
  { value: 'energetic', label: 'Энергичное', labelEn: 'Energetic', emoji: '⚡' },
  { value: 'melancholic', label: 'Меланхоличное', labelEn: 'Melancholic', emoji: '🌧️' },
  { value: 'happy', label: 'Радостное', labelEn: 'Happy', emoji: '☀️' },
  { value: 'sad', label: 'Грустное', labelEn: 'Sad', emoji: '😢' },
  { value: 'dark', label: 'Мрачное', labelEn: 'Dark', emoji: '🌑' },
  { value: 'nostalgic', label: 'Ностальгическое', labelEn: 'Nostalgic', emoji: '📷' },
  { value: 'peaceful', label: 'Умиротворённое', labelEn: 'Peaceful', emoji: '🕊️' },
  { value: 'epic', label: 'Эпичное', labelEn: 'Epic', emoji: '🏔️' },
  { value: 'dreamy', label: 'Мечтательное', labelEn: 'Dreamy', emoji: '💭' },
  { value: 'aggressive', label: 'Агрессивное', labelEn: 'Aggressive', emoji: '🔥' },
  { value: 'mysterious', label: 'Таинственное', labelEn: 'Mysterious', emoji: '🌌' },
  { value: 'hopeful', label: 'Надежда', labelEn: 'Hopeful', emoji: '🌅' },
  { value: 'playful', label: 'Игривое', labelEn: 'Playful', emoji: '🎭' },
  { value: 'inspiring', label: 'Вдохновляющее', labelEn: 'Inspiring', emoji: '✨' },
];

// ==================== STRUCTURES ====================

export interface StructureOption {
  value: string;
  label: string;
  labelEn: string;
  desc: string;
  descEn: string;
}

export const STRUCTURES: StructureOption[] = [
  { 
    value: 'standard', 
    label: 'Стандартная', 
    labelEn: 'Standard',
    desc: 'Куплет → Припев → Куплет → Припев → Бридж → Припев',
    descEn: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus'
  },
  { 
    value: 'simple', 
    label: 'Простая', 
    labelEn: 'Simple',
    desc: 'Куплет → Припев → Куплет → Припев',
    descEn: 'Verse → Chorus → Verse → Chorus'
  },
  { 
    value: 'extended', 
    label: 'Расширенная', 
    labelEn: 'Extended',
    desc: 'Интро → Куплеты → Pre-Chorus → Припев → Бридж → Аутро',
    descEn: 'Intro → Verses → Pre-Chorus → Chorus → Bridge → Outro'
  },
  { 
    value: 'ballad', 
    label: 'Баллада', 
    labelEn: 'Ballad',
    desc: 'Интро → Куплет → Куплет → Припев → Бридж → Финал',
    descEn: 'Intro → Verse → Verse → Chorus → Bridge → Final'
  },
  { 
    value: 'anthem', 
    label: 'Гимн', 
    labelEn: 'Anthem',
    desc: 'Интро → Build → Припев → Куплет → Припев × 2 → Outro',
    descEn: 'Intro → Build → Chorus → Verse → Chorus × 2 → Outro'
  },
  { 
    value: 'hip-hop', 
    label: 'Хип-хоп', 
    labelEn: 'Hip-Hop',
    desc: 'Интро → Куплет → Хук → Куплет → Хук → Бридж → Хук',
    descEn: 'Intro → Verse → Hook → Verse → Hook → Bridge → Hook'
  },
];

export const STRUCTURE_MAP: Record<string, string> = {
  standard: 'Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus, Chorus, Bridge, Final Chorus',
  simple: 'Verse 1, Chorus, Verse 2, Chorus',
  extended: 'Intro, Verse 1, Verse 2, Pre-Chorus, Chorus, Verse 3, Bridge, Chorus, Outro',
  ballad: 'Intro, Verse 1, Verse 2, Chorus, Bridge, Final Chorus, Outro',
  anthem: 'Intro, Build, Chorus, Verse 1, Pre-Chorus, Chorus, Chorus, Outro',
  'hip-hop': 'Intro, Verse 1, Hook, Verse 2, Hook, Bridge, Hook, Outro',
};

// ==================== SECTION TYPES ====================

export interface SectionType {
  type: string;
  name: string;
  nameRu: string;
  icon: string;
  defaultLines: number;
}

export const SECTION_TYPES: SectionType[] = [
  { type: 'verse', name: 'Verse', nameRu: 'Куплет', icon: '📝', defaultLines: 4 },
  { type: 'chorus', name: 'Chorus', nameRu: 'Припев', icon: '🎵', defaultLines: 4 },
  { type: 'prechorus', name: 'Pre-Chorus', nameRu: 'Пре-Припев', icon: '⬆️', defaultLines: 2 },
  { type: 'bridge', name: 'Bridge', nameRu: 'Бридж', icon: '🌉', defaultLines: 4 },
  { type: 'hook', name: 'Hook', nameRu: 'Хук', icon: '🪝', defaultLines: 4 },
  { type: 'intro', name: 'Intro', nameRu: 'Вступление', icon: '🎬', defaultLines: 2 },
  { type: 'outro', name: 'Outro', nameRu: 'Завершение', icon: '🔚', defaultLines: 2 },
  { type: 'build', name: 'Build', nameRu: 'Нарастание', icon: '📈', defaultLines: 2 },
  { type: 'drop', name: 'Drop', nameRu: 'Дроп', icon: '💥', defaultLines: 2 },
  { type: 'breakdown', name: 'Breakdown', nameRu: 'Брейкдаун', icon: '🔻', defaultLines: 4 },
  { type: 'solo', name: 'Solo', nameRu: 'Соло', icon: '🎸', defaultLines: 0 },
];

// ==================== VOCAL & DYNAMIC TAGS ====================

export const VOCAL_STYLE_TAGS = [
  'Gentle', 'Powerful', 'Whisper', 'Falsetto', 'Raspy', 
  'Soulful', 'Breathy', 'Belting', 'Smooth', 'Raw'
] as const;

export const DYNAMIC_TAGS = [
  'Build', 'Drop', 'Breakdown', 'Climax', 'Crescendo',
  'Fade Out', 'Soft Intro', 'Explosive', 'Atmospheric'
] as const;

export const EMOTIONAL_CUES = [
  'tender', 'passionate', 'vulnerable', 'confident', 'nostalgic',
  'hopeful', 'melancholic', 'triumphant', 'intimate', 'rebellious'
] as const;

// ==================== THEME SUGGESTIONS ====================

export const THEME_SUGGESTIONS = [
  'Любовь с первого взгляда',
  'Расставание и принятие',
  'Погоня за мечтой',
  'Ночной город',
  'Воспоминания о лете',
  'Внутренняя борьба',
  'Новое начало',
  'Танцы до утра',
] as const;

// ==================== ANIMATION VARIANTS ====================

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

// ==================== HELPER FUNCTIONS ====================

export function getGenreByValue(value: string): GenreOption | undefined {
  return GENRES.find(g => g.value === value);
}

export function getMoodByValue(value: string): MoodOption | undefined {
  return MOODS.find(m => m.value === value);
}

export function getStructureByValue(value: string): StructureOption | undefined {
  return STRUCTURES.find(s => s.value === value);
}

export function getSectionTypeByType(type: string): SectionType | undefined {
  return SECTION_TYPES.find(s => s.type === type);
}
