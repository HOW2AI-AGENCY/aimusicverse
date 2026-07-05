/**
 * Studio Transcription API
 * Stem transcriptions, MIDI export, transcription lookups, Klangio/Replicate
 * Extracted from studio.api.ts — Sprint 051 decomposition
 */

import { supabase } from "@/integrations/supabase/client";

// Stem Transcriptions
export async function fetchStemTranscriptions(filter: { trackId?: string; stemId?: string }) {
  let query = supabase.from("stem_transcriptions").select("*");
  if (filter.trackId) query = query.eq("track_id", filter.trackId);
  if (filter.stemId) query = query.eq("stem_id", filter.stemId);
  const { data, error } = await query.order("created_at", { ascending: false });
  return { data, error };
}

export async function fetchStemTranscriptionsByStemIds(stemIds: string[]) {
  const { data, error } = await supabase.from("stem_transcriptions").select("*").in("stem_id", stemIds);
  return { data, error };
}

// MIDI Export
export async function invokeExportMidi(payload: { notes: unknown[]; bpm: number; timeSignature: string; trackName: string }) {
  const { data, error } = await supabase.functions.invoke("export-midi", { body: payload });
  return { data, error };
}

// Stem Transcription Lookup
export async function fetchLatestStemTranscriptionByStemId(stemId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase.from("stem_transcriptions").select("*").eq("stem_id", stemId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return (data ?? null) as Record<string, unknown> | null;
}

export async function fetchLatestStemTranscriptionByTrackId(trackId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase.from("stem_transcriptions").select("*").eq("track_id", trackId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return (data ?? null) as Record<string, unknown> | null;
}

// Transcription Edge Functions
export interface ReplicateMidiPayload { audioUrl: string; trackId?: string; stemId?: string; model?: string; }
export interface ReplicateMidiResponse { success: boolean; error?: string; files?: { midi?: string }; midiUrl?: string | null; notes?: unknown[]; notes_count?: number; }

export async function invokeReplicateMidiTranscription(payload: ReplicateMidiPayload): Promise<{ data: ReplicateMidiResponse | null; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke("replicate-midi-transcription", { body: payload });
  return { data: (data as ReplicateMidiResponse | null) ?? null, error: error ? new Error(error.message) : null };
}

export interface KlangioAnalyzePayload { audio_url: string; mode?: string; model?: string; outputs?: string[]; title?: string; stem_type?: string; user_id?: string; }
export interface KlangioAnalyzeResponse { success: boolean; error?: string; files?: { midi?: string; midi_url?: string; midi_quant?: string; midi_quant_url?: string; mxml?: string; musicxml?: string; musicxml_url?: string; pdf?: string; pdf_url?: string; gp5?: string; gp5_url?: string; }; midi_url?: string | null; midi_quant_url?: string | null; musicxml_url?: string | null; pdf_url?: string | null; gp5_url?: string | null; bpm?: number; key_detected?: string; key?: string; notes?: unknown[]; notes_count?: number; }

export async function invokeKlangioAnalyze(payload: KlangioAnalyzePayload): Promise<{ data: KlangioAnalyzeResponse | null; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke("klangio-analyze", { body: payload });
  return { data: (data as KlangioAnalyzeResponse | null) ?? null, error: error ? new Error(error.message) : null };
}
