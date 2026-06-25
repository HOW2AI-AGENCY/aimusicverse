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
  { value: "pop", label: "Поп", labelEn: "Pop", emoji: "🎤" },
  { value: "rock", label: "Рок", labelEn: "Rock", emoji: "🎸" },
  { value: "hip-hop", label: "Хип-хоп", labelEn: "Hip-Hop", emoji: "🎧" },
  { value: "electronic", label: "Электроника", labelEn: "Electronic", emoji: "🎹" },
  { value: "r&b", label: "R&B", labelEn: "R&B", emoji: "🎷" },
  { value: "indie", label: "Инди", labelEn: "Indie", emoji: "🌙" },
  { value: "folk", label: "Фолк", labelEn: "Folk", emoji: "🪕" },
  { value: "jazz", label: "Джаз", labelEn: "Jazz", emoji: "🎺" },
  { value: "metal", label: "Метал", labelEn: "Metal", emoji: "🤘" },
  { value: "classical", label: "Классика", labelEn: "Classical", emoji: "🎻" },
  { value: "reggae", label: "Регги", labelEn: "Reggae", emoji: "🌴" },
  { value: "country", label: "Кантри", labelEn: "Country", emoji: "🤠" },
  { value: "ballad", label: "Баллада", labelEn: "Ballad", emoji: "💔" },
];

// ==================== MOODS ====================

export interface MoodOption {
  value: string;
  label: string;
  labelEn: string;
  emoji: string;
}

export const MOODS: MoodOption[] = [
  { value: "romantic", label: "Романтичное", labelEn: "Romantic", emoji: "💕" },
  { value: "energetic", label: "Энергичное", labelEn: "Energetic", emoji: "⚡" },
  { value: "melancholic", label: "Меланхоличное", labelEn: "Melancholic", emoji: "🌧️" },
  { value: "happy", label: "Радостное", labelEn: "Happy", emoji: "☀️" },
  { value: "sad", label: "Грустное", labelEn: "Sad", emoji: "😢" },
  { value: "dark", label: "Мрачное", labelEn: "Dark", emoji: "🌑" },
  { value: "nostalgic", label: "Ностальгическое", labelEn: "Nostalgic", emoji: "📷" },
  { value: "peaceful", label: "Умиротворённое", labelEn: "Peaceful", emoji: "🕊️" },
  { value: "epic", label: "Эпичное", labelEn: "Epic", emoji: "🏔️" },
  { value: "dreamy", label: "Мечтательное", labelEn: "Dreamy", emoji: "💭" },
  { value: "aggressive", label: "Агрессивное", labelEn: "Aggressive", emoji: "🔥" },
  { value: "mysterious", label: "Таинственное", labelEn: "Mysterious", emoji: "🌌" },
  { value: "hopeful", label: "Надежда", labelEn: "Hopeful", emoji: "🌅" },
  { value: "playful", label: "Игривое", labelEn: "Playful", emoji: "🎭" },
  { value: "inspiring", label: "Вдохновляющее", labelEn: "Inspiring", emoji: "✨" },
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
    value: "standard",
    label: "Стандартная",
    labelEn: "Standard",
    desc: "Куплет → Припев → Куплет → Припев → Бридж → Припев",
    descEn: "Verse → Chorus → Verse → Chorus → Bridge → Chorus",
  },
  {
    value: "simple",
    label: "Простая",
    labelEn: "Simple",
    desc: "Куплет → Припев → Куплет → Припев",
    descEn: "Verse → Chorus → Verse → Chorus",
  },
  {
    value: "extended",
    label: "Расширенная",
    labelEn: "Extended",
    desc: "Интро → Куплеты → Pre-Chorus → Припев → Бридж → Аутро",
    descEn: "Intro → Verses → Pre-Chorus → Chorus → Bridge → Outro",
  },
  {
    value: "ballad",
    label: "Баллада",
    labelEn: "Ballad",
    desc: "Интро → Куплет → Куплет → Припев → Бридж → Финал",
    descEn: "Intro → Verse → Verse → Chorus → Bridge → Final",
  },
  {
    value: "anthem",
    label: "Гимн",
    labelEn: "Anthem",
    desc: "Интро → Build → Припев → Куплет → Припев × 2 → Outro",
    descEn: "Intro → Build → Chorus → Verse → Chorus × 2 → Outro",
  },
  {
    value: "hip-hop",
    label: "Хип-хоп",
    labelEn: "Hip-Hop",
    desc: "Интро → Куплет → Хук → Куплет → Хук → Бридж → Хук",
    descEn: "Intro → Verse → Hook → Verse → Hook → Bridge → Hook",
  },
];

export const STRUCTURE_MAP: Record<string, string> = {
  standard: "Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus, Chorus, Bridge, Final Chorus",
  simple: "Verse 1, Chorus, Verse 2, Chorus",
  extended: "Intro, Verse 1, Verse 2, Pre-Chorus, Chorus, Verse 3, Bridge, Chorus, Outro",
  ballad: "Intro, Verse 1, Verse 2, Chorus, Bridge, Final Chorus, Outro",
  anthem: "Intro, Build, Chorus, Verse 1, Pre-Chorus, Chorus, Chorus, Outro",
  "hip-hop": "Intro, Verse 1, Hook, Verse 2, Hook, Bridge, Hook, Outro",
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
  { type: "verse", name: "Verse", nameRu: "Куплет", icon: "📝", defaultLines: 4 },
  { type: "chorus", name: "Chorus", nameRu: "Припев", icon: "🎵", defaultLines: 4 },
  { type: "prechorus", name: "Pre-Chorus", nameRu: "Пре-Припев", icon: "⬆️", defaultLines: 2 },
  { type: "bridge", name: "Bridge", nameRu: "Бридж", icon: "🌉", defaultLines: 4 },
  { type: "hook", name: "Hook", nameRu: "Хук", icon: "🪝", defaultLines: 4 },
  { type: "intro", name: "Intro", nameRu: "Вступление", icon: "🎬", defaultLines: 2 },
  { type: "outro", name: "Outro", nameRu: "Завершение", icon: "🔚", defaultLines: 2 },
  { type: "build", name: "Build", nameRu: "Нарастание", icon: "📈", defaultLines: 2 },
  { type: "drop", name: "Drop", nameRu: "Дроп", icon: "💥", defaultLines: 2 },
  { type: "breakdown", name: "Breakdown", nameRu: "Брейкдаун", icon: "🔻", defaultLines: 4 },
  { type: "solo", name: "Solo", nameRu: "Соло", icon: "🎸", defaultLines: 0 },
];

// ==================== TAG CATEGORIES (V5 Suno) ====================

export type TagCategory = "vocal" | "instrument" | "dynamic" | "mood" | "production" | "structure";

export interface TagCategoryInfo {
  icon: string; // Lucide icon name
  color: string;
  colorClass: string;
  label: string;
  labelEn: string;
}

export const TAG_CATEGORIES: Record<TagCategory, TagCategoryInfo> = {
  vocal: {
    icon: "Mic",
    color: "hsl(340, 82%, 52%)",
    colorClass: "bg-pink-500",
    label: "Вокал",
    labelEn: "Vocal",
  },
  instrument: {
    icon: "Guitar",
    color: "hsl(38, 92%, 50%)",
    colorClass: "bg-amber-500",
    label: "Инструменты",
    labelEn: "Instruments",
  },
  dynamic: {
    icon: "Volume2",
    color: "hsl(217, 91%, 60%)",
    colorClass: "bg-blue-500",
    label: "Динамика",
    labelEn: "Dynamic",
  },
  mood: {
    icon: "Heart",
    color: "hsl(271, 81%, 56%)",
    colorClass: "bg-purple-500",
    label: "Настроение",
    labelEn: "Mood",
  },
  production: {
    icon: "Sliders",
    color: "hsl(142, 71%, 45%)",
    colorClass: "bg-green-500",
    label: "Продакшн",
    labelEn: "Production",
  },
  structure: {
    icon: "Layers",
    color: "hsl(239, 84%, 67%)",
    colorClass: "bg-indigo-500",
    label: "Структура",
    labelEn: "Structure",
  },
};

// ==================== SECTION TAGS (English only for Suno V5) ====================

export interface TagDefinition {
  value: string;
  category: TagCategory;
  labelRu: string;
}

export const SECTION_TAGS: TagDefinition[] = [
  // Vocal
  { value: "Whisper", category: "vocal", labelRu: "Шёпот" },
  { value: "Powerful", category: "vocal", labelRu: "Мощный" },
  { value: "Falsetto", category: "vocal", labelRu: "Фальцет" },
  { value: "Raspy", category: "vocal", labelRu: "Хриплый" },
  { value: "Breathy", category: "vocal", labelRu: "Придыхание" },
  { value: "Belting", category: "vocal", labelRu: "Бэлтинг" },
  { value: "Harmony", category: "vocal", labelRu: "Гармония" },
  { value: "Spoken Word", category: "vocal", labelRu: "Речитатив" },
  { value: "Ad-lib", category: "vocal", labelRu: "Импровизация" },
  { value: "Gentle", category: "vocal", labelRu: "Нежный" },
  { value: "Soulful", category: "vocal", labelRu: "Соулфул" },
  { value: "Smooth", category: "vocal", labelRu: "Гладкий" },
  { value: "Raw", category: "vocal", labelRu: "Сырой" },

  // Instruments
  { value: "Piano Only", category: "instrument", labelRu: "Только пианино" },
  { value: "Acoustic Guitar", category: "instrument", labelRu: "Акустическая гитара" },
  { value: "Electric Guitar", category: "instrument", labelRu: "Электрогитара" },
  { value: "Full Band", category: "instrument", labelRu: "Полный бэнд" },
  { value: "Strings", category: "instrument", labelRu: "Струнные" },
  { value: "Synth", category: "instrument", labelRu: "Синтезатор" },
  { value: "A Cappella", category: "instrument", labelRu: "А капелла" },
  { value: "Drums Only", category: "instrument", labelRu: "Только ударные" },
  { value: "Bass Heavy", category: "instrument", labelRu: "Тяжёлый бас" },
  { value: "Orchestral", category: "instrument", labelRu: "Оркестровый" },

  // Dynamic
  { value: "Build", category: "dynamic", labelRu: "Нарастание" },
  { value: "Drop", category: "dynamic", labelRu: "Дроп" },
  { value: "Breakdown", category: "dynamic", labelRu: "Спад" },
  { value: "Crescendo", category: "dynamic", labelRu: "Крещендо" },
  { value: "Fade Out", category: "dynamic", labelRu: "Затухание" },
  { value: "Explosive", category: "dynamic", labelRu: "Взрывной" },
  { value: "Soft", category: "dynamic", labelRu: "Мягко" },
  { value: "Climax", category: "dynamic", labelRu: "Кульминация" },
  { value: "Soft Intro", category: "dynamic", labelRu: "Мягкое вступление" },
  { value: "Atmospheric", category: "dynamic", labelRu: "Атмосферный" },

  // Mood/Emotional
  { value: "Intimate", category: "mood", labelRu: "Интимный" },
  { value: "Anthemic", category: "mood", labelRu: "Гимновый" },
  { value: "Melancholic", category: "mood", labelRu: "Меланхоличный" },
  { value: "Triumphant", category: "mood", labelRu: "Триумфальный" },
  { value: "Nostalgic", category: "mood", labelRu: "Ностальгический" },
  { value: "Tender", category: "mood", labelRu: "Нежный" },
  { value: "Passionate", category: "mood", labelRu: "Страстный" },
  { value: "Vulnerable", category: "mood", labelRu: "Уязвимый" },
  { value: "Confident", category: "mood", labelRu: "Уверенный" },
  { value: "Hopeful", category: "mood", labelRu: "Надежда" },
  { value: "Rebellious", category: "mood", labelRu: "Бунтарский" },

  // Production
  { value: "Reverb", category: "production", labelRu: "Реверберация" },
  { value: "Echo", category: "production", labelRu: "Эхо" },
  { value: "Lo-fi", category: "production", labelRu: "Лоу-фай" },
  { value: "Distorted", category: "production", labelRu: "Дисторшн" },
  { value: "Clean", category: "production", labelRu: "Чистый" },
  { value: "Filtered", category: "production", labelRu: "Фильтрованный" },

  // Structure modifiers (timed)
  { value: "Solo: 8s", category: "structure", labelRu: "Соло 8с" },
  { value: "Solo: 12s", category: "structure", labelRu: "Соло 12с" },
  { value: "Instrumental: 8s", category: "structure", labelRu: "Инструментал 8с" },
  { value: "Instrumental: 12s", category: "structure", labelRu: "Инструментал 12с" },
  { value: "Break: 4s", category: "structure", labelRu: "Пауза 4с" },
  { value: "Break: 8s", category: "structure", labelRu: "Пауза 8с" },
];

// ==================== V5 COMPOUND TAG PRESETS ====================

export interface CompoundPreset {
  id: string;
  label: string;
  labelEn: string;
  tags: string[];
  description: string;
}

export const V5_COMPOUND_PRESETS: CompoundPreset[] = [
  {
    id: "tender-verse",
    label: "Нежный куплет",
    labelEn: "Tender Verse",
    tags: ["Soft", "Intimate", "Acoustic Guitar"],
    description: "Мягкий и интимный звук для куплетов",
  },
  {
    id: "powerful-chorus",
    label: "Мощный припев",
    labelEn: "Powerful Chorus",
    tags: ["Powerful", "Anthemic", "Full Band"],
    description: "Энергичный гимновый припев",
  },
  {
    id: "emotional-bridge",
    label: "Эмоциональный бридж",
    labelEn: "Emotional Bridge",
    tags: ["Breakdown", "Piano Only", "Whisper"],
    description: "Уязвимый момент перед финалом",
  },
  {
    id: "explosive-finale",
    label: "Взрывной финал",
    labelEn: "Explosive Finale",
    tags: ["Explosive", "Belting", "Crescendo"],
    description: "Мощная кульминация трека",
  },
  {
    id: "dreamy-intro",
    label: "Мечтательное вступление",
    labelEn: "Dreamy Intro",
    tags: ["Atmospheric", "Soft Intro", "Reverb"],
    description: "Атмосферное начало трека",
  },
  {
    id: "raw-verse",
    label: "Сырой куплет",
    labelEn: "Raw Verse",
    tags: ["Raw", "Spoken Word", "A Cappella"],
    description: "Минималистичный речитатив",
  },
];

// VOCAL_STYLE_TAGS moved to @/constants/sunoMetaTags.ts with full metadata

export const DYNAMIC_TAGS = [
  "Build",
  "Drop",
  "Breakdown",
  "Climax",
  "Crescendo",
  "Fade Out",
  "Soft Intro",
  "Explosive",
  "Atmospheric",
] as const;

export const EMOTIONAL_CUES = [
  "tender",
  "passionate",
  "vulnerable",
  "confident",
  "nostalgic",
  "hopeful",
  "melancholic",
  "triumphant",
  "intimate",
  "rebellious",
] as const;

// ==================== THEME SUGGESTIONS ====================

export const THEME_SUGGESTIONS = [
  "Любовь с первого взгляда",
  "Расставание и принятие",
  "Погоня за мечтой",
  "Ночной город",
  "Воспоминания о лете",
  "Внутренняя борьба",
  "Новое начало",
  "Танцы до утра",
] as const;

// ==================== ANIMATION VARIANTS ====================

export const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 500, damping: 30 },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

export const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

export const badgeVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
  selected: { scale: 1.05, boxShadow: "0 0 0 2px hsl(var(--primary))" },
};

// ==================== HELPER FUNCTIONS ====================

export function getGenreByValue(value: string): GenreOption | undefined {
  return GENRES.find((g) => g.value === value);
}

export function getMoodByValue(value: string): MoodOption | undefined {
  return MOODS.find((m) => m.value === value);
}

export function getStructureByValue(value: string): StructureOption | undefined {
  return STRUCTURES.find((s) => s.value === value);
}

export function getSectionTypeByType(type: string): SectionType | undefined {
  return SECTION_TYPES.find((s) => s.type === type);
}

export function getTagDefinition(value: string): TagDefinition | undefined {
  return SECTION_TAGS.find((t) => t.value === value);
}

export function getTagsByCategory(category: TagCategory): TagDefinition[] {
  return SECTION_TAGS.filter((t) => t.category === category);
}

/**
 * Validates that all tags are in English (no Cyrillic characters)
 */
export function validateTagLanguage(tags: string[]): { valid: boolean; invalid: string[] } {
  const cyrillicPattern = /[а-яёА-ЯЁ]/;
  const invalid = tags.filter((t) => cyrillicPattern.test(t));
  return { valid: invalid.length === 0, invalid };
}

/**
 * Formats compound tags for Suno V5: [Tag1, Tag2, Tag3]
 */
export function formatCompoundTag(tags: string[]): string {
  if (tags.length === 0) return "";
  if (tags.length === 1) return `[${tags[0]}]`;
  return `[${tags.join(", ")}]`;
}
