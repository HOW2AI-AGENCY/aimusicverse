/**
 * usePromptDJ - Shared types, constants, and defaults
 */

// Tone.js types - loaded dynamically to prevent "Cannot access 't' before initialization" error
export type ToneType = typeof import("tone");
export type PlayerType = import("tone").Player;
export type PolySynthType = import("tone").PolySynth;
export type SequenceType = import("tone").Sequence;
export type AnalyserType = import("tone").Analyser;
export type ReverbType = import("tone").Reverb;
export type FilterType = import("tone").Filter;
export type FeedbackDelayType = import("tone").FeedbackDelay;
export type GainType = import("tone").Gain;

// Cached Tone module reference (shared across hooks)
export let ToneModule: ToneType | null = null;
export function setToneModule(mod: ToneType) {
  ToneModule = mod;
}
export async function ensureToneModule(): Promise<ToneType> {
  if (!ToneModule) {
    ToneModule = await import("tone");
  }
  return ToneModule;
}

// Available channel types that users can choose from
export const CHANNEL_TYPES = [
  {
    type: "genre",
    label: "Жанр",
    color: "#a855f7",
    presets: [
      "Electronic",
      "Hip-Hop",
      "Rock",
      "Jazz",
      "Pop",
      "Ambient",
      "Lo-Fi",
      "EDM",
      "Classical",
      "Trap",
      "R&B",
      "House",
    ],
  },
  {
    type: "instrument",
    label: "Инструмент",
    color: "#3b82f6",
    presets: [
      "Piano",
      "Guitar",
      "Synth",
      "Strings",
      "Bass",
      "Drums",
      "Pads",
      "Brass",
      "Bells",
      "Choir",
      "Violin",
      "Sax",
    ],
  },
  {
    type: "mood",
    label: "Настроение",
    color: "#ec4899",
    presets: [
      "Energetic",
      "Calm",
      "Dark",
      "Happy",
      "Epic",
      "Dreamy",
      "Aggressive",
      "Romantic",
      "Mysterious",
      "Groovy",
      "Sad",
      "Uplifting",
    ],
  },
  {
    type: "energy",
    label: "Энергия",
    color: "#ef4444",
    presets: [
      "Low",
      "Medium",
      "High",
      "Building",
      "Dropping",
      "Intense",
      "Relaxed",
      "Driving",
      "Floating",
      "Explosive",
    ],
  },
  {
    type: "texture",
    label: "Текстура",
    color: "#f59e0b",
    presets: ["Smooth", "Gritty", "Airy", "Dense", "Sparse", "Layered", "Vintage", "Modern", "Organic", "Digital"],
  },
  {
    type: "style",
    label: "Стиль",
    color: "#22c55e",
    presets: ["Minimalist", "Maximalist", "Retro", "Futuristic", "Cinematic", "Experimental", "Acoustic", "Synthwave"],
  },
  {
    type: "vocal",
    label: "Вокал",
    color: "#06b6d4",
    presets: ["Male", "Female", "Choir", "Whisper", "Powerful", "Soft", "Rap", "Falsetto", "No vocals"],
  },
  {
    type: "tempo",
    label: "Темп",
    color: "#8b5cf6",
    presets: ["Slow", "Medium", "Fast", "Accelerating", "Decelerating", "Steady", "Varying", "Groove"],
  },
  {
    type: "custom",
    label: "Своё",
    color: "#64748b",
    presets: [],
  },
] as const;

export type ChannelType = (typeof CHANNEL_TYPES)[number]["type"];

export interface PromptChannel {
  id: string;
  type: ChannelType;
  value: string;
  weight: number; // 0-1
  enabled: boolean;
}

export interface GlobalSettings {
  bpm: number;
  key: string;
  scale: string;
  density: number;
  brightness: number;
  duration: number;
}

export interface GeneratedTrack {
  id: string;
  prompt: string;
  audioUrl: string;
  createdAt: Date;
}

// Default 9 channels (3x3 grid)
export const DEFAULT_CHANNELS: PromptChannel[] = [
  // Row 1
  { id: "ch1", type: "genre", value: "", weight: 0.5, enabled: true },
  { id: "ch2", type: "instrument", value: "", weight: 0.5, enabled: true },
  { id: "ch3", type: "mood", value: "", weight: 0.5, enabled: true },
  // Row 2
  { id: "ch4", type: "energy", value: "", weight: 0.5, enabled: true },
  { id: "ch5", type: "texture", value: "", weight: 0.3, enabled: false },
  { id: "ch6", type: "style", value: "", weight: 0.3, enabled: false },
  // Row 3
  { id: "ch7", type: "instrument", value: "", weight: 0.3, enabled: false },
  { id: "ch8", type: "vocal", value: "", weight: 0.3, enabled: false },
  { id: "ch9", type: "custom", value: "", weight: 0.3, enabled: false },
];

export const DEFAULT_SETTINGS: GlobalSettings = {
  bpm: 120,
  key: "C",
  scale: "minor",
  density: 0.5,
  brightness: 0.5,
  duration: 20,
};

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// URL cache for prompts (separate from buffer pool)
export const globalAudioCache = new Map<string, string>();
