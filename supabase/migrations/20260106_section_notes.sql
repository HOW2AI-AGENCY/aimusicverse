-- Migration: Create section_notes table
-- Task: T002 - Section annotation system for Mobile Studio V2
-- Description: Allows users to add notes and annotations to track sections (verse, chorus, etc.)

-- Create enum for note types
CREATE TYPE section_note_type AS ENUM ('general', 'production', 'lyric', 'arrangement');

-- Create section_notes table
CREATE TABLE public.section_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.track_sections(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 5000),
  note_type section_note_type NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_resolved BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes for optimized queries
CREATE INDEX idx_section_notes_section_created ON public.section_notes(section_id, created_at DESC);
CREATE INDEX idx_section_notes_author_created ON public.section_notes(author_id, created_at DESC);
CREATE INDEX idx_section_notes_resolved ON public.section_notes(is_resolved)
  WHERE is_resolved = false;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_section_notes_updated_at
  BEFORE UPDATE ON public.section_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_music_updated_at();

-- Enable Row Level Security
ALTER TABLE public.section_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view notes for own track sections"
  ON public.section_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.track_sections
      JOIN public.tracks ON tracks.id = track_sections.track_id
      WHERE track_sections.id = section_notes.section_id
      AND tracks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert notes for own track sections"
  ON public.section_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.track_sections
      JOIN public.tracks ON tracks.id = track_sections.track_id
      WHERE track_sections.id = section_notes.section_id
      AND tracks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own notes"
  ON public.section_notes FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own notes"
  ON public.section_notes FOR DELETE
  USING (auth.uid() = author_id);

-- Add comments for documentation
COMMENT ON TABLE public.section_notes IS 'Annotations and notes for track sections (verses, choruses, etc.)';
COMMENT ON COLUMN public.section_notes.section_id IS 'Reference to the track section';
COMMENT ON COLUMN public.section_notes.content IS 'Note content (max 5,000 characters)';
COMMENT ON COLUMN public.section_notes.note_type IS 'Type of note: general, production, lyric, or arrangement';
COMMENT ON COLUMN public.section_notes.is_resolved IS 'Flag indicating if the note has been addressed/resolved';
