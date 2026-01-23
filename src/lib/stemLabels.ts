/**
 * Centralized stem labeling utility
 * Single source of truth for stem type to label mapping
 */

import { stemColors, getStemColor as getDesignStemColor } from '@/lib/design-colors';

// Comprehensive stem labels mapping (Russian)
const STEM_LABELS: Record<string, string> = {
  // Standard stems
  vocals: 'Вокал',
  vocal: 'Вокал',
  backing_vocals: 'Бэк-вокал',
  drums: 'Ударные',
  bass: 'Бас',
  guitar: 'Гитара',
  piano: 'Пианино',
  keys: 'Клавишные',
  keyboard: 'Клавишные',
  strings: 'Струнные',
  brass: 'Духовые',
  woodwinds: 'Дер. духовые',
  wind: 'Духовые',
  percussion: 'Перкуссия',
  synth: 'Синтезатор',
  synthesizer: 'Синтезатор',
  pad: 'Пэд',
  fx: 'Эффекты',
  sfx: 'SFX',
  atmosphere: 'Атмосфера',
  lead: 'Соло',
  melody: 'Мелодия',
  
  // Combined/special stems
  instrumental: 'Инструментал',
  backing: 'Бэкинг',
  accompaniment: 'Аккомпанемент',
  other: 'Другое',
  
  // Generated stems (from AI)
  generated_drums: 'Ударные',
  generated_bass: 'Бас',
  generated_piano: 'Пианино',
  generated_strings: 'Струнные',
  generated_synth: 'Синтезатор',
  generated_sfx: 'SFX',
  generated_guitar: 'Гитара',
  generated_pad: 'Пэд',
};

/**
 * @deprecated Use stemColors from @/lib/design-colors instead
 * Keeping for backward compatibility
 */
export const STEM_COLORS: Record<string, string> = {
  vocals: stemColors.vocals.combined,
  vocal: stemColors.vocals.combined,
  backing_vocals: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500',
  drums: stemColors.drums.combined,
  bass: stemColors.bass.combined,
  guitar: stemColors.guitar.combined,
  piano: stemColors.piano.combined,
  keys: stemColors.piano.combined,
  keyboard: stemColors.piano.combined,
  strings: stemColors.strings.combined,
  brass: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
  wind: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
  woodwinds: 'bg-lime-500/10 border-lime-500/30 text-lime-500',
  percussion: 'bg-red-500/10 border-red-500/30 text-red-500',
  synth: stemColors.synth.combined,
  pad: stemColors.bass.combined,
  lead: stemColors.melody.combined,
  melody: stemColors.melody.combined,
  fx: stemColors.fx.combined,
  sfx: stemColors.fx.combined,
  atmosphere: stemColors.atmosphere.combined,
  instrumental: stemColors.instrumental.combined,
  backing: 'bg-teal-500/10 border-teal-500/30 text-teal-500',
  accompaniment: 'bg-teal-500/10 border-teal-500/30 text-teal-500',
  other: stemColors.other.combined,
};

// Stem emojis for compact display
export const STEM_EMOJIS: Record<string, string> = {
  vocals: '🎤',
  vocal: '🎤',
  backing_vocals: '🎙️',
  drums: '🥁',
  bass: '🎸',
  guitar: '🎸',
  piano: '🎹',
  keys: '🎹',
  keyboard: '🎹',
  strings: '🎻',
  brass: '🎺',
  wind: '🎷',
  woodwinds: '🪈',
  percussion: '🪘',
  synth: '🎛️',
  pad: '🌊',
  lead: '🎵',
  melody: '🎵',
  fx: '✨',
  sfx: '✨',
  atmosphere: '🌀',
  instrumental: '🎼',
  backing: '🎶',
  accompaniment: '🎶',
  other: '🔊',
};

// Lucide icon names for each stem type
export const STEM_ICON_NAMES: Record<string, string> = {
  vocals: 'mic-2',
  vocal: 'mic-2',
  backing_vocals: 'mic',
  drums: 'drum',
  bass: 'guitar',
  guitar: 'guitar',
  piano: 'piano',
  keys: 'piano',
  keyboard: 'piano',
  strings: 'music-2',
  brass: 'music-2',
  wind: 'music-2',
  woodwinds: 'music-2',
  percussion: 'drum',
  synth: 'sliders',
  pad: 'waves',
  lead: 'music',
  melody: 'music',
  fx: 'sparkles',
  sfx: 'sparkles',
  atmosphere: 'cloud',
  instrumental: 'music-2',
  backing: 'volume-2',
  accompaniment: 'volume-2',
  other: 'file-audio',
};

/**
 * Get localized label for a stem type
 * @param stemType - The stem type identifier (e.g., 'vocals', 'drums', 'accompaniment')
 * @returns Localized stem label in Russian
 */
export function getStemLabel(stemType: string): string {
  const normalized = stemType.toLowerCase().trim();
  return STEM_LABELS[normalized] || stemType;
}

/**
 * Get Tailwind color classes for a stem type
 * @param stemType - The stem type identifier
 * @returns Tailwind classes string
 */
export function getStemColor(stemType: string): string {
  const normalized = stemType.toLowerCase().trim();
  return STEM_COLORS[normalized] || STEM_COLORS.other;
}

/**
 * Get emoji for a stem type
 * @param stemType - The stem type identifier
 * @returns Emoji string
 */
export function getStemEmoji(stemType: string): string {
  const normalized = stemType.toLowerCase().trim();
  return STEM_EMOJIS[normalized] || STEM_EMOJIS.other;
}

/**
 * Get Lucide icon name for a stem type
 * @param stemType - The stem type identifier
 * @returns Lucide icon name
 */
export function getStemIconName(stemType: string): string {
  const normalized = stemType.toLowerCase().trim();
  return STEM_ICON_NAMES[normalized] || STEM_ICON_NAMES.other;
}

/**
 * Get full stem display info
 * @param stemType - The stem type identifier
 * @returns Object with label, color, emoji, and iconName
 */
export function getStemDisplayInfo(stemType: string) {
  return {
    label: getStemLabel(stemType),
    color: getStemColor(stemType),
    emoji: getStemEmoji(stemType),
    iconName: getStemIconName(stemType),
  };
}
