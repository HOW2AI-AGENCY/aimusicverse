/**
 * Unified Audio Analysis Types
 * Single source of truth for all audio analysis data structures
 */

// ==========================================
// Analysis Types & Status
// ==========================================

export type AnalysisType =
  | "full" // Complete analysis (style + music theory + emotion)
  | "style" // Genre, mood, instruments, production
  | "music-theory" // Key, BPM, time signature, chords
  | "emotion" // Arousal, valence, energy
  | "transcription" // MIDI transcription
  | "beats" // Beat detection
  | "chords" // Chord recognition
  | "lyrics"; // Lyrics transcription

export type AnalysisStatus = "idle" | "pending" | "analyzing" | "completed" | "failed";

export type AnalysisProvider =
  | "flamingo" // Audio Flamingo 3 (Replicate)
  | "lovable-ai" // Lovable AI Gateway
  | "klangio" // Klangio API
  | "local"; // Browser-based analysis

// ==========================================
// Core Analysis Result Interface
// ==========================================

export interface UnifiedAnalysisResult {
  // Identification
  id?: string;
  trackId?: string;
  referenceId?: string;

  // Style analysis
  genre?: string;
  subgenres?: string[];
  mood?: string;
  emotions?: string[];
  styleDescription?: string;
  styleTags?: string[];

  // Music theory
  bpm?: number;
  key?: string;
  scale?: "major" | "minor" | "modal" | "unknown";
  timeSignature?: string;
  structure?: StructureInfo;

  // Instrumentation
  instruments?: string[];
  hasVocals?: boolean;
  vocalInfo?: VocalInfo;

  // Energy & emotion
  energy?: EnergyInfo;
  arousal?: number; // 0-100
  valence?: number; // 0-100

  // Production
  production?: ProductionInfo;

  // Beats & chords (from Klangio)
  beats?: BeatData[];
  downbeats?: number[];
  chords?: ChordData[];

  // Transcription (from Klangio)
  notes?: NoteData[];
  midiUrl?: string;
  midiQuantUrl?: string;
  pdfUrl?: string;
  musicXmlUrl?: string;
  gp5Url?: string;

  // Lyrics
  lyrics?: string;
  detectedLanguage?: string;

  // Metadata
  provider?: AnalysisProvider;
  analyzedAt?: string;
  durationMs?: number;
  confidence?: number;
  rawResponse?: unknown;
}

// ==========================================
// Sub-interfaces
// ==========================================

export interface StructureInfo {
  sections?: string[];
  hasIntro?: boolean;
  hasOutro?: boolean;
  hasBridge?: boolean;
  hasChorus?: boolean;
  hasVerse?: boolean;
}

export interface VocalInfo {
  present: boolean;
  gender?: "male" | "female" | "mixed" | "unknown" | null;
  style?: string | null;
  language?: string | null;
}

export interface EnergyInfo {
  level: "low" | "medium" | "high";
  arousal: number; // 0-100
  valence: number; // 0-100
}

export interface ProductionInfo {
  style?: string;
  quality?: "lo-fi" | "standard" | "polished" | "professional";
  era?: string;
  techniques?: string[];
}

export interface BeatData {
  time: number; // seconds
  confidence?: number;
}

export interface ChordData {
  chord: string;
  startTime: number;
  endTime: number;
  confidence?: number;
}

export interface NoteData {
  pitch: number; // MIDI pitch (0-127)
  startTime: number; // seconds
  endTime: number; // seconds
  velocity: number; // 0-127
  noteName?: string; // e.g., "C4", "A#3"
}

// ==========================================
// Analysis Request Interface
// ==========================================

export interface AnalysisRequest {
  // Source (one of these required)
  audioUrl?: string;
  audioFile?: File;
  trackId?: string;
  referenceId?: string;

  // What to analyze
  analysisTypes: AnalysisType[];

  // Options
  provider?: AnalysisProvider; // Auto-select if not specified
  customPrompt?: string; // For AI analysis
  vocabulary?: "major-minor" | "full"; // For chord analysis
  model?: string; // For transcription
  stemType?: string; // For intelligent model selection

  // Context
  userId?: string;
  title?: string;

  // Callbacks
  onProgress?: (status: AnalysisStatus, message?: string) => void;
}

// ==========================================
// Analysis State (for hooks)
// ==========================================

export interface AnalysisState {
  status: AnalysisStatus;
  result: UnifiedAnalysisResult | null;
  error: string | null;
  progress?: number; // 0-100
  currentStep?: string;
}

// ==========================================
// Provider Capabilities
// ==========================================

export const PROVIDER_CAPABILITIES: Record<AnalysisProvider, AnalysisType[]> = {
  flamingo: ["full", "style", "music-theory", "emotion"],
  "lovable-ai": ["style", "emotion"],
  klangio: ["transcription", "beats", "chords"],
  local: ["music-theory", "beats"],
};

// ==========================================
// Default Providers
// ==========================================

export const DEFAULT_PROVIDER_FOR_TYPE: Record<AnalysisType, AnalysisProvider> = {
  full: "flamingo",
  style: "flamingo",
  "music-theory": "flamingo",
  emotion: "lovable-ai",
  transcription: "klangio",
  beats: "klangio",
  chords: "klangio",
  lyrics: "lovable-ai",
};
