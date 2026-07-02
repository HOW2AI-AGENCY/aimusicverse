/**
 * Audio Reference Generation Services
 * Business logic for vocal/instrumental addition, lyrics extraction,
 * and MIDI transcription flows (C3 Batch B).
 */

import { supabase } from "@/integrations/supabase/client";

// ==========================================
// AddVocalsToReferenceDialog
// ==========================================

export type AddReferenceMode = "add_vocals" | "add_instrumental";

export interface AddVocalsParams {
  audioUrl: string;
  prompt: string;
  customMode: boolean;
  style: string;
  title: string;
  negativeTags: string;
  referenceAudioId: string;
}

export interface AddVocalsResult {
  data: unknown;
  error: { message: string } | null;
}

/**
 * Invoke the suno-add-vocals or suno-add-instrumental edge function to
 * generate a new track based on an existing reference audio file.
 */
export async function invokeAddVocalsToReference(
  mode: AddReferenceMode,
  params: AddVocalsParams,
): Promise<AddVocalsResult> {
  const functionName = mode === "add_vocals" ? "suno-add-vocals" : "suno-add-instrumental";
  return supabase.functions.invoke(functionName, { body: params });
}

// ==========================================
// ExtractLyricsButton
// ==========================================

export interface ExtractLyricsParams {
  referenceId: string;
  vocalStemUrl: string;
}

export interface ExtractLyricsResult {
  data: unknown;
  error: { message: string } | null;
}

/**
 * Invoke the extract-lyrics-from-stem edge function to start lyrics
 * extraction from a vocal stem.
 */
export async function invokeExtractLyricsFromStem(params: ExtractLyricsParams): Promise<ExtractLyricsResult> {
  return supabase.functions.invoke("extract-lyrics-from-stem", {
    body: {
      reference_id: params.referenceId,
      vocal_stem_url: params.vocalStemUrl,
    },
  });
}

// ==========================================
// ReferenceMidiSheet
// ==========================================

export type MidiOutputFormat = "midi" | "musicxml" | "gp5" | "pdf";
export type MidiTranscriptionModel = "basic-pitch" | "mt3" | "drums" | "vocal";

export interface TranscribeMidiParams {
  audioUrl: string;
  userId: string;
  model: MidiTranscriptionModel;
  outputFormats: MidiOutputFormat[];
  referenceId: string;
  stemType: string;
}

export interface TranscribeMidiResponse {
  data: {
    midi_url?: string;
    musicxml_url?: string;
    gp5_url?: string;
    pdf_url?: string;
    error?: string;
  } | null;
  error: { message: string } | null;
}

/**
 * Invoke the transcribe-midi edge function to start a stem-to-MIDI
 * (or MusicXML/GP5/PDF) transcription job.
 */
export async function invokeTranscribeMidi(params: TranscribeMidiParams): Promise<TranscribeMidiResponse> {
  return supabase.functions.invoke("transcribe-midi", {
    body: {
      audio_url: params.audioUrl,
      user_id: params.userId,
      model: params.model,
      output_formats: params.outputFormats,
      reference_id: params.referenceId,
      stem_type: params.stemType,
    },
  });
}
