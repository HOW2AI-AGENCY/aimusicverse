// PromptDJ Presets - Russian UI labels, English prompt values

export interface PresetItem {
  id: string;
  label: string;      // Russian display label
  value: string;      // English prompt value
  tags: string[];     // English tags for prompt building
}

// Legacy interface for backward compatibility
export interface LegacyChannel {
  type: string;
  value: string;
  weight: number;
  enabled: boolean;
}

// Жанры (Genres) - 20+
export const GENRE_PRESETS: PresetItem[] = [
  { id: 'electronic', label: 'Электроника', value: 'electronic', tags: ['electronic', 'synth', 'digital'] },
  { id: 'hiphop', label: 'Хип-хоп', value: 'hip-hop', tags: ['hip-hop', 'rap', 'beats', 'urban'] },
  { id: 'rock', label: 'Рок', value: 'rock', tags: ['rock', 'guitar', 'drums', 'electric'] },
  { id: 'jazz', label: 'Джаз', value: 'jazz', tags: ['jazz', 'swing', 'improvisation', 'smooth'] },
  { id: 'classical', label: 'Классика', value: 'classical', tags: ['classical', 'orchestral', 'symphony'] },
  { id: 'pop', label: 'Поп', value: 'pop', tags: ['pop', 'catchy', 'mainstream', 'radio'] },
  { id: 'ambient', label: 'Эмбиент', value: 'ambient', tags: ['ambient', 'atmospheric', 'drone', 'ethereal'] },
  { id: 'rnb', label: 'R&B', value: 'r&b', tags: ['r&b', 'soul', 'groove', 'smooth'] },
  { id: 'edm', label: 'EDM', value: 'edm', tags: ['edm', 'dance', 'club', 'festival'] },
  { id: 'lofi', label: 'Lo-Fi', value: 'lo-fi', tags: ['lo-fi', 'chill', 'relaxed', 'vinyl'] },
  { id: 'metal', label: 'Металл', value: 'metal', tags: ['metal', 'heavy', 'distorted', 'aggressive'] },
  { id: 'funk', label: 'Фанк', value: 'funk', tags: ['funk', 'funky', 'groovy', 'rhythmic'] },
  { id: 'soul', label: 'Соул', value: 'soul', tags: ['soul', 'soulful', 'emotional', 'warm'] },
  { id: 'reggae', label: 'Регги', value: 'reggae', tags: ['reggae', 'dub', 'island', 'relaxed'] },
  { id: 'latin', label: 'Латино', value: 'latin', tags: ['latin', 'salsa', 'tropical', 'rhythmic'] },
  { id: 'world', label: 'Этника', value: 'world music', tags: ['world', 'ethnic', 'folk', 'traditional'] },
  { id: 'indie', label: 'Инди', value: 'indie', tags: ['indie', 'alternative', 'underground'] },
  { id: 'punk', label: 'Панк', value: 'punk', tags: ['punk', 'raw', 'fast', 'rebellious'] },
  { id: 'country', label: 'Кантри', value: 'country', tags: ['country', 'acoustic', 'folk', 'americana'] },
  { id: 'blues', label: 'Блюз', value: 'blues', tags: ['blues', 'bluesy', 'soulful', 'emotional'] },
  { id: 'trap', label: 'Трэп', value: 'trap', tags: ['trap', '808', 'hi-hats', 'dark'] },
  { id: 'house', label: 'Хаус', value: 'house', tags: ['house', 'four-on-the-floor', 'dance'] },
  { id: 'techno', label: 'Техно', value: 'techno', tags: ['techno', 'industrial', 'hypnotic'] },
];

// Инструменты (Instruments) - 15+
export const INSTRUMENT_PRESETS: PresetItem[] = [
  { id: 'piano', label: 'Пианино', value: 'piano', tags: ['piano', 'keys', 'grand piano'] },
  { id: 'guitar', label: 'Гитара', value: 'guitar', tags: ['guitar', 'acoustic guitar', 'electric guitar'] },
  { id: 'synth', label: 'Синтезатор', value: 'synthesizer', tags: ['synth', 'synthesizer', 'analog synth'] },
  { id: 'strings', label: 'Струнные', value: 'strings', tags: ['strings', 'violin', 'cello', 'orchestra'] },
  { id: 'brass', label: 'Духовые', value: 'brass', tags: ['brass', 'trumpet', 'saxophone', 'horns'] },
  { id: 'drums', label: 'Ударные', value: 'drums', tags: ['drums', 'percussion', 'beat', 'rhythm'] },
  { id: 'bass', label: 'Бас', value: 'bass', tags: ['bass', 'bass guitar', 'sub bass', '808'] },
  { id: 'vocals', label: 'Вокал', value: 'vocals', tags: ['vocals', 'voice', 'singing'] },
  { id: 'pads', label: 'Пэды', value: 'pads', tags: ['pads', 'ambient pads', 'atmospheric'] },
  { id: 'bells', label: 'Колокола', value: 'bells', tags: ['bells', 'chimes', 'glockenspiel', 'sparkle'] },
  { id: 'flute', label: 'Флейта', value: 'flute', tags: ['flute', 'woodwind', 'airy'] },
  { id: 'organ', label: 'Орган', value: 'organ', tags: ['organ', 'church organ', 'hammond'] },
  { id: 'sax', label: 'Саксофон', value: 'saxophone', tags: ['saxophone', 'sax', 'jazzy'] },
  { id: 'violin', label: 'Скрипка', value: 'violin', tags: ['violin', 'fiddle', 'orchestral'] },
  { id: 'choir', label: 'Хор', value: 'choir', tags: ['choir', 'vocal ensemble', 'harmonies'] },
  { id: 'harp', label: 'Арфа', value: 'harp', tags: ['harp', 'ethereal', 'dreamy'] },
];

// Настроения (Moods) - 15+
export const MOOD_PRESETS: PresetItem[] = [
  { id: 'energetic', label: 'Энергичный', value: 'energetic', tags: ['energetic', 'upbeat', 'powerful', 'driving'] },
  { id: 'calm', label: 'Спокойный', value: 'calm', tags: ['calm', 'peaceful', 'serene', 'tranquil'] },
  { id: 'dark', label: 'Тёмный', value: 'dark', tags: ['dark', 'moody', 'ominous', 'mysterious'] },
  { id: 'happy', label: 'Радостный', value: 'happy', tags: ['happy', 'joyful', 'uplifting', 'cheerful'] },
  { id: 'sad', label: 'Грустный', value: 'sad', tags: ['sad', 'melancholic', 'emotional', 'nostalgic'] },
  { id: 'epic', label: 'Эпический', value: 'epic', tags: ['epic', 'cinematic', 'grand', 'heroic'] },
  { id: 'mysterious', label: 'Загадочный', value: 'mysterious', tags: ['mysterious', 'enigmatic', 'suspenseful'] },
  { id: 'romantic', label: 'Романтичный', value: 'romantic', tags: ['romantic', 'love', 'passionate', 'tender'] },
  { id: 'aggressive', label: 'Агрессивный', value: 'aggressive', tags: ['aggressive', 'intense', 'fierce', 'raw'] },
  { id: 'dreamy', label: 'Мечтательный', value: 'dreamy', tags: ['dreamy', 'floating', 'surreal', 'hazy'] },
  { id: 'groovy', label: 'Драйвовый', value: 'groovy', tags: ['groovy', 'funky', 'rhythmic', 'danceable'] },
  { id: 'relaxed', label: 'Расслабленный', value: 'relaxed', tags: ['relaxed', 'laid-back', 'chill'] },
  { id: 'intense', label: 'Интенсивный', value: 'intense', tags: ['intense', 'powerful', 'dramatic'] },
  { id: 'playful', label: 'Игривый', value: 'playful', tags: ['playful', 'fun', 'quirky', 'whimsical'] },
  { id: 'nostalgic', label: 'Ностальгический', value: 'nostalgic', tags: ['nostalgic', 'retro', 'memories'] },
];

// Характер/Стиль (Style) - 12+
export const STYLE_PRESETS: PresetItem[] = [
  { id: 'minimalist', label: 'Минималистичный', value: 'minimalist', tags: ['minimal', 'sparse', 'clean'] },
  { id: 'maximalist', label: 'Насыщенный', value: 'maximalist', tags: ['rich', 'layered', 'dense', 'full'] },
  { id: 'retro', label: 'Ретро', value: 'retro', tags: ['retro', 'vintage', 'nostalgic', '80s'] },
  { id: 'futuristic', label: 'Футуристичный', value: 'futuristic', tags: ['futuristic', 'modern', 'sci-fi'] },
  { id: 'acoustic', label: 'Акустический', value: 'acoustic', tags: ['acoustic', 'unplugged', 'organic'] },
  { id: 'electronic2', label: 'Электронный', value: 'electronic', tags: ['electronic', 'digital', 'synthetic'] },
  { id: 'cinematic', label: 'Кинематографичный', value: 'cinematic', tags: ['cinematic', 'film score', 'dramatic'] },
  { id: 'experimental', label: 'Экспериментальный', value: 'experimental', tags: ['experimental', 'avant-garde', 'unique'] },
  { id: 'traditional', label: 'Традиционный', value: 'traditional', tags: ['traditional', 'classic', 'authentic'] },
  { id: 'underground', label: 'Андеграунд', value: 'underground', tags: ['underground', 'alternative', 'indie'] },
  { id: 'mainstream', label: 'Мейнстрим', value: 'mainstream', tags: ['mainstream', 'commercial', 'radio-friendly'] },
  { id: 'hybrid', label: 'Гибридный', value: 'hybrid', tags: ['hybrid', 'fusion', 'mixed genres'] },
];

// Быстрые миксы (Quick Presets) - 16 presets
export interface QuickMixPreset {
  id: string;
  label: string;
  emoji: string;
  genreA: string;
  genreB?: string;
  crossfader?: number; // -1 to 1, optional
  instruments: string[];
  mood: string;
  style: string;
  bpm?: number;
  density?: number;
  brightness?: number;
}

export const QUICK_MIX_PRESETS: QuickMixPreset[] = [
  { 
    id: 'lofi-chill', 
    label: 'Lo-Fi Chill', 
    emoji: '🎧',
    genreA: 'lofi', 
    instruments: ['piano', 'drums'], 
    mood: 'calm', 
    style: 'retro',
    bpm: 85,
    density: 0.4,
    brightness: 0.3
  },
  { 
    id: 'edm-banger', 
    label: 'EDM Banger', 
    emoji: '⚡',
    genreA: 'edm', 
    instruments: ['synth', 'drums', 'bass'], 
    mood: 'energetic', 
    style: 'maximalist',
    bpm: 128,
    density: 0.8,
    brightness: 0.7
  },
  { 
    id: 'cinematic-epic', 
    label: 'Кино Эпик', 
    emoji: '🎬',
    genreA: 'classical', 
    instruments: ['strings', 'brass', 'drums'], 
    mood: 'epic', 
    style: 'cinematic',
    bpm: 90,
    density: 0.7
  },
  { 
    id: 'dark-trap', 
    label: 'Dark Trap', 
    emoji: '🔥',
    genreA: 'trap', 
    instruments: ['bass', 'synth'], 
    mood: 'dark', 
    style: 'underground',
    bpm: 140,
    brightness: 0.2
  },
  { 
    id: 'ambient-dreams', 
    label: 'Ambient Dreams', 
    emoji: '🌊',
    genreA: 'ambient', 
    instruments: ['pads', 'bells'], 
    mood: 'dreamy', 
    style: 'minimalist',
    bpm: 70,
    density: 0.3,
    brightness: 0.4
  },
  { 
    id: 'power-rock', 
    label: 'Power Rock', 
    emoji: '🎸',
    genreA: 'rock', 
    instruments: ['guitar', 'drums', 'bass'], 
    mood: 'aggressive', 
    style: 'maximalist',
    bpm: 130,
    brightness: 0.6
  },
  { 
    id: 'smooth-jazz', 
    label: 'Smooth Jazz', 
    emoji: '🎷',
    genreA: 'jazz', 
    instruments: ['piano', 'sax', 'bass'], 
    mood: 'relaxed', 
    style: 'traditional',
    bpm: 95
  },
  { 
    id: 'synthwave-retro', 
    label: 'Synthwave', 
    emoji: '🌆',
    genreA: 'electronic', 
    instruments: ['synth', 'drums'], 
    mood: 'mysterious', 
    style: 'retro',
    bpm: 110,
    brightness: 0.5
  },
  { 
    id: 'orchestral-drama', 
    label: 'Оркестр', 
    emoji: '🎻',
    genreA: 'classical', 
    instruments: ['strings', 'brass', 'piano'], 
    mood: 'intense', 
    style: 'cinematic',
    bpm: 80
  },
  { 
    id: 'latin-groove', 
    label: 'Latin Groove', 
    emoji: '💃',
    genreA: 'latin', 
    instruments: ['drums', 'guitar', 'brass'], 
    mood: 'groovy', 
    style: 'traditional',
    bpm: 105
  },
  { 
    id: 'night-drive', 
    label: 'Night Drive', 
    emoji: '🌙',
    genreA: 'electronic', 
    genreB: 'ambient',
    crossfader: -0.3,
    instruments: ['synth', 'bass'], 
    mood: 'dark', 
    style: 'minimalist',
    bpm: 100,
    brightness: 0.3
  },
  { 
    id: 'upbeat-pop', 
    label: 'Upbeat Pop', 
    emoji: '☀️',
    genreA: 'pop', 
    instruments: ['synth', 'drums', 'vocals'], 
    mood: 'happy', 
    style: 'mainstream',
    bpm: 118
  },
  { 
    id: 'tropical-vibes', 
    label: 'Tropical', 
    emoji: '🏝️',
    genreA: 'reggae', 
    genreB: 'pop',
    crossfader: 0.2,
    instruments: ['guitar', 'drums'], 
    mood: 'relaxed', 
    style: 'acoustic',
    bpm: 95
  },
  { 
    id: 'piano-ballad', 
    label: 'Баллада', 
    emoji: '🎹',
    genreA: 'pop', 
    instruments: ['piano', 'strings'], 
    mood: 'romantic', 
    style: 'minimalist',
    bpm: 72,
    density: 0.4
  },
  { 
    id: 'future-bass', 
    label: 'Future Bass', 
    emoji: '🤖',
    genreA: 'edm', 
    genreB: 'hiphop',
    crossfader: 0.4,
    instruments: ['synth', 'bass', 'vocals'], 
    mood: 'energetic', 
    style: 'futuristic',
    bpm: 150
  },
  { 
    id: 'organic-acoustic', 
    label: 'Acoustic', 
    emoji: '🌿',
    genreA: 'country', 
    genreB: 'folk',
    crossfader: 0,
    instruments: ['guitar', 'piano'], 
    mood: 'calm', 
    style: 'acoustic',
    bpm: 90,
    brightness: 0.5
  },
];

// Темпо пресеты
export const TEMPO_PRESETS = [
  { id: 'slow', label: 'Медленный', bpm: [60, 80] },
  { id: 'medium', label: 'Средний', bpm: [80, 110] },
  { id: 'upbeat', label: 'Бодрый', bpm: [110, 130] },
  { id: 'fast', label: 'Быстрый', bpm: [130, 160] },
  { id: 'very-fast', label: 'Очень быстрый', bpm: [160, 180] },
];

// Тональности
export const KEY_OPTIONS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SCALE_OPTIONS = [
  { id: 'major', label: 'Мажор', value: 'major' },
  { id: 'minor', label: 'Минор', value: 'minor' },
  { id: 'dorian', label: 'Дорийский', value: 'dorian' },
  { id: 'mixolydian', label: 'Миксолидийский', value: 'mixolydian' },
  { id: 'pentatonic', label: 'Пентатоника', value: 'pentatonic' },
];

export const DURATION_OPTIONS = [
  { value: 10, label: '10 сек' },
  { value: 20, label: '20 сек' },
  { value: 30, label: '30 сек' },
];

// Build English prompt from channel settings
export function buildEnglishPrompt(
  genreA: PresetItem | null,
  genreB: PresetItem | null,
  crossfader: number, // -1 (full A) to 1 (full B)
  instruments: PresetItem[],
  mood: PresetItem | null,
  style: PresetItem | null,
  customText: string,
  globalSettings: {
    bpm?: number;
    key?: string;
    scale?: string;
    density?: number;
    brightness?: number;
  }
): string {
  const parts: string[] = [];

  // Genre mixing based on crossfader position
  if (genreA && genreB) {
    const aWeight = (1 - crossfader) / 2; // 0 to 1
    const bWeight = (1 + crossfader) / 2; // 0 to 1
    
    if (aWeight > 0.7) {
      parts.push(`${genreA.value}`);
      if (bWeight > 0.2) parts.push(`with ${genreB.value} influences`);
    } else if (bWeight > 0.7) {
      parts.push(`${genreB.value}`);
      if (aWeight > 0.2) parts.push(`with ${genreA.value} influences`);
    } else {
      parts.push(`${genreA.value} and ${genreB.value} fusion`);
    }
  } else if (genreA) {
    parts.push(genreA.value);
  } else if (genreB) {
    parts.push(genreB.value);
  }

  // Instruments (up to 4)
  if (instruments.length > 0) {
    const instrumentNames = instruments.slice(0, 4).map(i => i.value);
    parts.push(instrumentNames.join(', '));
  }

  // Mood
  if (mood) {
    parts.push(mood.value);
  }

  // Style
  if (style) {
    parts.push(`${style.value} style`);
  }

  // Custom text (already in English)
  if (customText.trim()) {
    parts.push(customText.trim());
  }

  // Global settings
  if (globalSettings.bpm) {
    parts.push(`${globalSettings.bpm} BPM`);
  }
  if (globalSettings.key && globalSettings.scale) {
    parts.push(`${globalSettings.key} ${globalSettings.scale}`);
  }
  if (globalSettings.density !== undefined) {
    if (globalSettings.density < 0.3) parts.push('sparse, minimal');
    else if (globalSettings.density > 0.7) parts.push('dense, layered');
  }
  if (globalSettings.brightness !== undefined) {
    if (globalSettings.brightness < 0.3) parts.push('warm, mellow');
    else if (globalSettings.brightness > 0.7) parts.push('bright, crisp');
  }

  return parts.filter(Boolean).join(', ');
}

// Helper to get preset by ID
export function getPresetById(presets: PresetItem[], id: string): PresetItem | undefined {
  return presets.find(p => p.id === id);
}

// Legacy function for backward compatibility with old usePromptDJ hook
export function buildPromptFromChannels(
  channels: Array<{
    type: string;
    value: string;
    weight: number;
    enabled: boolean;
  }>,
  globalSettings: {
    bpm?: number;
    key?: string;
    scale?: string;
    density?: number;
    brightness?: number;
  }
): string {
  const parts: string[] = [];

  channels.forEach(channel => {
    if (!channel.enabled || !channel.value) return;

    // Find matching preset for better tags
    const preset = 
      channel.type === 'genre' ? GENRE_PRESETS.find(p => p.id === channel.value || p.value === channel.value) :
      channel.type === 'instrument' || channel.type === 'instrument1' || channel.type === 'instrument2' 
        ? INSTRUMENT_PRESETS.find(p => p.id === channel.value || p.value === channel.value) :
      channel.type === 'mood' ? MOOD_PRESETS.find(p => p.id === channel.value || p.value === channel.value) :
      null;

    if (preset) {
      // Apply weight by emphasis
      const emphasis = channel.weight > 1.5 ? 'very ' : channel.weight > 0.8 ? '' : 'subtle ';
      parts.push(`${emphasis}${preset.value}`);
    } else if (channel.type === 'custom' && channel.value) {
      parts.push(channel.value);
    } else if (channel.value) {
      parts.push(channel.value.toLowerCase());
    }
  });

  // Add global settings
  if (globalSettings.bpm) {
    parts.push(`${globalSettings.bpm} BPM`);
  }
  if (globalSettings.key && globalSettings.scale) {
    parts.push(`${globalSettings.key} ${globalSettings.scale}`);
  }
  if (globalSettings.density !== undefined) {
    if (globalSettings.density < 0.3) parts.push('sparse, minimal');
    else if (globalSettings.density > 0.7) parts.push('dense, layered');
  }
  if (globalSettings.brightness !== undefined) {
    if (globalSettings.brightness < 0.3) parts.push('warm, mellow');
    else if (globalSettings.brightness > 0.7) parts.push('bright, crisp');
  }

  return parts.join(', ');
}
