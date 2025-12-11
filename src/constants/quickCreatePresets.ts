/**
 * Quick Create Presets for Music Lab Hub
 * 
 * Sprint 026 US-026-002: Quick Create Presets
 * 
 * Ready-to-use presets for instant music creation
 */

export interface QuickCreatePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'rock' | 'pop' | 'electronic' | 'jazz' | 'classical' | 'hip-hop';
  tags: string[];
  defaultParams: {
    style?: string;
    mood?: string;
    tempo?: string;
    instruments?: string[];
    duration?: number;
  };
}

export const QUICK_CREATE_PRESETS: QuickCreatePreset[] = [
  {
    id: 'rock-guitar',
    name: '🎸 Rock Guitar Track',
    description: 'Энергичный рок-трек с электрогитарой и драйвом',
    icon: '🎸',
    category: 'rock',
    tags: ['rock', 'guitar', 'energetic', 'driving'],
    defaultParams: {
      style: 'rock, electric guitar, drums, bass',
      mood: 'energetic, powerful, driving',
      tempo: 'fast',
      instruments: ['electric guitar', 'drums', 'bass guitar'],
      duration: 180,
    },
  },
  {
    id: 'piano-ballad',
    name: '🎹 Piano Ballad',
    description: 'Лиричная баллада с фортепиано и струнными',
    icon: '🎹',
    category: 'pop',
    tags: ['ballad', 'piano', 'emotional', 'slow'],
    defaultParams: {
      style: 'piano ballad, strings, emotional',
      mood: 'melancholic, romantic, gentle',
      tempo: 'slow',
      instruments: ['piano', 'strings', 'soft drums'],
      duration: 240,
    },
  },
  {
    id: 'pop-vocals',
    name: '🎤 Pop Vocals',
    description: 'Современный поп с запоминающимся вокалом',
    icon: '🎤',
    category: 'pop',
    tags: ['pop', 'vocals', 'catchy', 'upbeat'],
    defaultParams: {
      style: 'modern pop, catchy vocals, upbeat',
      mood: 'happy, energetic, fun',
      tempo: 'medium',
      instruments: ['vocals', 'synths', 'drums', 'bass'],
      duration: 210,
    },
  },
  {
    id: 'electronic-beat',
    name: '🥁 Electronic Beat',
    description: 'Электронный трек с мощным битом и синтезаторами',
    icon: '🥁',
    category: 'electronic',
    tags: ['electronic', 'edm', 'beat', 'synth'],
    defaultParams: {
      style: 'electronic, EDM, synths, powerful beat',
      mood: 'energetic, futuristic, intense',
      tempo: 'fast',
      instruments: ['synthesizers', 'electronic drums', 'bass'],
      duration: 180,
    },
  },
  {
    id: 'jazz-ensemble',
    name: '🎺 Jazz Ensemble',
    description: 'Джазовая композиция с духовыми и импровизацией',
    icon: '🎺',
    category: 'jazz',
    tags: ['jazz', 'brass', 'improvisation', 'smooth'],
    defaultParams: {
      style: 'jazz, brass section, piano, smooth',
      mood: 'sophisticated, relaxed, smooth',
      tempo: 'medium',
      instruments: ['saxophone', 'trumpet', 'piano', 'double bass', 'drums'],
      duration: 270,
    },
  },
  {
    id: 'classical-arrangement',
    name: '🎻 Classical Arrangement',
    description: 'Классическая оркестровая композиция',
    icon: '🎻',
    category: 'classical',
    tags: ['classical', 'orchestra', 'elegant', 'dramatic'],
    defaultParams: {
      style: 'classical, orchestra, elegant arrangement',
      mood: 'dramatic, majestic, beautiful',
      tempo: 'medium',
      instruments: ['strings', 'woodwinds', 'brass', 'timpani'],
      duration: 300,
    },
  },
  {
    id: 'hip-hop-beat',
    name: '🎧 Hip-Hop Beat',
    description: 'Современный хип-хоп бит с басом и ритмом',
    icon: '🎧',
    category: 'hip-hop',
    tags: ['hip-hop', 'rap', 'beat', 'bass'],
    defaultParams: {
      style: 'hip-hop, trap beat, heavy bass',
      mood: 'confident, cool, rhythmic',
      tempo: 'medium',
      instruments: ['808 bass', 'hi-hats', 'snare', 'synths'],
      duration: 180,
    },
  },
  {
    id: 'acoustic-indie',
    name: '🌿 Acoustic Indie',
    description: 'Инди-трек с акустической гитарой и атмосферой',
    icon: '🌿',
    category: 'pop',
    tags: ['indie', 'acoustic', 'atmospheric', 'chill'],
    defaultParams: {
      style: 'indie, acoustic guitar, atmospheric',
      mood: 'dreamy, relaxed, introspective',
      tempo: 'slow',
      instruments: ['acoustic guitar', 'light percussion', 'ambient pads'],
      duration: 240,
    },
  },
];

/**
 * Get preset by ID
 */
export function getPresetById(id: string): QuickCreatePreset | undefined {
  return QUICK_CREATE_PRESETS.find(preset => preset.id === id);
}

/**
 * Get presets by category
 */
export function getPresetsByCategory(category: QuickCreatePreset['category']): QuickCreatePreset[] {
  return QUICK_CREATE_PRESETS.filter(preset => preset.category === category);
}

/**
 * Search presets by tag
 */
export function searchPresetsByTag(tag: string): QuickCreatePreset[] {
  return QUICK_CREATE_PRESETS.filter(preset => 
    preset.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
  );
}
