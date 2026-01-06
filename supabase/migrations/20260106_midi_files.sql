-- Migration: Create midi_files table
-- Task: T006 - MIDI file metadata for Mobile Studio V2
-- Description: Stores MIDI transcription files with comprehensive metadata for track integration

-- Create midi_files table
CREATE TABLE public.midi_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  duration DECIMAL(10,2) NOT NULL CHECK (duration >= 0),
  tempo INTEGER CHECK (tempo > 0),
  time_signature VARCHAR(10),
  key_signature VARCHAR(10),
  note_count INTEGER CHECK (note_count >= 0),
  track_count INTEGER CHECK (track_count > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for optimized queries
CREATE INDEX idx_midi_files_user_created ON public.midi_files(user_id, created_at DESC);
CREATE INDEX idx_midi_files_track ON public.midi_files(track_id);
CREATE INDEX idx_midi_files_tempo ON public.midi_files(tempo)
  WHERE tempo IS NOT NULL;
CREATE INDEX idx_midi_files_key ON public.midi_files(key_signature)
  WHERE key_signature IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.midi_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own MIDI files"
  ON public.midi_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own MIDI files"
  ON public.midi_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own MIDI files"
  ON public.midi_files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own MIDI files"
  ON public.midi_files FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.midi_files IS 'MIDI transcription files with comprehensive metadata';
COMMENT ON COLUMN public.midi_files.track_id IS 'Optional track association (NULL if not yet linked to a track)';
COMMENT ON COLUMN public.midi_files.file_name IS 'Original file name';
COMMENT ON COLUMN public.midi_files.file_url IS 'Storage URL for the MIDI file';
COMMENT ON COLUMN public.midi_files.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.midi_files.duration IS 'Duration in seconds';
COMMENT ON COLUMN public.midi_files.tempo IS 'Tempo in BPM (beats per minute)';
COMMENT ON COLUMN public.midi_files.time_signature IS 'Time signature (e.g., "4/4", "3/4")';
COMMENT ON COLUMN public.midi_files.key_signature IS 'Musical key (e.g., "C major", "A minor")';
COMMENT ON COLUMN public.midi_files.note_count IS 'Total number of notes in the MIDI file';
COMMENT ON COLUMN public.midi_files.track_count IS 'Number of MIDI tracks in the file';
COMMENT ON COLUMN public.midi_files.metadata IS 'Additional metadata (instruments used, complexity, etc.)';
