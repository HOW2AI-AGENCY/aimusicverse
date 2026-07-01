/**
 * Audio Action Analysis Service
 *
 * Wraps the audio analysis + lyrics transcription edge function calls
 * exposed by `@/api/analysis.api`. Components consume this via
 * `useAudioActionAnalysis` instead of calling supabase directly.
 */

import { invokeAudioAnalysis, invokeLyricsTranscription } from "@/api/analysis.api";

export interface AudioAnalysisResult {
  style?: string;
  genre?: string;
  mood?: string;
}

export interface LyricsExtractionResult {
  hasVocals: boolean;
  lyrics?: string;
}

export interface AnalyzeAudioParams {
  publicUrl: string;
  analysisType?: string;
}

export interface TranscribeLyricsParams {
  publicUrl: string;
}

/**
 * Invoke the Flamingo audio analysis edge function.
 */
export async function analyzeAudioAction(params: AnalyzeAudioParams) {
  return invokeAudioAnalysis({
    audioUrl: params.publicUrl,
    analysisType: params.analysisType ?? "reference",
  });
}

/**
 * Invoke the lyrics transcription edge function.
 */
export async function transcribeAudioLyrics(params: TranscribeLyricsParams) {
  return invokeLyricsTranscription({ audioUrl: params.publicUrl });
}
