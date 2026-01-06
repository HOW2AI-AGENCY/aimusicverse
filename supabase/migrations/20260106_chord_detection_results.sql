-- Migration: Create chord_detection_results table
-- Task: T007 - Chord analysis results for Mobile Studio V2
-- Description: Stores AI-generated chord analysis results from recordings or tracks

-- Create chord_detection_results table
CREATE TABLE public.chord_detection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  recording_id UUID REFERENCES public.recording_sessions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id VARCHAR(100) NOT NULL,
  chords JSONB NOT NULL,
  confidence DECIMAL(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure at least one source is provided
  CONSTRAINT has_chord_source CHECK (
    track_id IS NOT NULL OR recording_id IS NOT NULL
  )
);

-- Create indexes for optimized queries
CREATE INDEX idx_chord_detection_results_track ON public.chord_detection_results(track_id);
CREATE INDEX idx_chord_detection_results_recording ON public.chord_detection_results(recording_id);
CREATE INDEX idx_chord_detection_results_user_created ON public.chord_detection_results(user_id, created_at DESC);
CREATE INDEX idx_chord_detection_results_analysis ON public.chord_detection_results(analysis_id);
CREATE INDEX idx_chord_detection_results_confidence ON public.chord_detection_results(confidence DESC)
  WHERE confidence > 0.8;

-- Enable Row Level Security
ALTER TABLE public.chord_detection_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own chord results"
  ON public.chord_detection_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chord results"
  ON public.chord_detection_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chord results"
  ON public.chord_detection_results FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chord results"
  ON public.chord_detection_results FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.chord_detection_results IS 'AI-generated chord analysis results from tracks or recordings';
COMMENT ON COLUMN public.chord_detection_results.track_id IS 'Track analyzed (primary source)';
COMMENT ON COLUMN public.chord_detection_results.recording_id IS 'Recording session analyzed (alternative source)';
COMMENT ON COLUMN public.chord_detection_results.user_id IS 'User who requested the analysis';
COMMENT ON COLUMN public.chord_detection_results.analysis_id IS 'Unique identifier for this analysis (for AI service tracking)';
COMMENT ON COLUMN public.chord_detection_results.chords IS 'Chord progression as JSON (time, chord name, duration)';
COMMENT ON COLUMN public.chord_detection_results.confidence IS 'Analysis confidence score (0.0 to 1.0)';
