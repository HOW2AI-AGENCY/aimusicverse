-- Create storage bucket for reference audio (user uploads, microphone recordings)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reference-audio', 
  'reference-audio', 
  false, 
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/m4a', 'audio/aac', 'audio/flac', 'audio/webm']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for reference-audio bucket
CREATE POLICY "Users can upload their own reference audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'reference-audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own reference audio"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'reference-audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own reference audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'reference-audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create table to track reference audio uploads
CREATE TABLE IF NOT EXISTS public.reference_audio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  duration_seconds NUMERIC,
  source TEXT NOT NULL DEFAULT 'upload', -- 'upload', 'microphone', 'telegram'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reference_audio ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own reference audio"
ON public.reference_audio FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reference audio"
ON public.reference_audio FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reference audio"
ON public.reference_audio FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_reference_audio_user_id ON public.reference_audio(user_id);
CREATE INDEX idx_reference_audio_created_at ON public.reference_audio(created_at DESC);