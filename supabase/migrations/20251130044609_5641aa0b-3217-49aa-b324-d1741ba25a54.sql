-- Add advanced music analysis fields to audio_analysis table
ALTER TABLE audio_analysis 
ADD COLUMN IF NOT EXISTS bpm DECIMAL,
ADD COLUMN IF NOT EXISTS beats_data JSONB,
ADD COLUMN IF NOT EXISTS arousal DECIMAL,
ADD COLUMN IF NOT EXISTS valence DECIMAL,
ADD COLUMN IF NOT EXISTS approachability VARCHAR,
ADD COLUMN IF NOT EXISTS engagement VARCHAR,
ADD COLUMN IF NOT EXISTS analysis_metadata JSONB;

-- Add comment explaining the new fields
COMMENT ON COLUMN audio_analysis.bpm IS 'Beats per minute detected from audio';
COMMENT ON COLUMN audio_analysis.beats_data IS 'Beat timestamps and positions from beat detection';
COMMENT ON COLUMN audio_analysis.arousal IS 'Musical arousal value (0-1): energy/excitement level';
COMMENT ON COLUMN audio_analysis.valence IS 'Musical valence value (0-1): positive/negative emotion';
COMMENT ON COLUMN audio_analysis.approachability IS 'Music approachability classification (low/mid/high)';
COMMENT ON COLUMN audio_analysis.engagement IS 'Music engagement classification (low/mid/high)';
COMMENT ON COLUMN audio_analysis.analysis_metadata IS 'Additional analysis data from various models';