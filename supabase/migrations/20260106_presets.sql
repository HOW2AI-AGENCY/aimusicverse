-- Migration: Create presets table
-- Task: T004 - User and system presets for Mobile Studio V2
-- Description: Stores user-created and system presets for various studio features (vocal, guitar, drums, mastering, stem separation, MIDI)

-- Create enum for preset categories
CREATE TYPE preset_category AS ENUM ('vocal', 'guitar', 'drums', 'mastering', 'stem_separation', 'midi');

-- Create presets table
CREATE TABLE public.presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category preset_category NOT NULL,
  settings JSONB NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  usage_count INTEGER NOT NULL DEFAULT 0,

  -- Constraint: System presets must have NULL user_id
  CONSTRAINT system_presets_have_no_user CHECK (
    (is_system = true AND user_id IS NULL) OR
    (is_system = false AND user_id IS NOT NULL)
  )
);

-- Create indexes for optimized queries
CREATE INDEX idx_presets_user_category ON public.presets(user_id, category);
CREATE INDEX idx_presets_public_category_usage ON public.presets(is_public, category, usage_count DESC)
  WHERE is_public = true;
CREATE INDEX idx_presets_system ON public.presets(is_system)
  WHERE is_system = true;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_presets_updated_at
  BEFORE UPDATE ON public.presets
  FOR EACH ROW
  EXECUTE FUNCTION update_music_updated_at();

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_preset_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.presets
  SET usage_count = usage_count + 1
  WHERE id = NEW.preset_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view system presets"
  ON public.presets FOR SELECT
  USING (is_system = true);

CREATE POLICY "Anyone can view public presets"
  ON public.presets FOR SELECT
  USING (is_public = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own presets"
  ON public.presets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presets"
  ON public.presets FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    is_system = false
  );

CREATE POLICY "Users can update own presets"
  ON public.presets FOR UPDATE
  USING (
    auth.uid() = user_id OR
    (is_system = false AND user_id IS NULL)
  );

CREATE POLICY "Users can delete own presets"
  ON public.presets FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.presets IS 'User-created and system presets for studio features';
COMMENT ON COLUMN public.presets.user_id IS 'Owner of the preset (NULL for system presets)';
COMMENT ON COLUMN public.presets.category IS 'Preset category: vocal, guitar, drums, mastering, stem_separation, or midi';
COMMENT ON COLUMN public.presets.settings IS 'Preset settings as JSON (varies by category)';
COMMENT ON COLUMN public.presets.is_public IS 'Whether the preset is visible to other users';
COMMENT ON COLUMN public.presets.is_system IS 'Whether this is a system-provided preset (read-only)';
COMMENT ON COLUMN public.presets.usage_count IS 'Number of times this preset has been used';
