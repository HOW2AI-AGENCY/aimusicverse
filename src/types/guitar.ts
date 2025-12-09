/**
 * GuitarRecording type definition
 */

export interface GuitarRecording {
  id: string;
  user_id: string;
  audio_url: string;
  title?: string | null;
  duration_seconds?: number | null;
  bpm?: number | null;
  key?: string | null;
  time_signature?: string | null;
  chords?: any[] | null;
  notes?: any[] | null;
  beats?: any[] | null;
  downbeats?: any[] | null;
  strumming?: any | null;
  style_description?: string | null;
  style_analysis?: any | null;
  generated_tags?: string[] | null;
  analysis_status?: any | null;
  midi_url?: string | null;
  midi_quant_url?: string | null;
  musicxml_url?: string | null;
  gp5_url?: string | null;
  pdf_url?: string | null;
  track_id?: string | null;
  created_at: string;
  updated_at: string;
}
