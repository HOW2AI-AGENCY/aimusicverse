// Suno Builder Types
import { sectionColors, getSectionColor } from '@/lib/design-colors';

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
// Use design tokens for section colors
export const SECTION_LABELS: Record<SectionType, { ru: string; en: string; color: string }> = {
  [SectionType.INTRO]: { ru: 'Вступление', en: 'Intro', color: sectionColors.intro.combined },
  [SectionType.VERSE]: { ru: 'Куплет', en: 'Verse', color: sectionColors.verse.combined },
  [SectionType.PRE_CHORUS]: { ru: 'Предприпев', en: 'Pre-Chorus', color: sectionColors.prechorus.combined },
  [SectionType.CHORUS]: { ru: 'Припев', en: 'Chorus', color: sectionColors.chorus.combined },
  [SectionType.HOOK]: { ru: 'Хук', en: 'Hook', color: sectionColors.hook.combined },
  [SectionType.BRIDGE]: { ru: 'Бридж', en: 'Bridge', color: sectionColors.bridge.combined },
  [SectionType.INTERLUDE]: { ru: 'Интерлюдия', en: 'Interlude', color: sectionColors.interlude.combined },
  [SectionType.SOLO]: { ru: 'Соло', en: 'Solo', color: sectionColors.solo.combined },
  [SectionType.OUTRO]: { ru: 'Концовка', en: 'Outro', color: sectionColors.outro.combined },
  [SectionType.DROP]: { ru: 'Дроп', en: 'Drop', color: getSectionColor('breakdown').combined },
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
