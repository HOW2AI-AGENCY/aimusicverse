// PromptDJ Presets - genres, instruments, moods, and styles

export const GENRE_PRESETS = [
  { id: 'electronic', label: 'Electronic', tags: ['electronic', 'synth', 'digital'] },
  { id: 'hiphop', label: 'Hip-Hop', tags: ['hip-hop', 'rap', 'beats', 'trap'] },
  { id: 'rock', label: 'Rock', tags: ['rock', 'guitar', 'drums', 'electric'] },
  { id: 'jazz', label: 'Jazz', tags: ['jazz', 'swing', 'improvisation', 'smooth'] },
  { id: 'classical', label: 'Classical', tags: ['classical', 'orchestral', 'symphony'] },
  { id: 'pop', label: 'Pop', tags: ['pop', 'catchy', 'mainstream', 'radio'] },
  { id: 'ambient', label: 'Ambient', tags: ['ambient', 'atmospheric', 'drone', 'ethereal'] },
  { id: 'world', label: 'World', tags: ['world', 'ethnic', 'folk', 'traditional'] },
  { id: 'rnb', label: 'R&B', tags: ['r&b', 'soul', 'groove', 'smooth'] },
  { id: 'edm', label: 'EDM', tags: ['edm', 'dance', 'club', 'festival'] },
  { id: 'lofi', label: 'Lo-Fi', tags: ['lo-fi', 'chill', 'relaxed', 'vinyl'] },
  { id: 'metal', label: 'Metal', tags: ['metal', 'heavy', 'distorted', 'aggressive'] },
];

export const INSTRUMENT_PRESETS = [
  { id: 'piano', label: 'Piano', tags: ['piano', 'keys', 'grand piano'] },
  { id: 'guitar', label: 'Guitar', tags: ['guitar', 'acoustic guitar', 'electric guitar'] },
  { id: 'synth', label: 'Synthesizer', tags: ['synth', 'synthesizer', 'analog synth'] },
  { id: 'strings', label: 'Strings', tags: ['strings', 'violin', 'cello', 'orchestra'] },
  { id: 'brass', label: 'Brass', tags: ['brass', 'trumpet', 'saxophone', 'horns'] },
  { id: 'drums', label: 'Drums', tags: ['drums', 'percussion', 'beat', 'rhythm'] },
  { id: 'bass', label: 'Bass', tags: ['bass', 'bass guitar', 'sub bass', '808'] },
  { id: 'vocals', label: 'Vocals', tags: ['vocals', 'voice', 'singing', 'choir'] },
  { id: 'pads', label: 'Pads', tags: ['pads', 'ambient pads', 'atmospheric'] },
  { id: 'bells', label: 'Bells', tags: ['bells', 'chimes', 'glockenspiel', 'sparkle'] },
  { id: 'flute', label: 'Flute', tags: ['flute', 'woodwind', 'airy'] },
  { id: 'organ', label: 'Organ', tags: ['organ', 'church organ', 'hammond'] },
];

export const MOOD_PRESETS = [
  { id: 'energetic', label: 'Energetic', tags: ['energetic', 'upbeat', 'powerful', 'driving'] },
  { id: 'calm', label: 'Calm', tags: ['calm', 'peaceful', 'serene', 'tranquil'] },
  { id: 'dark', label: 'Dark', tags: ['dark', 'moody', 'ominous', 'mysterious'] },
  { id: 'happy', label: 'Happy', tags: ['happy', 'joyful', 'uplifting', 'cheerful'] },
  { id: 'melancholic', label: 'Melancholic', tags: ['melancholic', 'sad', 'emotional', 'nostalgic'] },
  { id: 'epic', label: 'Epic', tags: ['epic', 'cinematic', 'grand', 'heroic'] },
  { id: 'mysterious', label: 'Mysterious', tags: ['mysterious', 'enigmatic', 'suspenseful'] },
  { id: 'playful', label: 'Playful', tags: ['playful', 'fun', 'quirky', 'whimsical'] },
  { id: 'romantic', label: 'Romantic', tags: ['romantic', 'love', 'passionate', 'tender'] },
  { id: 'aggressive', label: 'Aggressive', tags: ['aggressive', 'intense', 'fierce', 'raw'] },
  { id: 'dreamy', label: 'Dreamy', tags: ['dreamy', 'floating', 'surreal', 'hazy'] },
  { id: 'groovy', label: 'Groovy', tags: ['groovy', 'funky', 'rhythmic', 'danceable'] },
];

export const TEMPO_PRESETS = [
  { id: 'slow', label: 'Slow', bpm: [60, 80] },
  { id: 'medium', label: 'Medium', bpm: [80, 110] },
  { id: 'upbeat', label: 'Upbeat', bpm: [110, 130] },
  { id: 'fast', label: 'Fast', bpm: [130, 160] },
  { id: 'very-fast', label: 'Very Fast', bpm: [160, 180] },
];

export const KEY_OPTIONS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

export const SCALE_OPTIONS = [
  { id: 'major', label: 'Major' },
  { id: 'minor', label: 'Minor' },
  { id: 'dorian', label: 'Dorian' },
  { id: 'mixolydian', label: 'Mixolydian' },
  { id: 'pentatonic', label: 'Pentatonic' },
];

export const DURATION_OPTIONS = [
  { value: 15, label: '15 сек' },
  { value: 30, label: '30 сек' },
  { value: 60, label: '60 сек' },
];

// Build weighted prompt from channel settings
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

    const preset = 
      channel.type === 'genre' ? GENRE_PRESETS.find(p => p.id === channel.value) :
      channel.type === 'instrument' ? INSTRUMENT_PRESETS.find(p => p.id === channel.value) :
      channel.type === 'mood' ? MOOD_PRESETS.find(p => p.id === channel.value) :
      null;

    if (preset) {
      // Apply weight by repeating key tags
      const weightedTags = channel.weight > 1 
        ? preset.tags.slice(0, Math.ceil(preset.tags.length * channel.weight))
        : preset.tags.slice(0, Math.max(1, Math.floor(preset.tags.length * channel.weight)));
      parts.push(weightedTags.join(', '));
    } else if (channel.type === 'custom' && channel.value) {
      parts.push(channel.value);
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
