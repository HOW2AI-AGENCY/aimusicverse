-- Add columns for tracking generated stems
ALTER TABLE track_stems 
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'separated'
CHECK (source IN ('separated', 'generated', 'uploaded'));

ALTER TABLE track_stems 
ADD COLUMN IF NOT EXISTS generation_prompt TEXT,
ADD COLUMN IF NOT EXISTS generation_model VARCHAR(50);

COMMENT ON COLUMN track_stems.source IS 'Origin of stem: separated, generated, or uploaded';
COMMENT ON COLUMN track_stems.generation_prompt IS 'Prompt used for AI generation';
COMMENT ON COLUMN track_stems.generation_model IS 'AI model used for generation';