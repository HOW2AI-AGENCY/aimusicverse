/**
 * Studio Stems Service
 * Source track, stem transcriptions, MIDI export, stem separation
 * Extracted from studio.service.ts — Sprint 051 decomposition
 */

import * as studioApi from "@/api/studio.api";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export type SourceTrackMetadata = {
  id: string;
  lyrics: string | null;
  suno_task_id: string | null;
  suno_id: string | null;
};

export async function fetchSourceTrack(trackId: string): Promise<SourceTrackMetadata | null> {
  const { data, error } = await studioApi.fetchSourceTrackForStudio(trackId);
  if (error || !data) return null;
  return data as SourceTrackMetadata;
}

export type StemMetadata = { id: string; stem_type: string };

export type StemTranscriptionRow = {
  id: string;
  track_id: string;
  stem_id: string | null;
  midi_url?: string | null;
  pdf_url?: string | null;
  gp5_url?: string | null;
  mxml_url?: string | null;
  notes?: unknown;
  notes_count?: number | null;
  bpm?: number | string | null;
  key_detected?: string | null;
  duration_seconds?: number | string | null;
  created_at?: string;
  [key: string]: unknown;
};

export async function fetchStemsByTypes(trackId: string, stemTypes: string[]): Promise<StemMetadata[]> {
  const { data, error } = await studioApi.fetchTrackStemsByTypes(trackId, stemTypes);
  if (error || !data) return [];
  return (data as StemMetadata[]) ?? [];
}

export async function fetchMainTrackTranscription(trackId: string): Promise<StemTranscriptionRow | null> {
  const { data, error } = await studioApi.fetchStemTranscriptions({ trackId });
  if (error || !data || data.length === 0) return null;
  return data[0] as StemTranscriptionRow;
}

export async function fetchTranscriptionsByStemIds(stemIds: string[]): Promise<StemTranscriptionRow[]> {
  if (stemIds.length === 0) return [];
  const { data, error } = await studioApi.fetchStemTranscriptionsByStemIds(stemIds);
  if (error || !data) return [];
  return data as StemTranscriptionRow[];
}

export interface ResolvedTranscription {
  id: string;
  midi_url?: string | null;
  mxml_url?: string | null;
  gp5_url?: string | null;
  pdf_url?: string | null;
  bpm?: number | null;
  key_detected?: string | null;
  time_signature?: string | null;
  notes_count?: number | null;
  notes?: unknown[] | null;
  [key: string]: unknown;
}

export async function fetchVersionTranscription(versionId: string): Promise<ResolvedTranscription | null> {
  const { data, error } = await studioApi.fetchVersionTranscriptionData(versionId);
  if (error || !data) return null;
  const td = data.transcription_data as Record<string, unknown> | null;
  if (!td || typeof td !== "object") return null;
  return td as unknown as ResolvedTranscription;
}

export async function fetchStemTranscriptionForTrackType(
  trackId: string,
  stemType: string,
): Promise<ResolvedTranscription | null> {
  const stem = await studioApi.fetchTrackStemByType(trackId, stemType);
  if (stem.error || !stem.data) return null;
  const trans = await studioApi.fetchLatestStemTranscription((stem.data as { id: string }).id);
  if (trans.error || !trans.data || trans.data.length === 0) return null;
  return trans.data[0] as ResolvedTranscription;
}

export async function fetchLatestTranscriptionForTrackOrStem(
  trackId: string | null | undefined,
  fallbackStemId: string,
): Promise<ResolvedTranscription | null> {
  const filter: { trackId?: string; stemId?: string } = trackId ? { trackId } : { stemId: fallbackStemId };
  const { data, error } = await studioApi.fetchStemTranscriptions(filter);
  if (error || !data || data.length === 0) return null;
  return data[0] as ResolvedTranscription;
}

export interface ExportMidiParams {
  notes: unknown[];
  bpm: number;
  timeSignature: string;
  trackName: string;
}

export interface ExportMidiResult {
  data: string;
  success: boolean;
  error?: string;
}

export async function exportMidi(params: ExportMidiParams): Promise<ExportMidiResult> {
  const { data, error } = await studioApi.invokeExportMidi(params);
  if (error) throw new Error(error.message);
  return (data ?? {}) as ExportMidiResult;
}

export async function separateStems(
  trackId: string,
  audioId: string,
  audioUrl: string,
  mode: "simple" | "detailed",
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: new Error("Not authenticated") };

    const { error } = await studioApi.invokeStemSeparation({ trackId, audioId, audioUrl, mode, userId: user.id });
    if (error) return { success: false, error: new Error(error.message) };
    return { success: true, error: null };
  } catch (err) {
    logger.error("Error in separateStems", err);
    return { success: false, error: err as Error };
  }
}
