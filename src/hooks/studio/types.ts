/**
 * Stem Studio Types
 * 
 * Centralized type definitions for studio hooks.
 * This file contains NO runtime code - only types.
 * Safe to import anywhere without triggering AudioContext initialization.
 */

export interface EQSettings {
  lowGain: number;      // -12 to +12 dB
  midGain: number;      // -12 to +12 dB
  highGain: number;     // -12 to +12 dB
  lowFreq: number;      // Hz (default 320)
  highFreq: number;     // Hz (default 3200)
}

export interface CompressorSettings {
  threshold: number;    // -100 to 0 dB
  ratio: number;        // 1 to 20
  attack: number;       // 0 to 1 seconds
  release: number;      // 0 to 1 seconds
  knee: number;         // 0 to 40 dB
  enabled: boolean;
}

export interface ReverbSettings {
  wetDry: number;       // 0 to 1 (dry to wet)
  decay: number;        // 0.1 to 10 seconds
  enabled: boolean;
}

export interface DelaySettings {
  time: number;         // 0 to 1000 ms
  feedback: number;     // 0 to 1
  mix: number;          // 0 to 1
  sync: boolean;        // sync to tempo
  enabled: boolean;
}

export interface ChorusSettings {
  depth: number;        // 0 to 1
  speed: number;        // 0.1 to 10 Hz
  mix: number;          // 0 to 1
  enabled: boolean;
}

export interface FilterSettings {
  type: 'lowpass' | 'highpass' | 'bandpass';
  cutoff: number;       // 20 to 20000 Hz
  resonance: number;    // 0 to 30
  enabled: boolean;
}

export interface StemEffects {
  eq: EQSettings;
  compressor: CompressorSettings;
  reverb: ReverbSettings;
  delay?: DelaySettings;
  chorus?: ChorusSettings;
  filter?: FilterSettings;
}

export interface StemConfig {
  volume: number;
  muted: boolean;
  solo: boolean;
  effects: StemEffects;
}

export interface MixPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  masterVolume: number;
  stems: Record<string, StemConfig>;
}

export interface StemState {
  volume: number;
  muted: boolean;
  solo: boolean;
}

export interface LoopRegion {
  start: number;
  end: number;
  enabled: boolean;
}

export interface KeyboardShortcut {
  key: string;
  code?: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}
