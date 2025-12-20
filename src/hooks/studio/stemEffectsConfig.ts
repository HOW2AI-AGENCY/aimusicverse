/**
 * Stem Effects Configuration
 * 
 * Default values and presets for stem effects.
 * This file contains NO AudioContext code - safe to import anywhere.
 * 
 * Types are imported from types.ts to prevent circular dependencies.
 */

import type {
  EQSettings,
  CompressorSettings,
  ReverbSettings,
  StemEffects,
} from './types';

// Re-export types for convenience
export type { EQSettings, CompressorSettings, ReverbSettings, StemEffects };

export const defaultEQSettings: EQSettings = {
  lowGain: 0,
  midGain: 0,
  highGain: 0,
  lowFreq: 320,
  highFreq: 3200,
};

export const defaultCompressorSettings: CompressorSettings = {
  threshold: -24,
  ratio: 4,
  attack: 0.003,
  release: 0.25,
  knee: 30,
  enabled: false,
};

export const defaultReverbSettings: ReverbSettings = {
  wetDry: 0.3,
  decay: 2,
  enabled: false,
};

export const defaultStemEffects: StemEffects = {
  eq: defaultEQSettings,
  compressor: defaultCompressorSettings,
  reverb: defaultReverbSettings,
};

// Effect presets
export const eqPresets = {
  flat: { lowGain: 0, midGain: 0, highGain: 0, lowFreq: 320, highFreq: 3200 },
  warm: { lowGain: 3, midGain: -1, highGain: -2, lowFreq: 320, highFreq: 3200 },
  bright: { lowGain: -2, midGain: 0, highGain: 4, lowFreq: 320, highFreq: 3200 },
  bass_boost: { lowGain: 6, midGain: 0, highGain: 0, lowFreq: 320, highFreq: 3200 },
  vocal_presence: { lowGain: -2, midGain: 3, highGain: 2, lowFreq: 320, highFreq: 3200 },
  scoop: { lowGain: 3, midGain: -4, highGain: 3, lowFreq: 320, highFreq: 3200 },
};

export const compressorPresets = {
  off: { ...defaultCompressorSettings, enabled: false },
  gentle: { threshold: -20, ratio: 2, attack: 0.01, release: 0.3, knee: 30, enabled: true },
  moderate: { threshold: -24, ratio: 4, attack: 0.003, release: 0.25, knee: 20, enabled: true },
  heavy: { threshold: -30, ratio: 8, attack: 0.001, release: 0.1, knee: 10, enabled: true },
  vocals: { threshold: -18, ratio: 3, attack: 0.005, release: 0.2, knee: 25, enabled: true },
  drums: { threshold: -20, ratio: 6, attack: 0.001, release: 0.15, knee: 15, enabled: true },
};

export const reverbPresets = {
  off: { wetDry: 0, decay: 2, enabled: false },
  room: { wetDry: 0.2, decay: 0.8, enabled: true },
  hall: { wetDry: 0.35, decay: 2.5, enabled: true },
  plate: { wetDry: 0.4, decay: 1.5, enabled: true },
  ambient: { wetDry: 0.5, decay: 4, enabled: true },
  cathedral: { wetDry: 0.6, decay: 6, enabled: true },
};
