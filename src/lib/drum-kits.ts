// Drum kit definitions with synthesized sounds via Tone.js
// Using Tone.js synths instead of external samples for reliability

export interface DrumSound {
  id: string;
  name: string;
  shortName: string;
  color: string;
  // Synth parameters for Tone.js
  type: 'membrane' | 'metal' | 'noise' | 'synth';
  params: Record<string, unknown>;
}

export interface DrumKit {
  id: string;
  name: string;
  description: string;
  icon: string;
  sounds: DrumSound[];
}

// TR-808 Kit - tuned for punchy, warm sound
const kit808: DrumKit = {
  id: '808',
  name: 'TR-808',
  description: 'Классический аналоговый звук',
  icon: '🔴',
  sounds: [
    { id: 'kick', name: 'Kick', shortName: 'KK', color: '#ef4444', type: 'membrane', params: { pitchDecay: 0.08, octaves: 10, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.6, sustain: 0, release: 1.0 } } },
    { id: 'snare', name: 'Snare', shortName: 'SN', color: '#3b82f6', type: 'noise', params: { noise: { type: 'white' }, envelope: { attack: 0.002, decay: 0.15, sustain: 0.02, release: 0.15 } } },
    { id: 'clap', name: 'Clap', shortName: 'CP', color: '#8b5cf6', type: 'noise', params: { noise: { type: 'pink' }, envelope: { attack: 0.003, decay: 0.12, sustain: 0, release: 0.12 } } },
    { id: 'hihat-c', name: 'Closed HH', shortName: 'CH', color: '#6b7280', type: 'metal', params: { frequency: 320, envelope: { attack: 0.001, decay: 0.04, release: 0.01 }, harmonicity: 5.1, modulationIndex: 40, resonance: 4000, octaves: 1.2 } },
    { id: 'hihat-o', name: 'Open HH', shortName: 'OH', color: '#9ca3af', type: 'metal', params: { frequency: 320, envelope: { attack: 0.001, decay: 0.25, release: 0.08 }, harmonicity: 5.1, modulationIndex: 40, resonance: 4000, octaves: 1.2 } },
    { id: 'tom-l', name: 'Low Tom', shortName: 'LT', color: '#f59e0b', type: 'membrane', params: { pitchDecay: 0.04, octaves: 5, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.4 } } },
    { id: 'tom-h', name: 'High Tom', shortName: 'HT', color: '#fbbf24', type: 'membrane', params: { pitchDecay: 0.03, octaves: 7, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.25 } } },
    { id: 'cowbell', name: 'Cowbell', shortName: 'CB', color: '#10b981', type: 'metal', params: { frequency: 560, envelope: { attack: 0.001, decay: 0.08, release: 0.03 }, harmonicity: 2, modulationIndex: 8, resonance: 800, octaves: 0.4 } },
  ]
};

// TR-909 Kit - punchier, modern sound
const kit909: DrumKit = {
  id: '909',
  name: 'TR-909',
  description: 'Техно и хаус классика',
  icon: '🟡',
  sounds: [
    { id: 'kick', name: 'Kick', shortName: 'KK', color: '#ef4444', type: 'membrane', params: { pitchDecay: 0.1, octaves: 10, oscillator: { type: 'sine' }, envelope: { attack: 0.002, decay: 0.4, sustain: 0.01, release: 0.8 } } },
    { id: 'snare', name: 'Snare', shortName: 'SN', color: '#3b82f6', type: 'noise', params: { noise: { type: 'white' }, envelope: { attack: 0.002, decay: 0.2, sustain: 0.01, release: 0.18 } } },
    { id: 'clap', name: 'Clap', shortName: 'CP', color: '#8b5cf6', type: 'noise', params: { noise: { type: 'pink' }, envelope: { attack: 0.004, decay: 0.08, sustain: 0, release: 0.08 } } },
    { id: 'hihat-c', name: 'Closed HH', shortName: 'CH', color: '#6b7280', type: 'metal', params: { frequency: 400, envelope: { attack: 0.001, decay: 0.035, release: 0.01 }, harmonicity: 5, modulationIndex: 35, resonance: 4500, octaves: 1.5 } },
    { id: 'hihat-o', name: 'Open HH', shortName: 'OH', color: '#9ca3af', type: 'metal', params: { frequency: 400, envelope: { attack: 0.001, decay: 0.3, release: 0.12 }, harmonicity: 5, modulationIndex: 35, resonance: 4500, octaves: 1.5 } },
    { id: 'tom-l', name: 'Low Tom', shortName: 'LT', color: '#f59e0b', type: 'membrane', params: { pitchDecay: 0.05, octaves: 6, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.35 } } },
    { id: 'tom-h', name: 'High Tom', shortName: 'HT', color: '#fbbf24', type: 'membrane', params: { pitchDecay: 0.035, octaves: 8, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.25 } } },
    { id: 'ride', name: 'Ride', shortName: 'RD', color: '#10b981', type: 'metal', params: { frequency: 280, envelope: { attack: 0.001, decay: 0.6, release: 0.2 }, harmonicity: 3, modulationIndex: 15, resonance: 1800, octaves: 0.8 } },
  ]
};

// Acoustic Kit
const kitAcoustic: DrumKit = {
  id: 'acoustic',
  name: 'Acoustic',
  description: 'Реалистичные барабаны',
  icon: '🥁',
  sounds: [
    { id: 'kick', name: 'Kick', shortName: 'KK', color: 'hsl(var(--destructive))', type: 'membrane', params: { pitchDecay: 0.03, octaves: 5, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.3, sustain: 0.05, release: 0.8 } } },
    { id: 'snare', name: 'Snare', shortName: 'SN', color: 'hsl(var(--primary))', type: 'noise', params: { noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.15, sustain: 0.03, release: 0.2 } } },
    { id: 'rimshot', name: 'Rimshot', shortName: 'RS', color: 'hsl(var(--accent))', type: 'synth', params: { oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 } } },
    { id: 'hihat-c', name: 'Hi-Hat Closed', shortName: 'CH', color: 'hsl(var(--muted-foreground))', type: 'metal', params: { frequency: 450, envelope: { attack: 0.001, decay: 0.06, release: 0.02 }, harmonicity: 4, modulationIndex: 25, resonance: 3500, octaves: 1.2 } },
    { id: 'hihat-o', name: 'Hi-Hat Open', shortName: 'OH', color: 'hsl(var(--muted-foreground))', type: 'metal', params: { frequency: 450, envelope: { attack: 0.001, decay: 0.35, release: 0.1 }, harmonicity: 4, modulationIndex: 25, resonance: 3500, octaves: 1.2 } },
    { id: 'tom-l', name: 'Floor Tom', shortName: 'FT', color: 'hsl(var(--warning))', type: 'membrane', params: { pitchDecay: 0.04, octaves: 3, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.02, release: 0.6 } } },
    { id: 'tom-h', name: 'Rack Tom', shortName: 'RT', color: 'hsl(var(--warning))', type: 'membrane', params: { pitchDecay: 0.03, octaves: 5, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.4 } } },
    { id: 'crash', name: 'Crash', shortName: 'CR', color: 'hsl(var(--secondary))', type: 'metal', params: { frequency: 250, envelope: { attack: 0.001, decay: 1.2, release: 0.5 }, harmonicity: 5, modulationIndex: 35, resonance: 1500, octaves: 1.5 } },
  ]
};

// Lo-Fi Kit
const kitLoFi: DrumKit = {
  id: 'lofi',
  name: 'Lo-Fi',
  description: 'Тёплый винтажный звук',
  icon: '📻',
  sounds: [
    { id: 'kick', name: 'Kick', shortName: 'KK', color: 'hsl(var(--destructive))', type: 'membrane', params: { pitchDecay: 0.1, octaves: 4, oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.4, sustain: 0.02, release: 0.8 } } },
    { id: 'snare', name: 'Snare', shortName: 'SN', color: 'hsl(var(--primary))', type: 'noise', params: { noise: { type: 'brown' }, envelope: { attack: 0.002, decay: 0.2, sustain: 0.01, release: 0.3 } } },
    { id: 'shaker', name: 'Shaker', shortName: 'SH', color: 'hsl(var(--accent))', type: 'noise', params: { noise: { type: 'pink' }, envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.08 } } },
    { id: 'hihat-c', name: 'Hi-Hat', shortName: 'HH', color: 'hsl(var(--muted-foreground))', type: 'metal', params: { frequency: 350, envelope: { attack: 0.002, decay: 0.08, release: 0.03 }, harmonicity: 3, modulationIndex: 20, resonance: 2500, octaves: 0.8 } },
    { id: 'hihat-o', name: 'Hat Open', shortName: 'HO', color: 'hsl(var(--muted-foreground))', type: 'metal', params: { frequency: 350, envelope: { attack: 0.002, decay: 0.25, release: 0.1 }, harmonicity: 3, modulationIndex: 20, resonance: 2500, octaves: 0.8 } },
    { id: 'perc1', name: 'Vinyl Click', shortName: 'VC', color: 'hsl(var(--warning))', type: 'synth', params: { oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.02 } } },
    { id: 'perc2', name: 'Dust', shortName: 'DT', color: 'hsl(var(--warning))', type: 'noise', params: { noise: { type: 'brown' }, envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.03 } } },
    { id: 'bass', name: 'Sub', shortName: 'SB', color: 'hsl(var(--secondary))', type: 'membrane', params: { pitchDecay: 0.2, octaves: 2, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.6, sustain: 0.1, release: 1 } } },
  ]
};

// Trap Kit - deep 808s, crisp hats
const kitTrap: DrumKit = {
  id: 'trap',
  name: 'Trap',
  description: 'Современный хип-хоп',
  icon: '🔥',
  sounds: [
    { id: 'kick', name: '808 Kick', shortName: '8K', color: '#dc2626', type: 'membrane', params: { pitchDecay: 0.2, octaves: 10, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 1.0, sustain: 0.05, release: 1.5 } } },
    { id: 'snare', name: 'Snare', shortName: 'SN', color: '#3b82f6', type: 'noise', params: { noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.14, sustain: 0, release: 0.12 } } },
    { id: 'clap', name: 'Clap', shortName: 'CP', color: '#8b5cf6', type: 'noise', params: { noise: { type: 'white' }, envelope: { attack: 0.002, decay: 0.1, sustain: 0, release: 0.08 } } },
    { id: 'hihat-c', name: 'Hi-Hat', shortName: 'HH', color: '#6b7280', type: 'metal', params: { frequency: 480, envelope: { attack: 0.001, decay: 0.025, release: 0.008 }, harmonicity: 6, modulationIndex: 45, resonance: 5500, octaves: 2 } },
    { id: 'hihat-o', name: 'Open Hat', shortName: 'OH', color: '#9ca3af', type: 'metal', params: { frequency: 480, envelope: { attack: 0.001, decay: 0.18, release: 0.06 }, harmonicity: 6, modulationIndex: 45, resonance: 5500, octaves: 2 } },
    { id: 'perc1', name: 'Snap', shortName: 'SP', color: '#f59e0b', type: 'synth', params: { oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.03 } } },
    { id: 'perc2', name: 'Rim', shortName: 'RM', color: '#fbbf24', type: 'synth', params: { oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.02 } } },
    { id: '808bass', name: '808 Bass', shortName: '8B', color: '#10b981', type: 'membrane', params: { pitchDecay: 0.35, octaves: 8, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 1.2, sustain: 0.15, release: 2.0 } } },
  ]
};

// Ethnic Kit
const kitEthnic: DrumKit = {
  id: 'ethnic',
  name: 'World',
  description: 'Этническая перкуссия',
  icon: '🌍',
  sounds: [
    { id: 'djembe', name: 'Djembe', shortName: 'DJ', color: 'hsl(var(--destructive))', type: 'membrane', params: { pitchDecay: 0.02, octaves: 3, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.25, sustain: 0.02, release: 0.4 } } },
    { id: 'conga-h', name: 'Conga High', shortName: 'CH', color: 'hsl(var(--primary))', type: 'membrane', params: { pitchDecay: 0.015, octaves: 4, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.15, sustain: 0.01, release: 0.2 } } },
    { id: 'conga-l', name: 'Conga Low', shortName: 'CL', color: 'hsl(var(--accent))', type: 'membrane', params: { pitchDecay: 0.025, octaves: 2.5, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0.02, release: 0.3 } } },
    { id: 'shaker', name: 'Shaker', shortName: 'SK', color: 'hsl(var(--muted-foreground))', type: 'noise', params: { noise: { type: 'pink' }, envelope: { attack: 0.002, decay: 0.06, sustain: 0, release: 0.06 } } },
    { id: 'claves', name: 'Claves', shortName: 'CV', color: 'hsl(var(--muted-foreground))', type: 'synth', params: { oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.08 } } },
    { id: 'bongo-h', name: 'Bongo High', shortName: 'BH', color: 'hsl(var(--warning))', type: 'membrane', params: { pitchDecay: 0.01, octaves: 5, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.15 } } },
    { id: 'bongo-l', name: 'Bongo Low', shortName: 'BL', color: 'hsl(var(--warning))', type: 'membrane', params: { pitchDecay: 0.015, octaves: 3.5, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.12, sustain: 0.01, release: 0.18 } } },
    { id: 'tambourine', name: 'Tambourine', shortName: 'TB', color: 'hsl(var(--secondary))', type: 'metal', params: { frequency: 600, envelope: { attack: 0.001, decay: 0.15, release: 0.05 }, harmonicity: 8, modulationIndex: 15, resonance: 4000, octaves: 1 } },
  ]
};

export const drumKits: DrumKit[] = [kit808, kit909, kitAcoustic, kitLoFi, kitTrap, kitEthnic];

export const getKitById = (id: string): DrumKit | undefined => drumKits.find(k => k.id === id);

// Preset patterns
export interface DrumPattern {
  id: string;
  name: string;
  genre: string;
  bpm: number;
  steps: Record<string, boolean[]>; // soundId -> 16 steps
}

export const presetPatterns: DrumPattern[] = [
  // Original patterns
  {
    id: 'four-on-floor',
    name: 'Four on Floor',
    genre: 'House',
    bpm: 120,
    steps: {
      'kick': [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      'hihat-c': [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      'snare': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    }
  },
  {
    id: 'boom-bap',
    name: 'Boom Bap',
    genre: 'Hip-Hop',
    bpm: 90,
    steps: {
      'kick': [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false],
      'snare': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      'hihat-c': [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    }
  },
  {
    id: 'trap-beat',
    name: 'Trap',
    genre: 'Trap',
    bpm: 140,
    steps: {
      'kick': [true, false, false, false, false, false, false, true, false, false, true, false, false, false, false, false],
      'snare': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      'hihat-c': [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
    }
  },
  {
    id: 'dnb',
    name: 'Drum & Bass',
    genre: 'DnB',
    bpm: 174,
    steps: {
      'kick': [true, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false],
      'snare': [false, false, false, false, true, false, false, false, false, false, true, false, false, false, false, false],
      'hihat-c': [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    }
  },
  {
    id: 'reggaeton',
    name: 'Reggaeton',
    genre: 'Latin',
    bpm: 95,
    steps: {
      'kick': [true, false, false, true, false, false, true, false, true, false, false, true, false, false, true, false],
      'snare': [false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true],
      'hihat-c': [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    }
  },
  {
    id: 'afrobeat',
    name: 'Afrobeat',
    genre: 'Afro',
    bpm: 105,
    steps: {
      'djembe': [true, false, false, true, false, true, false, false, true, false, false, true, false, true, false, false],
      'conga-h': [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      'shaker': [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
    }
  },
  // NEW PATTERNS
  {
    id: 'disco',
    name: 'Disco',
    genre: 'Disco',
    bpm: 118,
    steps: {
      'kick': [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      'snare': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      'hihat-c': [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      'hihat-o': [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
    }
  },
  {
    id: 'funk',
    name: 'Funk',
    genre: 'Funk',
    bpm: 100,
    steps: {
      'kick': [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, false],
      'snare': [false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, false],
      'hihat-c': [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      'clap': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false],
    }
  },
  {
    id: 'rnb',
    name: 'R&B',
    genre: 'R&B',
    bpm: 85,
    steps: {
      'kick': [true, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false],
      'snare': [false, false, false, false, true, false, false, false, false, false, false, true, false, false, true, false],
      'hihat-c': [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      'hihat-o': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true],
    }
  },
  {
    id: 'techno',
    name: 'Techno',
    genre: 'Techno',
    bpm: 135,
    steps: {
      'kick': [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      'clap': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      'hihat-c': [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      'hihat-o': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true],
      'tom-l': [false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false],
    }
  },
  {
    id: 'breakbeat',
    name: 'Breakbeat',
    genre: 'Breaks',
    bpm: 130,
    steps: {
      'kick': [true, false, false, false, false, false, true, false, false, true, false, false, false, false, true, false],
      'snare': [false, false, false, false, true, false, false, false, false, false, true, false, true, false, false, false],
      'hihat-c': [true, true, false, true, true, false, true, true, false, true, true, false, true, true, false, true],
      'hihat-o': [false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false],
    }
  },
  {
    id: 'latin',
    name: 'Salsa',
    genre: 'Latin',
    bpm: 95,
    steps: {
      'conga-h': [false, false, true, false, true, false, false, true, false, false, true, false, true, false, false, true],
      'conga-l': [true, false, false, false, false, true, false, false, true, false, false, false, false, true, false, false],
      'claves': [true, false, false, true, false, false, true, false, false, false, true, false, true, false, false, false],
      'bongo-h': [false, true, false, false, true, false, true, false, false, true, false, false, true, false, true, false],
      'shaker': [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
    }
  },
];
