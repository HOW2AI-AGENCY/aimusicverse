-- Create lyrics_section_notes table for storing notes, tags, and audio references per section
CREATE TABLE IF NOT EXISTS public.lyrics_section_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lyrics_template_id UUID REFERENCES public.lyrics_templates(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  section_type TEXT DEFAULT 'verse' CHECK (section_type IN ('verse', 'chorus', 'bridge', 'intro', 'outro', 'hook', 'prechorus', 'breakdown')),
  notes TEXT,
  tags TEXT[],
  audio_note_url TEXT,
  reference_audio_url TEXT,
  reference_analysis JSONB,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.lyrics_section_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own section notes"
  ON public.lyrics_section_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own section notes"
  ON public.lyrics_section_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own section notes"
  ON public.lyrics_section_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own section notes"
  ON public.lyrics_section_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_lyrics_section_notes_template ON public.lyrics_section_notes(lyrics_template_id);
CREATE INDEX IF NOT EXISTS idx_lyrics_section_notes_user ON public.lyrics_section_notes(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_lyrics_section_notes_updated_at
  BEFORE UPDATE ON public.lyrics_section_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_settings_updated_at();