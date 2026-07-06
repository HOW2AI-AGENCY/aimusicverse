/**
 * Audio analysis provider normalizers and mapping functions
 * Extracted from AudioAnalysisService.ts — Sprint 051 T056
 */

import type {
  AnalysisType,
  AnalysisProvider,
  UnifiedAnalysisResult,
  VocalInfo,
  EnergyInfo,
  ProductionInfo,
} from "./types";

export function getDefaultProvider(type: AnalysisType): AnalysisProvider {
  const defaults: Record<AnalysisType, AnalysisProvider> = {
    full: "flamingo",
    style: "flamingo",
    "music-theory": "flamingo",
    emotion: "lovable-ai",
    transcription: "klangio",
    beats: "klangio",
    chords: "klangio",
    lyrics: "lovable-ai",
  };
  return defaults[type] || "flamingo";
}

export function mapTypeToLovableAI(type: AnalysisType): string {
  const mapping: Record<AnalysisType, string> = {
    full: "general",
    style: "general",
    "music-theory": "bpm",
    emotion: "emotion",
    transcription: "general",
    beats: "bpm",
    chords: "general",
    lyrics: "general",
  };
  return mapping[type] || "general";
}

export function mapTypeToKlangioMode(
  type: AnalysisType,
): "transcription" | "chord-recognition" | "beat-tracking" | null {
  const mapping: Record<string, "transcription" | "chord-recognition" | "beat-tracking" | null> = {
    transcription: "transcription",
    beats: "beat-tracking",
    chords: "chord-recognition",
  };
  return mapping[type] || null;
}

export function mergeResults(results: UnifiedAnalysisResult[]): UnifiedAnalysisResult {
  const merged: UnifiedAnalysisResult = {};

  for (const result of results) {
    Object.entries(result).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        Object.assign(merged, { [key]: value });
      }
    });
  }

  merged.analyzedAt = new Date().toISOString();
  return merged;
}

export function normalizeFlamingoResult(data: Record<string, unknown>): UnifiedAnalysisResult {
  type FlamingoShape = {
    genre?: string;
    subgenres?: string[];
    mood?: string;
    emotions?: string[];
    bpm?: number;
    key?: string;
    scale?: "unknown" | "major" | "minor" | "modal";
    time_signature?: string;
    instruments?: string[];
    vocals?: VocalInfo;
    structure?: {
      sections?: string[];
      has_intro?: boolean;
      has_outro?: boolean;
      has_bridge?: boolean;
    };
    energy?: EnergyInfo;
    production?: ProductionInfo;
    style_prompt?: string;
    tags?: string[];
  };
  const d = data as FlamingoShape;
  return {
    genre: d.genre,
    subgenres: d.subgenres,
    mood: d.mood,
    emotions: d.emotions,
    bpm: d.bpm,
    key: d.key,
    scale: d.scale,
    timeSignature: d.time_signature,
    instruments: d.instruments,
    hasVocals: d.vocals?.present,
    vocalInfo: d.vocals,
    structure: {
      sections: d.structure?.sections,
      hasIntro: d.structure?.has_intro,
      hasOutro: d.structure?.has_outro,
      hasBridge: d.structure?.has_bridge,
    },
    energy: d.energy,
    arousal: d.energy?.arousal,
    valence: d.energy?.valence,
    production: d.production,
    styleDescription: d.style_prompt,
    styleTags: d.tags,
    provider: "flamingo",
  };
}

export function normalizeLovableAIResult(data: Record<string, unknown>): UnifiedAnalysisResult {
  type LovableShape = {
    genre?: string;
    mood?: string;
    bpm?: number;
    key_signature?: string;
    instruments?: string[];
    arousal?: number;
    valence?: number;
    style_description?: string;
    structure?: string;
  };
  const d = data as LovableShape;
  return {
    genre: d.genre,
    mood: d.mood,
    bpm: d.bpm,
    key: d.key_signature,
    instruments: d.instruments,
    arousal: d.arousal,
    valence: d.valence,
    styleDescription: d.style_description,
    structure: d.structure ? { sections: [d.structure] } : undefined,
    provider: "lovable-ai",
  };
}

export function normalizeKlangioResult(data: Record<string, unknown>, mode: string): UnifiedAnalysisResult {
  type KNote = {
    pitch?: number;
    start_time?: number;
    startTime?: number;
    end_time?: number;
    endTime?: number;
    velocity?: number;
    note_name?: string;
    noteName?: string;
  };
  type KBeat = { time?: number; confidence?: number };
  type KChord = {
    chord?: string;
    label?: string;
    start_time?: number;
    startTime?: number;
    end_time?: number;
    endTime?: number;
    confidence?: number;
  };
  type KlangioShape = {
    bpm?: number;
    key?: string;
    time_signature?: string;
    notes?: KNote[];
    beats?: KBeat[];
    chords?: KChord[];
    downbeats?: number[];
    files?: { midi?: string; midi_quant?: string; pdf?: string; mxml?: string; gp5?: string };
  };
  const d = data as KlangioShape;
  const result: UnifiedAnalysisResult = { provider: "klangio" };

  if (mode === "transcription") {
    result.notes = d.notes?.map((n) => ({
      pitch: n.pitch ?? 0,
      startTime: n.start_time ?? n.startTime ?? 0,
      endTime: n.end_time ?? n.endTime ?? 0,
      velocity: n.velocity ?? 80,
      noteName: n.note_name ?? n.noteName,
    }));
    result.bpm = d.bpm;
    result.key = d.key;
    result.timeSignature = d.time_signature;
    result.midiUrl = d.files?.midi;
    result.midiQuantUrl = d.files?.midi_quant;
    result.pdfUrl = d.files?.pdf;
    result.musicXmlUrl = d.files?.mxml;
    result.gp5Url = d.files?.gp5;
  }

  if (mode === "beat-tracking") {
    result.beats = d.beats?.map((b) => ({ time: b.time ?? 0, confidence: b.confidence }));
    result.downbeats = d.downbeats;
    result.bpm = d.bpm;
  }

  if (mode === "chord-recognition" || mode === "chord-recognition-extended") {
    result.chords = d.chords?.map((c) => ({
      chord: c.chord ?? c.label ?? "",
      startTime: c.start_time ?? c.startTime ?? 0,
      endTime: c.end_time ?? c.endTime ?? 0,
      confidence: c.confidence,
    }));
    result.key = d.key;
  }

  return result;
}
