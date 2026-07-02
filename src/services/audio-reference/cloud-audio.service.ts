/**
 * Cloud Audio Service
 *
 * Wraps `listReferenceAudioForUser` from `@/api/recordings.api` and provides
 * thin pass-through wrappers for the cloud-audio edge function invocations
 * used by AudioDetailPanel.
 */

import { listReferenceAudioForUser, type CloudAudioRow } from "@/api/recordings.api";
import { supabase } from "@/integrations/supabase/client";

export type CloudAudio = CloudAudioRow;

export async function listCloudAudio(userId: string, limit = 50): Promise<CloudAudio[]> {
  return listReferenceAudioForUser(userId, limit);
}

// ==========================================
// AudioDetailPanel — analyze + transcribe
// ==========================================

export interface AnalyzeAudioParams {
  audioUrl: string;
  referenceId: string;
}

export interface AnalyzeAudioResponse {
  data: { parsed?: Record<string, unknown> } | null;
  error: { message: string } | null;
}

/**
 * Invoke the analyze-audio-flamingo edge function for a reference audio file.
 */
export async function invokeAnalyzeAudio(params: AnalyzeAudioParams): Promise<AnalyzeAudioResponse> {
  return supabase.functions.invoke("analyze-audio-flamingo", {
    body: {
      audio_url: params.audioUrl,
      reference_id: params.referenceId,
    },
  });
}

export interface TranscribeLyricsParams {
  audioUrl: string;
}

export interface TranscribeLyricsResponse {
  data: { transcription?: string; lyrics?: string } | null;
  error: { message: string } | null;
}

/**
 * Invoke the transcribe-lyrics edge function for a reference audio file.
 */
export async function invokeTranscribeLyrics(params: TranscribeLyricsParams): Promise<TranscribeLyricsResponse> {
  return supabase.functions.invoke("transcribe-lyrics", {
    body: { audio_url: params.audioUrl },
  });
}
