-- Add source_type field to track_versions to distinguish generation vs studio versions
ALTER TABLE public.track_versions 
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'generated' 
CHECK (source_type IN ('generated', 'studio', 'extended', 'cover', 'remix'));

-- Add comment explaining the field
COMMENT ON COLUMN public.track_versions.source_type IS 'Source of version: generated (A/B from AI), studio (saved from stem studio), extended, cover, remix';