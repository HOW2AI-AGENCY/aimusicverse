/**
 * Mix Presets Configuration
 * Pre-defined mixing configurations for common use cases
 */

import type { StemEffects } from "./types";

export interface StemMixSettings {
  volume: number;
  pan?: number;
  muted?: boolean;
  effects?: Partial<StemEffects>;
}

export interface MixPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  stems: Record<string, StemMixSettings>;
  masterVolume?: number;
}

/**
 * Built-in mix presets
 */
export const MIX_PRESETS: MixPreset[] = [
  {
    id: "balanced",
    name: "Сбалансированный",
    description: "Все инструменты слышны равномерно",
    icon: "⚖️",
    stems: {
      vocal: { volume: 0.85, effects: { eq: { lowGain: -2, midGain: 2, highGain: 1, lowFreq: 320, highFreq: 3200 } } },
      instrumental: { volume: 0.75 },
      drums: { volume: 0.7 },
      bass: { volume: 0.65 },
      guitar: { volume: 0.7 },
      piano: { volume: 0.65 },
      other: { volume: 0.6 },
    },
    masterVolume: 0.85,
  },
  {
    id: "vocal_focus",
    name: "Акцент на вокал",
    description: "Вокал на переднем плане, инструменты приглушены",
    icon: "🎤",
    stems: {
      vocal: {
        volume: 1.0,
        effects: {
          eq: { lowGain: -3, midGain: 3, highGain: 2, lowFreq: 300, highFreq: 4000 },
          compressor: { threshold: -20, ratio: 3, attack: 0.005, release: 0.2, knee: 20, enabled: true },
        },
      },
      instrumental: { volume: 0.45 },
      drums: { volume: 0.4 },
      bass: { volume: 0.35 },
      guitar: { volume: 0.4 },
      piano: { volume: 0.35 },
      other: { volume: 0.3 },
    },
    masterVolume: 0.9,
  },
  {
    id: "instrumental_focus",
    name: "Инструментал",
    description: "Вокал приглушён, акцент на музыке",
    icon: "🎸",
    stems: {
      vocal: { volume: 0.25 },
      instrumental: { volume: 0.9 },
      drums: { volume: 0.85 },
      bass: { volume: 0.8 },
      guitar: { volume: 0.85 },
      piano: { volume: 0.75 },
      other: { volume: 0.7 },
    },
    masterVolume: 0.85,
  },
  {
    id: "karaoke",
    name: "Караоке",
    description: "Вокал полностью выключен",
    icon: "🎶",
    stems: {
      vocal: { volume: 0, muted: true },
      instrumental: { volume: 0.85 },
      drums: { volume: 0.8 },
      bass: { volume: 0.75 },
      guitar: { volume: 0.8 },
      piano: { volume: 0.7 },
      other: { volume: 0.65 },
    },
    masterVolume: 0.9,
  },
  {
    id: "drums_focus",
    name: "Акцент на ударных",
    description: "Ударные и бас на переднем плане",
    icon: "🥁",
    stems: {
      vocal: { volume: 0.5 },
      instrumental: { volume: 0.55 },
      drums: {
        volume: 1.0,
        effects: {
          compressor: { threshold: -18, ratio: 4, attack: 0.001, release: 0.1, knee: 10, enabled: true },
        },
      },
      bass: {
        volume: 0.9,
        effects: {
          eq: { lowGain: 4, midGain: 0, highGain: -2, lowFreq: 100, highFreq: 2000 },
        },
      },
      guitar: { volume: 0.5 },
      piano: { volume: 0.45 },
      other: { volume: 0.4 },
    },
    masterVolume: 0.85,
  },
  {
    id: "lo_fi",
    name: "Lo-Fi",
    description: "Тёплое ретро звучание",
    icon: "📻",
    stems: {
      vocal: {
        volume: 0.7,
        effects: {
          eq: { lowGain: 2, midGain: -1, highGain: -4, lowFreq: 400, highFreq: 4000 },
          filter: { type: "lowpass", cutoff: 8000, resonance: 1, enabled: true },
        },
      },
      instrumental: {
        volume: 0.75,
        effects: {
          filter: { type: "lowpass", cutoff: 10000, resonance: 0.7, enabled: true },
        },
      },
      drums: {
        volume: 0.65,
        effects: {
          compressor: { threshold: -15, ratio: 6, attack: 0.01, release: 0.3, knee: 20, enabled: true },
        },
      },
      bass: { volume: 0.7 },
      guitar: { volume: 0.65 },
      piano: { volume: 0.6 },
      other: { volume: 0.55 },
    },
    masterVolume: 0.8,
  },
  {
    id: "club",
    name: "Клубный",
    description: "Громкий бас и чёткие ударные",
    icon: "🔊",
    stems: {
      vocal: {
        volume: 0.75,
        effects: {
          compressor: { threshold: -12, ratio: 5, attack: 0.002, release: 0.15, knee: 15, enabled: true },
        },
      },
      instrumental: { volume: 0.7 },
      drums: {
        volume: 0.95,
        effects: {
          compressor: { threshold: -10, ratio: 6, attack: 0.001, release: 0.05, knee: 5, enabled: true },
        },
      },
      bass: {
        volume: 1.0,
        effects: {
          eq: { lowGain: 6, midGain: -2, highGain: -3, lowFreq: 80, highFreq: 1500 },
        },
      },
      guitar: { volume: 0.6 },
      piano: { volume: 0.55 },
      other: { volume: 0.5 },
    },
    masterVolume: 0.95,
  },
  {
    id: "ambient",
    name: "Атмосферный",
    description: "Мягкое звучание с реверберацией",
    icon: "🌌",
    stems: {
      vocal: {
        volume: 0.6,
        effects: {
          reverb: { wetDry: 0.4, decay: 2.5, enabled: true },
          delay: { time: 350, feedback: 0.25, mix: 0.2, sync: false, enabled: true },
        },
      },
      instrumental: {
        volume: 0.65,
        effects: {
          reverb: { wetDry: 0.35, decay: 2.0, enabled: true },
        },
      },
      drums: { volume: 0.5 },
      bass: { volume: 0.55 },
      guitar: {
        volume: 0.6,
        effects: {
          delay: { time: 500, feedback: 0.35, mix: 0.3, sync: false, enabled: true },
        },
      },
      piano: {
        volume: 0.65,
        effects: {
          reverb: { wetDry: 0.45, decay: 3.0, enabled: true },
        },
      },
      other: { volume: 0.5 },
    },
    masterVolume: 0.75,
  },
];

/**
 * Get preset by ID
 */
export function getMixPreset(presetId: string): MixPreset | undefined {
  return MIX_PRESETS.find((p) => p.id === presetId);
}

/**
 * Get settings for a specific stem type from a preset
 */
export function getPresetStemSettings(preset: MixPreset, stemType: string): StemMixSettings {
  // Try direct match
  if (preset.stems[stemType]) {
    return preset.stems[stemType];
  }

  // Fallback mappings
  const fallbackMap: Record<string, string[]> = {
    main: ["instrumental", "other"],
    stem: ["other"],
    sfx: ["other"],
    keys: ["piano"],
    synth: ["piano", "other"],
    strings: ["other"],
    brass: ["other"],
  };

  const fallbacks = fallbackMap[stemType] || ["other"];
  for (const fb of fallbacks) {
    if (preset.stems[fb]) {
      return preset.stems[fb];
    }
  }

  // Default
  return { volume: 0.7 };
}
