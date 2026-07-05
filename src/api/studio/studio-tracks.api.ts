/**
 * Studio Tracks API
 * Track versions, stems, source track, stem separation, guitar analysis
 * Extracted from studio.api.ts — Sprint 051 decomposition
 */

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type TrackVersion = Tables<"track_versions">;
export type TrackStem = Tables<"track_stems">;
export type GuitarRecording = Tables<"guitar_recordings">;

// Track Versions
export async function fetchTrackVersions(trackId: string) {
  const { data, error } = await supabase.from("track_versions").select("*").eq("track_id", trackId).order("created_at", { ascending: false });
  return { data, error };
}

export async function setPrimaryVersion(trackId: string, versionId: string) {
  await supabase.from("track_versions").update({ is_primary: false }).eq("track_id", trackId);
  const { data, error } = await supabase.from("track_versions").update({ is_primary: true }).eq("id", versionId).select().single();
  if (data?.audio_url) await supabase.from("tracks").update({ audio_url: data.audio_url }).eq("id", trackId);
  return { data, error };
}

// Track Stems
export async function fetchTrackStems(trackId: string) {
  const { data, error } = await supabase.from("track_stems").select("*").eq("track_id", trackId).order("created_at", { ascending: false });
  return { data, error };
}

export async function fetchTrackStemsByTypes(trackId: string, stemTypes: string[]) {
  const { data, error } = await supabase.from("track_stems").select("id, stem_type").eq("track_id", trackId).in("stem_type", stemTypes);
  return { data, error };
}

export async function fetchTrackStemByType(trackId: string, stemType: string) {
  const { data, error } = await supabase.from("track_stems").select("id").eq("track_id", trackId).eq("stem_type", stemType).maybeSingle();
  return { data, error };
}

export async function fetchLatestStemTranscription(stemId: string) {
  const { data, error } = await supabase.from("stem_transcriptions").select("*").eq("stem_id", stemId).order("created_at", { ascending: false }).limit(1);
  return { data, error };
}

export async function fetchVersionTranscriptionData(versionId: string) {
  const { data, error } = await supabase.from("track_versions").select("transcription_data").eq("id", versionId).maybeSingle();
  return { data, error };
}

// Source Track
export async function fetchSourceTrackForStudio(trackId: string) {
  const { data, error } = await supabase.from("tracks").select("id, lyrics, suno_task_id, suno_id").eq("id", trackId).maybeSingle();
  return { data, error };
}

// Stem Separation
export async function invokeStemSeparation(params: { trackId: string; audioId: string; audioUrl: string; mode: "simple" | "detailed"; userId: string }) {
  const { data, error } = await supabase.functions.invoke("suno-separate-vocals", { body: params });
  return { data, error };
}

// Guitar Analysis
export async function fetchGuitarAnalysis(trackId: string) {
  const { data, error } = await supabase.from("guitar_recordings").select("*").eq("track_id", trackId).maybeSingle();
  return { data, error };
}

// Track Version RPC
export async function ensureTrackVersion(params: { trackId: string; audioUrl: string; label?: string; versionType?: string }) {
  const { data, error } = await supabase.rpc("ensure_track_version", { p_track_id: params.trackId, p_audio_url: params.audioUrl, p_label: params.label, p_version_type: params.versionType });
  if (error) throw new Error(error.message);
  return data as string;
}
