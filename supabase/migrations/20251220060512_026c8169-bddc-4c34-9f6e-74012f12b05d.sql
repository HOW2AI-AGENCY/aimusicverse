-- Create stem_transcriptions table for storing MIDI transcription results
CREATE TABLE public.stem_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stem_id UUID NOT NULL REFERENCES public.track_stems(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Transcription file URLs
  midi_url TEXT,
  midi_quant_url TEXT,
  mxml_url TEXT,
  gp5_url TEXT,
  pdf_url TEXT,
  
  -- Transcription metadata
  model TEXT NOT NULL,
  notes JSONB,
  notes_count INTEGER,
  bpm NUMERIC,
  key_detected TEXT,
  time_signature TEXT,
  duration_seconds NUMERIC,
  
  -- Reference to Klangio analysis log
  klangio_log_id UUID REFERENCES public.klangio_analysis_logs(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_stem_transcriptions_stem_id ON public.stem_transcriptions(stem_id);
CREATE INDEX idx_stem_transcriptions_track_id ON public.stem_transcriptions(track_id);
CREATE INDEX idx_stem_transcriptions_user_id ON public.stem_transcriptions(user_id);

-- Enable RLS
ALTER TABLE public.stem_transcriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own transcriptions"
ON public.stem_transcriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view transcriptions for public tracks"
ON public.stem_transcriptions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.tracks
  WHERE tracks.id = stem_transcriptions.track_id
  AND tracks.is_public = true
));

CREATE POLICY "Users can insert own transcriptions"
ON public.stem_transcriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcriptions"
ON public.stem_transcriptions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcriptions"
ON public.stem_transcriptions
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_stem_transcriptions_updated_at
BEFORE UPDATE ON public.stem_transcriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();