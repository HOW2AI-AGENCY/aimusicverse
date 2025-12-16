-- Add fields for comprehensive audio analysis and stems storage
ALTER TABLE public.reference_audio
ADD COLUMN IF NOT EXISTS telegram_file_id TEXT,
ADD COLUMN IF NOT EXISTS bpm NUMERIC,
ADD COLUMN IF NOT EXISTS tempo TEXT,
ADD COLUMN IF NOT EXISTS energy TEXT,
ADD COLUMN IF NOT EXISTS instruments TEXT[],
ADD COLUMN IF NOT EXISTS style_description TEXT,
ADD COLUMN IF NOT EXISTS has_instrumentals BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS vocal_stem_url TEXT,
ADD COLUMN IF NOT EXISTS instrumental_stem_url TEXT,
ADD COLUMN IF NOT EXISTS drums_stem_url TEXT,
ADD COLUMN IF NOT EXISTS bass_stem_url TEXT,
ADD COLUMN IF NOT EXISTS other_stem_url TEXT,
ADD COLUMN IF NOT EXISTS stems_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS analysis_metadata JSONB;

-- Create index for telegram_file_id for quick lookup
CREATE INDEX IF NOT EXISTS idx_reference_audio_telegram_file_id 
ON public.reference_audio(telegram_file_id) 
WHERE telegram_file_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.reference_audio.stems_status IS 'none, processing, completed, failed, not_applicable';
COMMENT ON COLUMN public.reference_audio.analysis_metadata IS 'Full analysis data from Audio Flamingo and other models';