/**
 * Centralized stem labeling utility
 * Single source of truth for stem type to label mapping
 */

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

// Stem colors for UI (Tailwind classes) - enhanced palette
export const STEM_COLORS: Record<string, string> = {
  vocals: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
  vocal: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
  backing_vocals: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500',
  drums: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
  bass: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
  guitar: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
  piano: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
  keys: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
  keyboard: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
  strings: 'bg-rose-500/10 border-rose-500/30 text-rose-500',
  brass: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
  wind: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
  woodwinds: 'bg-lime-500/10 border-lime-500/30 text-lime-500',
  percussion: 'bg-red-500/10 border-red-500/30 text-red-500',
  synth: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500',
  pad: 'bg-violet-500/10 border-violet-500/30 text-violet-500',
  lead: 'bg-pink-500/10 border-pink-500/30 text-pink-500',
  melody: 'bg-pink-500/10 border-pink-500/30 text-pink-500',
  fx: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-500',
  sfx: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-500',
  atmosphere: 'bg-sky-500/10 border-sky-500/30 text-sky-500',
  instrumental: 'bg-green-500/10 border-green-500/30 text-green-500',
  backing: 'bg-teal-500/10 border-teal-500/30 text-teal-500',
  accompaniment: 'bg-teal-500/10 border-teal-500/30 text-teal-500',
  other: 'bg-gray-500/10 border-gray-500/30 text-gray-500',
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
