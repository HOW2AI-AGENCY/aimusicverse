-- Create table for audio analysis results
CREATE TABLE IF NOT EXISTS public.audio_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  
  -- Analysis results
  analysis_type TEXT NOT NULL, -- 'auto', 'manual', 'reference'
  full_response TEXT,
  
  -- Structured data
  genre TEXT,
  mood TEXT,
  instruments TEXT[],
  tempo TEXT,
  key_signature TEXT,
  structure TEXT,
  style_description TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audio_analysis ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own audio analysis"
  ON public.audio_analysis FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own audio analysis"
  ON public.audio_analysis FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own audio analysis"
  ON public.audio_analysis FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own audio analysis"
  ON public.audio_analysis FOR DELETE
  USING (auth.uid()::text = user_id);

-- Index for faster queries
CREATE INDEX idx_audio_analysis_track_id ON public.audio_analysis(track_id);
CREATE INDEX idx_audio_analysis_user_id ON public.audio_analysis(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_audio_analysis_updated_at
  BEFORE UPDATE ON public.audio_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();