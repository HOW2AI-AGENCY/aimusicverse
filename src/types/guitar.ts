/**
 * GuitarRecording type definition
 */

export interface Chord {
  chord: string;
  start: number;
  end?: number;
  confidence?: number;
}

export interface Note {
  pitch: number;
  time: number;
  duration?: number;
  velocity?: number;
}

export interface Beat {
  time: number;
  confidence?: number;
}

export interface AnalysisStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

export interface StyleAnalysis {
  genre?: string;
  tempo_stability?: number;
  rhythm_complexity?: number;
  [key: string]: unknown;
}

export interface GuitarRecording {
  id: string;
  user_id: string;
  audio_url: string;
  title?: string | null;
  duration_seconds?: number | null;
  bpm?: number | null;
  key?: string | null;
  time_signature?: string | null;
  chords?: Chord[] | null;
  notes?: Note[] | null;
  beats?: Beat[] | null;
  downbeats?: Beat[] | null;
  strumming?: Record<string, unknown> | null;
  style_description?: string | null;
  style_analysis?: StyleAnalysis | null;
  generated_tags?: string[] | null;
  analysis_status?: AnalysisStatus | null;
  midi_url?: string | null;
  midi_quant_url?: string | null;
  musicxml_url?: string | null;
  gp5_url?: string | null;
  pdf_url?: string | null;
  track_id?: string | null;
  created_at: string;
  updated_at: string;
}
