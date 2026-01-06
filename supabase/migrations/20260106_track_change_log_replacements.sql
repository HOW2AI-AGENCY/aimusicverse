-- Migration: Extend track_change_log table with replacement columns
-- Task: T009 - Enhanced change logging for section replacements in Mobile Studio V2
-- Description: Adds columns to track section replacement operations with detailed content and timing

-- Add new columns to track_change_log table
ALTER TABLE public.track_change_log
ADD COLUMN IF NOT EXISTS old_content TEXT,
ADD COLUMN IF NOT EXISTS new_content TEXT,
ADD COLUMN IF NOT EXISTS section_start DECIMAL(10,2) CHECK (section_start >= 0),
ADD COLUMN IF NOT EXISTS section_end DECIMAL(10,2) CHECK (section_end >= 0),
ADD COLUMN IF NOT EXISTS prompt TEXT;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_track_change_log_section_timing
  ON public.track_change_log(section_start, section_end)
  WHERE section_start IS NOT NULL AND section_end IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_track_change_log_replacements
  ON public.track_change_log(track_id, change_type)
  WHERE change_type IN ('section_replacement', 'lyric_replacement', 'stem_replacement');

-- Add comments for documentation
COMMENT ON COLUMN public.track_change_log.old_content IS 'Previous content before change (for text-based replacements)';
COMMENT ON COLUMN public.track_change_log.new_content IS 'New content after change (for text-based replacements)';
COMMENT ON COLUMN public.track_change_log.section_start IS 'Start time in seconds for section-based operations';
COMMENT ON COLUMN public.track_change_log.section_end IS 'End time in seconds for section-based operations';
COMMENT ON COLUMN public.track_change_log.prompt IS 'AI prompt used for the replacement/generation';

-- Examples of usage (for documentation):
--
-- Section Replacement:
-- {
--   "change_type": "section_replacement",
--   "old_content": "Original lyrics/arrangement",
--   "new_content": "Regenerated lyrics/arrangement",
--   "section_start": 45.5,
--   "section_end": 78.2,
--   "prompt": "Make the chorus more energetic with synth leads"
-- }
--
-- Lyric Replacement:
-- {
--   "change_type": "lyric_replacement",
--   "old_content": "Verse 1: Old lyrics here...",
--   "new_content": "Verse 1: New lyrics here...",
--   "section_start": 12.0,
--   "section_end": 32.5,
--   "prompt": "Rewrite verse to be more emotional"
-- }
--
-- Stem Replacement:
-- {
--   "change_type": "stem_replacement",
--   "field_name": "vocals",
--   "old_value": "old_vocal_stem_url",
--   "new_value": "new_vocal_stem_url",
--   "section_start": 0.0,
--   "section_end": 180.0,
--   "prompt": "Replace vocals with AI-generated version"
-- }
