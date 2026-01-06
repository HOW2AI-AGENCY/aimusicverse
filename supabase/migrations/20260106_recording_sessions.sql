-- Migration: Create recording_sessions table
-- Task: T003 - Vocal and guitar recording metadata for Mobile Studio V2
-- Description: Stores audio recordings (vocals, guitar) with technical metadata for integration with tracks

-- Create enum for recording types
CREATE TYPE recording_type AS ENUM ('vocal', 'guitar', 'other');

-- Create recording_sessions table
CREATE TABLE public.recording_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
  recording_type recording_type NOT NULL,
  audio_url TEXT NOT NULL,
  duration DECIMAL(10,2) NOT NULL CHECK (duration >= 0),
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  sample_rate INTEGER NOT NULL CHECK (sample_rate > 0),
  bit_depth INTEGER NOT NULL CHECK (bit_depth IN (8, 16, 24, 32)),
  channels INTEGER NOT NULL CHECK (channels IN (1, 2)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for optimized queries
CREATE INDEX idx_recording_sessions_user_created ON public.recording_sessions(user_id, created_at DESC);
CREATE INDEX idx_recording_sessions_track ON public.recording_sessions(track_id);
CREATE INDEX idx_recording_sessions_type ON public.recording_sessions(recording_type);

-- Enable Row Level Security
ALTER TABLE public.recording_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own recordings"
  ON public.recording_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recordings"
  ON public.recording_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recordings"
  ON public.recording_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recordings"
  ON public.recording_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.recording_sessions IS 'Vocal and guitar recordings with technical metadata';
COMMENT ON COLUMN public.recording_sessions.track_id IS 'Optional track association (NULL if not yet linked)';
COMMENT ON COLUMN public.recording_sessions.recording_type IS 'Type of recording: vocal, guitar, or other';
COMMENT ON COLUMN public.recording_sessions.audio_url IS 'Storage URL for the audio file';
COMMENT ON COLUMN public.recording_sessions.duration IS 'Duration in seconds';
COMMENT ON COLUMN public.recording_sessions.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.recording_sessions.sample_rate IS 'Audio sample rate in Hz (e.g., 44100, 48000)';
COMMENT ON COLUMN public.recording_sessions.bit_depth IS 'Bit depth: 8, 16, 24, or 32';
COMMENT ON COLUMN public.recording_sessions.channels IS 'Number of audio channels: 1 (mono) or 2 (stereo)';
COMMENT ON COLUMN public.recording_sessions.metadata IS 'Additional metadata (device used, effects, etc.)';
