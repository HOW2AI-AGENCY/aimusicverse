-- Create klangio_analysis_logs table for API response logging
CREATE TABLE public.klangio_analysis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id TEXT,
  mode TEXT NOT NULL, -- transcription, chord-recognition, beat-tracking, source-separation
  model TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  audio_url TEXT,
  
  -- Request parameters
  requested_outputs TEXT[],
  vocabulary TEXT,
  
  -- Results
  files JSONB DEFAULT '{}',
  notes_count INTEGER DEFAULT 0,
  chords_count INTEGER DEFAULT 0,
  beats_count INTEGER DEFAULT 0,
  bpm NUMERIC,
  key_detected TEXT,
  time_signature TEXT,
  
  -- Raw API data for debugging
  raw_request JSONB,
  raw_response JSONB,
  fetch_errors JSONB DEFAULT '{}',
  upload_errors JSONB DEFAULT '{}',
  
  -- Error handling
  error_message TEXT,
  
  -- Performance
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.klangio_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs
CREATE POLICY "Users can view own klangio logs"
ON public.klangio_analysis_logs FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert/update logs
CREATE POLICY "Service can manage klangio logs"
ON public.klangio_analysis_logs FOR ALL
USING (true)
WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_klangio_logs_user_id ON public.klangio_analysis_logs(user_id);
CREATE INDEX idx_klangio_logs_job_id ON public.klangio_analysis_logs(job_id);
CREATE INDEX idx_klangio_logs_status ON public.klangio_analysis_logs(status);

-- Force update allowed_mime_types for project-assets bucket to include music notation formats
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  -- Audio
  'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm', 'audio/x-wav',
  'audio/midi', 'audio/x-midi',
  -- Images  
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  -- Video
  'video/mp4', 'video/webm',
  -- Music notation files
  'application/xml', 'text/xml',
  'application/vnd.recordare.musicxml+xml',
  'application/pdf',
  'application/json',
  'application/octet-stream'
]
WHERE name = 'project-assets';