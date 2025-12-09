-- Create table for guitar recordings with analysis results
CREATE TABLE public.guitar_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Audio data
  audio_url TEXT NOT NULL,
  title TEXT,
  duration_seconds NUMERIC,
  
  -- Beat analysis
  bpm NUMERIC,
  time_signature TEXT,
  beats JSONB DEFAULT '[]'::jsonb,
  downbeats JSONB DEFAULT '[]'::jsonb,
  
  -- Chord analysis
  key TEXT,
  chords JSONB DEFAULT '[]'::jsonb,
  strumming JSONB DEFAULT '[]'::jsonb,
  
  -- Transcription files
  midi_url TEXT,
  midi_quant_url TEXT,
  pdf_url TEXT,
  gp5_url TEXT,
  musicxml_url TEXT,
  notes JSONB DEFAULT '[]'::jsonb,
  
  -- Generated data
  generated_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  style_description TEXT,
  style_analysis JSONB DEFAULT '{}'::jsonb,
  
  -- Analysis status
  analysis_status JSONB DEFAULT '{"beats": false, "chords": false, "transcription": false}'::jsonb,
  
  -- Track reference (if used for generation)
  track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.guitar_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own recordings"
  ON public.guitar_recordings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recordings"
  ON public.guitar_recordings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recordings"
  ON public.guitar_recordings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recordings"
  ON public.guitar_recordings FOR DELETE
  USING (auth.uid() = user_id);

-- Index for user queries
CREATE INDEX idx_guitar_recordings_user_id ON public.guitar_recordings(user_id);
CREATE INDEX idx_guitar_recordings_created_at ON public.guitar_recordings(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_guitar_recordings_updated_at
  BEFORE UPDATE ON public.guitar_recordings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();