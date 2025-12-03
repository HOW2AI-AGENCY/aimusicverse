-- Create stem_separation_tasks table to track separation jobs
CREATE TABLE IF NOT EXISTS public.stem_separation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  separation_task_id VARCHAR NOT NULL UNIQUE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  original_task_id VARCHAR NOT NULL,
  original_audio_id VARCHAR NOT NULL,
  mode VARCHAR NOT NULL DEFAULT 'simple',
  status VARCHAR NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Add has_stems column to tracks table
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS has_stems BOOLEAN DEFAULT FALSE;

-- Add is_instrumental column if not exists
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS is_instrumental BOOLEAN DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stem_separation_tasks_separation_task_id 
ON public.stem_separation_tasks(separation_task_id);

CREATE INDEX IF NOT EXISTS idx_stem_separation_tasks_track_id 
ON public.stem_separation_tasks(track_id);

CREATE INDEX IF NOT EXISTS idx_tracks_has_stems 
ON public.tracks(has_stems) WHERE has_stems = true;

-- Enable RLS
ALTER TABLE public.stem_separation_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for stem_separation_tasks
CREATE POLICY "Users can view own stem tasks"
ON public.stem_separation_tasks FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.tracks
  WHERE tracks.id = stem_separation_tasks.track_id
  AND tracks.user_id = auth.uid()
));

CREATE POLICY "Users can insert own stem tasks"
ON public.stem_separation_tasks FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.tracks
  WHERE tracks.id = stem_separation_tasks.track_id
  AND tracks.user_id = auth.uid()
));