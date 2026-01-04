/**
 * Analysis API Layer
 * Raw Supabase operations for audio analysis
 */

import { supabase } from '@/integrations/supabase/client';

// ==========================================
// Types
// ==========================================

export interface AudioAnalysis {
  id: string;
  track_id: string;
  user_id: string;
  analysis_type: string;
  bpm: number | null;
  key_signature: string | null;
  genre: string | null;
  mood: string | null;
  tempo: string | null;
  instruments: string[] | null;
  structure: string | null;
  style_description: string | null;
  valence: number | null;
  arousal: number | null;
  beats_data: any | null;
  created_at: string;
  updated_at: string;
}

export interface GuitarRecording {
  id: string;
  user_id: string;
  track_id: string | null;
  audio_url: string;
  title: string | null;
  bpm: number | null;
  key: string | null;
  time_signature: string | null;
  chords: any | null;
  notes: any | null;
  beats: any | null;
  midi_url: string | null;
  pdf_url: string | null;
  musicxml_url: string | null;
  generated_tags: string[] | null;
  style_description: string | null;
  created_at: string;
  updated_at: string;
}

// ==========================================
// Audio Analysis Operations
// ==========================================

/**
 * Fetch audio analysis for a track
 */
export async function fetchTrackAnalysis(trackId: string): Promise<AudioAnalysis | null> {
  const { data, error } = await supabase
    .from('audio_analysis')
    .select('*')
    .eq('track_id', trackId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Create audio analysis record
 */
export async function createAudioAnalysis(analysis: {
  trackId: string;
  userId: string;
  analysisType: string;
  bpm?: number;
  keySignature?: string;
  genre?: string;
  mood?: string;
  tempo?: string;
  instruments?: string[];
  structure?: string;
  beatsData?: any;
}): Promise<AudioAnalysis> {
  const { data, error } = await supabase
    .from('audio_analysis')
    .insert({
      track_id: analysis.trackId,
      user_id: analysis.userId,
      analysis_type: analysis.analysisType,
      bpm: analysis.bpm,
      key_signature: analysis.keySignature,
      genre: analysis.genre,
      mood: analysis.mood,
      tempo: analysis.tempo,
      instruments: analysis.instruments,
      structure: analysis.structure,
      beats_data: analysis.beatsData,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ==========================================
// Melody / Guitar Analysis
// ==========================================

/**
 * Upload audio file for analysis
 */
export async function uploadAudioForAnalysis(
  file: File,
  userId: string
): Promise<string> {
  const fileName = `melody-analysis/${userId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('project-assets')
    .upload(fileName, file, { cacheControl: '3600' });

  if (uploadError) throw new Error(uploadError.message);

  const { data: { publicUrl } } = supabase.storage
    .from('project-assets')
    .getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Create temporary track for analysis
 */
export async function createTempAnalysisTrack(
  userId: string,
  audioUrl: string
): Promise<string> {
  const { data, error } = await supabase
    .from('tracks')
    .insert({
      user_id: userId,
      prompt: 'Melody analysis',
      audio_url: audioUrl,
      status: 'completed',
      generation_mode: 'analysis',
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

/**
 * Delete temporary analysis track
 */
export async function deleteTempAnalysisTrack(trackId: string): Promise<void> {
  const { error } = await supabase
    .from('tracks')
    .delete()
    .eq('id', trackId);

  if (error) throw new Error(error.message);
}

/**
 * Invoke MIDI transcription edge function
 */
export async function invokeMidiTranscription(params: {
  trackId: string;
  audioUrl: string;
  modelType?: string;
}): Promise<{ success: boolean; error?: string; data?: any }> {
  const { data, error } = await supabase.functions.invoke('transcribe-midi', {
    body: {
      track_id: params.trackId,
      audio_url: params.audioUrl,
      model_type: params.modelType || 'basic-pitch',
      auto_select: false,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Save guitar recording
 */
export async function saveGuitarRecording(recording: {
  userId: string;
  trackId?: string;
  audioUrl: string;
  title?: string;
  bpm?: number;
  key?: string;
  timeSignature?: string;
  chords?: any;
  notes?: any;
  beats?: any;
  midiUrl?: string;
  generatedTags?: string[];
  styleDescription?: string;
}): Promise<GuitarRecording> {
  const { data, error } = await supabase
    .from('guitar_recordings')
    .insert({
      user_id: recording.userId,
      track_id: recording.trackId,
      audio_url: recording.audioUrl,
      title: recording.title,
      bpm: recording.bpm,
      key: recording.key,
      time_signature: recording.timeSignature,
      chords: recording.chords,
      notes: recording.notes,
      beats: recording.beats,
      midi_url: recording.midiUrl,
      generated_tags: recording.generatedTags,
      style_description: recording.styleDescription,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
