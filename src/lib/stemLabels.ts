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
  percussion: 'Перкуссия',
  synth: 'Синтезатор',
  synthesizer: 'Синтезатор',
  pad: 'Пэд',
  fx: 'Эффекты',
  sfx: 'SFX',
  atmosphere: 'Атмосфера',
  
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

// Stem colors for UI (Tailwind classes)
export const STEM_COLORS: Record<string, string> = {
  vocals: 'bg-blue-500/10 border-blue-500/30',
  vocal: 'bg-blue-500/10 border-blue-500/30',
  backing_vocals: 'bg-cyan-500/10 border-cyan-500/30',
  drums: 'bg-orange-500/10 border-orange-500/30',
  bass: 'bg-purple-500/10 border-purple-500/30',
  guitar: 'bg-amber-500/10 border-amber-500/30',
  piano: 'bg-emerald-500/10 border-emerald-500/30',
  keys: 'bg-emerald-500/10 border-emerald-500/30',
  keyboard: 'bg-emerald-500/10 border-emerald-500/30',
  strings: 'bg-rose-500/10 border-rose-500/30',
  synth: 'bg-indigo-500/10 border-indigo-500/30',
  pad: 'bg-violet-500/10 border-violet-500/30',
  instrumental: 'bg-green-500/10 border-green-500/30',
  backing: 'bg-teal-500/10 border-teal-500/30',
  accompaniment: 'bg-teal-500/10 border-teal-500/30',
  other: 'bg-gray-500/10 border-gray-500/30',
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
  synth: '🎛️',
  pad: '🌊',
  fx: '✨',
  sfx: '✨',
  instrumental: '🎵',
  backing: '🎶',
  accompaniment: '🎶',
  other: '🔊',
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
 * Get full stem display info
 * @param stemType - The stem type identifier
 * @returns Object with label, color, and emoji
 */
export function getStemDisplayInfo(stemType: string) {
  return {
    label: getStemLabel(stemType),
    color: getStemColor(stemType),
    emoji: getStemEmoji(stemType),
  };
}
