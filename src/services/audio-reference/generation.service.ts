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
// AudioRecordDialog
// ==========================================

export type AudioRecordAction = "instrumental" | "vocals";

export interface ProcessRecordedAudioParams {
  action: AudioRecordAction;
  audioUrl: string;
  title: string;
  prompt: string;
  style: string;
  negativeTags: string;
  genre?: string;
  mood?: string;
  bpm?: number;
  customStyle?: string;
  studioProjectId?: string | null;
  pendingTrackId?: string | null;
}

export interface ProcessRecordedAudioResponse {
  data: { taskId?: string; [k: string]: unknown } | null;
  error: { message: string } | null;
}

/**
 * Invoke suno-add-instrumental or suno-add-vocals edge function from the
 * audio-record dialog with the supplied settings payload.
 */
export async function invokeProcessRecordedAudio(
  params: ProcessRecordedAudioParams,
): Promise<ProcessRecordedAudioResponse> {
  const functionName = params.action === "instrumental" ? "suno-add-instrumental" : "suno-add-vocals";
  return supabase.functions.invoke(functionName, {
    body: {
      audioUrl: params.audioUrl,
      prompt: params.prompt,
      customMode: true,
      style: params.style,
      negativeTags: params.negativeTags,
      title: params.title,
      genre: params.genre,
      mood: params.mood,
      bpm: params.bpm,
      customStyle: params.customStyle,
      audioWeight: 0.8,
      styleWeight: 0.55,
      weirdnessConstraint: 0.25,
      model: "V4_5PLUS",
      studioProjectId: params.studioProjectId,
      pendingTrackId: params.pendingTrackId,
    },
  });
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
