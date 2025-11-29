// Suno Builder Types

export enum SectionType {
  INTRO = 'intro',
  VERSE = 'verse',
  PRE_CHORUS = 'pre_chorus',
  CHORUS = 'chorus',
  HOOK = 'hook',
  BRIDGE = 'bridge',
  INTERLUDE = 'interlude',
  SOLO = 'solo',
  OUTRO = 'outro',
  DROP = 'drop',
}

export interface LyricSection {
  id: string;
  type: SectionType;
  header: string;
  content: string;
}

export interface TagConfig {
  label: string;
  value: string;
  category: 'VOCAL' | 'INSTRUMENT' | 'MOOD' | 'TECH';
  description?: string;
}

// UI Translations - Russian to English
export const UI_TRANSLATIONS: Record<string, string> = {
  // Vocals
  '[Вокал: Женский]': '[Vocal: Female]',
  '[Вокал: Мужской]': '[Vocal: Male]',
  '[Вокал: Смешанный]': '[Vocal: Mixed]',
  '[Хор]': '[Choir]',
  '[Фальцет]': '[Falsetto]',
  '[Шёпот]': '[Whisper]',
  '[Крик]': '[Scream]',
  
  // Instruments
  '[Гитара]': '[Guitar]',
  '[Бас]': '[Bass]',
  '[Барабаны]': '[Drums]',
  '[Синтезатор]': '[Synthesizer]',
  '[Пианино]': '[Piano]',
  '[Струнные]': '[Strings]',
  '[Духовые]': '[Brass]',
  
  // Mood
  '[Энергично]': '[Energetic]',
  '[Мелодично]': '[Melodic]',
  '[Агрессивно]': '[Aggressive]',
  '[Спокойно]': '[Calm]',
  '[Грустно]': '[Sad]',
  '[Радостно]': '[Happy]',
  
  // Technical
  '[Дисторшн]': '[Distortion]',
  '[Реверб]': '[Reverb]',
  '[Эхо]': '[Echo]',
  '[Компрессия]': '[Compression]',
};

// Section Type Labels
export const SECTION_LABELS: Record<SectionType, { ru: string; en: string; color: string }> = {
  [SectionType.INTRO]: { ru: 'Вступление', en: 'Intro', color: 'bg-blue-500/10 text-blue-500' },
  [SectionType.VERSE]: { ru: 'Куплет', en: 'Verse', color: 'bg-indigo-500/10 text-indigo-500' },
  [SectionType.PRE_CHORUS]: { ru: 'Предприпев', en: 'Pre-Chorus', color: 'bg-pink-500/10 text-pink-500' },
  [SectionType.CHORUS]: { ru: 'Припев', en: 'Chorus', color: 'bg-purple-500/10 text-purple-500' },
  [SectionType.HOOK]: { ru: 'Хук', en: 'Hook', color: 'bg-orange-500/10 text-orange-500' },
  [SectionType.BRIDGE]: { ru: 'Бридж', en: 'Bridge', color: 'bg-green-500/10 text-green-500' },
  [SectionType.INTERLUDE]: { ru: 'Интерлюдия', en: 'Interlude', color: 'bg-teal-500/10 text-teal-500' },
  [SectionType.SOLO]: { ru: 'Соло', en: 'Solo', color: 'bg-yellow-500/10 text-yellow-500' },
  [SectionType.OUTRO]: { ru: 'Концовка', en: 'Outro', color: 'bg-red-500/10 text-red-500' },
  [SectionType.DROP]: { ru: 'Дроп', en: 'Drop', color: 'bg-violet-500/10 text-violet-500' },
};

// Tag Configurations
export const TAG_CONFIGS: TagConfig[] = [
  // Vocals
  { label: 'Женский вокал', value: '[Vocal: Female]', category: 'VOCAL' },
  { label: 'Мужской вокал', value: '[Vocal: Male]', category: 'VOCAL' },
  { label: 'Смешанный вокал', value: '[Vocal: Mixed]', category: 'VOCAL' },
  { label: 'Хор', value: '[Choir]', category: 'VOCAL' },
  { label: 'Фальцет', value: '[Falsetto]', category: 'VOCAL' },
  { label: 'Шёпот', value: '[Whisper]', category: 'VOCAL' },
  { label: 'Крик', value: '[Scream]', category: 'VOCAL' },
  
  // Instruments
  { label: 'Гитара', value: '[Guitar]', category: 'INSTRUMENT' },
  { label: 'Бас', value: '[Bass]', category: 'INSTRUMENT' },
  { label: 'Барабаны', value: '[Drums]', category: 'INSTRUMENT' },
  { label: 'Синтезатор', value: '[Synthesizer]', category: 'INSTRUMENT' },
  { label: 'Пианино', value: '[Piano]', category: 'INSTRUMENT' },
  { label: 'Струнные', value: '[Strings]', category: 'INSTRUMENT' },
  { label: 'Духовые', value: '[Brass]', category: 'INSTRUMENT' },
  
  // Mood
  { label: 'Энергично', value: '[Energetic]', category: 'MOOD' },
  { label: 'Мелодично', value: '[Melodic]', category: 'MOOD' },
  { label: 'Агрессивно', value: '[Aggressive]', category: 'MOOD' },
  { label: 'Спокойно', value: '[Calm]', category: 'MOOD' },
  { label: 'Грустно', value: '[Sad]', category: 'MOOD' },
  { label: 'Радостно', value: '[Happy]', category: 'MOOD' },
  
  // Technical
  { label: 'Дисторшн', value: '[Distortion]', category: 'TECH' },
  { label: 'Реверб', value: '[Reverb]', category: 'TECH' },
  { label: 'Эхо', value: '[Echo]', category: 'TECH' },
  { label: 'Компрессия', value: '[Compression]', category: 'TECH' },
];
