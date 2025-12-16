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

// TR-808 Kit
const kit808: DrumKit = {
  id: '808',
  name: 'TR-808',
  description: 'Классический аналоговый звук',
  icon: '🔴',
  sounds: [
    { id: 'kick', name: 'Kick', shortName: 'KK', color: 'hsl(var(--destructive))', type: 'membrane', params: { pitchDecay: 0.05, octaves: 6, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 } } },
    { id: 'snare', name: 'Snare', shortName: 'SN', color: 'hsl(var(--primary))', type: 'noise', params: { noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 } } },
    { id: 'clap', name: 'Clap', shortName: 'CP', color: 'hsl(var(--accent))', type: 'noise', params: { noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.15 } } },
    { id: 'hihat-c', name: 'Hi-Hat Closed', shortName: 'CH', color: 'hsl(var(--muted-foreground))', type: 'metal', params: { frequency: 400, envelope: { attack: 0.001, decay: 0.05, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 } },
    { id: 'hihat-o', name: 'Hi-Hat Open', shortName: 'OH', color: 'hsl(var(--muted-foreground))', type: 'metal', params: { frequency: 400, envelope: { attack: 0.001, decay: 0.3, release: 0.1 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 } },
    { id: 'tom-l', name: 'Tom Low', shortName: 'LT', color: 'hsl(var(--warning))', type: 'membrane', params: { pitchDecay: 0.05, octaves: 4, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.5 } } },
    { id: 'tom-h', name: 'Tom High', shortName: 'HT', color: 'hsl(var(--warning))', type: 'membrane', params: { pitchDecay: 0.05, octaves: 6, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.3 } } },
    { id: 'cowbell', name: 'Cowbell', shortName: 'CB', color: 'hsl(var(--secondary))', type: 'metal', params: { frequency: 800, envelope: { attack: 0.001, decay: 0.1, release: 0.05 }, harmonicity: 2, modulationIndex: 4, resonance: 1000, octaves: 0.5 } },
  ]
};

// TR-909 Kit
const kit909: DrumKit = {
  id: '909',
  name: 'TR-909',
  description: 'Техно и хаус классика',
  icon: '🟡',
  sounds: [
    { id: 'kick', name: 'Kick', shortName: 'KK', color: 'hsl(var(--destructive))', type: 'membrane', params: { pitchDecay: 0.08, octaves: 8, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 1.2 } } },
    { id: 'snare', name: 'Snare', shortName: 'SN', color: 'hsl(var(--primary))', type: 'noise', params: { noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.25, sustain: 0.02, release: 0.25 } } },
    { id: 'clap', name: 'Clap', shortName: 'CP', color: 'hsl(var(--accent))', type: 'noise', params: { noise: { type: 'pink' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 } } },
    { id: 'hihat-c', name: 'Hi-Hat Closed', shortName: 'CH', color: 'hsl(var(--muted-foreground))', type: 'metal', params: { frequency: 500, envelope: { attack: 0.001, decay: 0.04, release: 0.01 }, harmonicity: 6, modulationIndex: 40, resonance: 5000, octaves: 2 } },
    { id: 'hihat-o', name: 'Hi-Hat Open', shortName: 'OH', color: 'hsl(var(--muted-foreground))', type: 'metal', params: { frequency: 500, envelope: { attack: 0.001, decay: 0.4, release: 0.15 }, harmonicity: 6, modulationIndex: 40, resonance: 5000, octaves: 2 } },
    { id: 'tom-l', name: 'Tom Low', shortName: 'LT', color: 'hsl(var(--warning))', type: 'membrane', params: { pitchDecay: 0.06, octaves: 5, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.4 } } },
    { id: 'tom-h', name: 'Tom High', shortName: 'HT', color: 'hsl(var(--warning))', type: 'membrane', params: { pitchDecay: 0.04, octaves: 7, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.3 } } },
    { id: 'ride', name: 'Ride', shortName: 'RD', color: 'hsl(var(--secondary))', type: 'metal', params: { frequency: 300, envelope: { attack: 0.001, decay: 0.8, release: 0.3 }, harmonicity: 3, modulationIndex: 20, resonance: 2000, octaves: 1 } },
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

// Trap Kit
const kitTrap: DrumKit = {
  id: 'trap',
  name: 'Trap',
  description: 'Современный хип-хоп',
  icon: '🔥',
  sounds: [
    { id: 'kick', name: '808 Kick', shortName: '8K', color: 'hsl(var(--destructive))', type: 'membrane', params: { pitchDecay: 0.15, octaves: 8, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.8, sustain: 0.1, release: 2 } } },
    { id: 'snare', name: 'Snare', shortName: 'SN', color: 'hsl(var(--primary))', type: 'noise', params: { noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.18 } } },
    { id: 'clap', name: 'Clap', shortName: 'CP', color: 'hsl(var(--accent))', type: 'noise', params: { noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.12 } } },
    { id: 'hihat-c', name: 'Hi-Hat', shortName: 'HH', color: 'hsl(var(--muted-foreground))', type: 'metal', params: { frequency: 550, envelope: { attack: 0.001, decay: 0.03, release: 0.01 }, harmonicity: 7, modulationIndex: 50, resonance: 6000, octaves: 2.5 } },
    { id: 'hihat-o', name: 'Open Hat', shortName: 'OH', color: 'hsl(var(--muted-foreground))', type: 'metal', params: { frequency: 550, envelope: { attack: 0.001, decay: 0.2, release: 0.08 }, harmonicity: 7, modulationIndex: 50, resonance: 6000, octaves: 2.5 } },
    { id: 'perc1', name: 'Snap', shortName: 'SP', color: 'hsl(var(--warning))', type: 'synth', params: { oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.04 } } },
    { id: 'perc2', name: 'Rim', shortName: 'RM', color: 'hsl(var(--warning))', type: 'synth', params: { oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.03 } } },
    { id: '808bass', name: '808 Bass', shortName: '8B', color: 'hsl(var(--secondary))', type: 'membrane', params: { pitchDecay: 0.3, octaves: 6, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 1.5, sustain: 0.2, release: 2.5 } } },
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
];
