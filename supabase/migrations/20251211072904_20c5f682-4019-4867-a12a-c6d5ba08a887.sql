-- Add lyrics_status to project_tracks
ALTER TABLE public.project_tracks 
ADD COLUMN IF NOT EXISTS lyrics_status TEXT DEFAULT 'draft' 
CHECK (lyrics_status IN ('draft', 'prompt', 'generated', 'approved'));

-- Create lyrics_templates table for saving lyrics with style
CREATE TABLE IF NOT EXISTS public.lyrics_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lyrics TEXT NOT NULL,
  style TEXT,
  genre TEXT,
  mood TEXT,
  tags TEXT[],
  structure TEXT,
  language TEXT DEFAULT 'ru',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lyrics_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lyrics_templates
CREATE POLICY "Users can view their own templates"
  ON public.lyrics_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON public.lyrics_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.lyrics_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.lyrics_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for user lookup
CREATE INDEX IF NOT EXISTS idx_lyrics_templates_user_id ON public.lyrics_templates(user_id);

-- Update trigger for updated_at
CREATE TRIGGER update_lyrics_templates_updated_at
  BEFORE UPDATE ON public.lyrics_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();