/**
 * Reference Audio Analysis Service
 *
 * Wraps `invokeReferenceAudioAnalysis` from `@/api/analysis.api`. Used by
 * the AudioReferenceRecorder to extract BPM, key, chords, etc. for an
 * uploaded audio reference.
 */

import { invokeReferenceAudioAnalysis } from "@/api/analysis.api";

/** Normalized analysis result extracted from the analyze-reference-audio edge function. */
export interface ReferenceAnalysis {
  bpm?: number;
  key?: string;
  genre?: string;
  mood?: string;
  energy?: string;
  instruments?: string[];
  chords?: string[];
  style_description?: string;
  vocal_style?: string;
  suggested_tags?: string[];
}

export interface AnalyzeReferenceParams {
  audioUrl: string;
  analyzeStyle?: boolean;
  detectChords?: boolean;
  detectBpm?: boolean;
  recordingType?: string;
}

export async function analyzeReferenceAudio(params: AnalyzeReferenceParams): Promise<ReferenceAnalysis | null> {
  const { data, error } = await invokeReferenceAudioAnalysis(params);
  if (error) throw error;
  if (!data) return null;

  return {
    bpm: data.bpm,
    key: data.key,
    genre: data.genre,
    mood: data.mood,
    energy: data.energy,
    instruments: data.instruments,
    chords: data.chords,
    style_description: data.style_description,
    vocal_style: data.vocal_style,
    suggested_tags: data.suggested_tags,
  };
}
