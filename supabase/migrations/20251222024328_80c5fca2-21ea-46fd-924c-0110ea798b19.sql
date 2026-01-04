-- Create lyrics_versions table for versioning and logging lyrics changes
CREATE TABLE public.lyrics_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to either project track or lyrics template (one must be set)
  project_track_id UUID REFERENCES public.project_tracks(id) ON DELETE CASCADE,
  lyrics_template_id UUID REFERENCES public.lyrics_templates(id) ON DELETE CASCADE,
  
  -- Version data
  lyrics TEXT NOT NULL,
  sections_data JSONB, -- structured sections array
  tags TEXT[],
  version_number INTEGER NOT NULL DEFAULT 1,
  version_name TEXT, -- "Автосохранение", "Финальная версия", etc.
  
  -- Change metadata
  change_type TEXT NOT NULL, -- 'manual_edit', 'ai_generated', 'ai_improved', 'section_add', 'section_delete', 'section_reorder', 'restore', 'autosave'
  change_description TEXT,
  ai_prompt_used TEXT,
  ai_model_used TEXT,
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_current BOOLEAN DEFAULT FALSE,
  
  -- Ensure at least one parent reference is set
  CONSTRAINT lyrics_versions_parent_check CHECK (
    project_track_id IS NOT NULL OR lyrics_template_id IS NOT NULL
  )
);

-- Create indexes for efficient queries
CREATE INDEX idx_lyrics_versions_project_track ON public.lyrics_versions(project_track_id) WHERE project_track_id IS NOT NULL;
CREATE INDEX idx_lyrics_versions_template ON public.lyrics_versions(lyrics_template_id) WHERE lyrics_template_id IS NOT NULL;
CREATE INDEX idx_lyrics_versions_user ON public.lyrics_versions(user_id);
CREATE INDEX idx_lyrics_versions_created ON public.lyrics_versions(created_at DESC);
CREATE INDEX idx_lyrics_versions_current ON public.lyrics_versions(is_current) WHERE is_current = TRUE;

-- Enable Row Level Security
ALTER TABLE public.lyrics_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own versions
CREATE POLICY "Users can view own lyrics versions"
ON public.lyrics_versions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own versions
CREATE POLICY "Users can insert own lyrics versions"
ON public.lyrics_versions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own versions (for is_current flag)
CREATE POLICY "Users can update own lyrics versions"
ON public.lyrics_versions
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own versions
CREATE POLICY "Users can delete own lyrics versions"
ON public.lyrics_versions
FOR DELETE
USING (auth.uid() = user_id);

-- Function to auto-increment version number
CREATE OR REPLACE FUNCTION public.set_lyrics_version_number()
RETURNS TRIGGER AS $$
DECLARE
  max_version INTEGER;
BEGIN
  -- Get the max version number for this parent
  IF NEW.project_track_id IS NOT NULL THEN
    SELECT COALESCE(MAX(version_number), 0) INTO max_version
    FROM public.lyrics_versions
    WHERE project_track_id = NEW.project_track_id;
  ELSE
    SELECT COALESCE(MAX(version_number), 0) INTO max_version
    FROM public.lyrics_versions
    WHERE lyrics_template_id = NEW.lyrics_template_id;
  END IF;
  
  NEW.version_number := max_version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to set version number on insert
CREATE TRIGGER set_lyrics_version_number_trigger
BEFORE INSERT ON public.lyrics_versions
FOR EACH ROW
EXECUTE FUNCTION public.set_lyrics_version_number();

-- Function to ensure only one current version per parent
CREATE OR REPLACE FUNCTION public.update_lyrics_current_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = TRUE THEN
    -- Unset current flag on other versions of same parent
    IF NEW.project_track_id IS NOT NULL THEN
      UPDATE public.lyrics_versions
      SET is_current = FALSE
      WHERE project_track_id = NEW.project_track_id
        AND id != NEW.id
        AND is_current = TRUE;
    ELSE
      UPDATE public.lyrics_versions
      SET is_current = FALSE
      WHERE lyrics_template_id = NEW.lyrics_template_id
        AND id != NEW.id
        AND is_current = TRUE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to manage current version flag
CREATE TRIGGER update_lyrics_current_version_trigger
AFTER INSERT OR UPDATE OF is_current ON public.lyrics_versions
FOR EACH ROW
WHEN (NEW.is_current = TRUE)
EXECUTE FUNCTION public.update_lyrics_current_version();