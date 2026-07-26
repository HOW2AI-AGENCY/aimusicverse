ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS custom_voice_id TEXT;
COMMENT ON COLUMN public.tracks.custom_voice_id IS 'Provider voice id (custom_voices.voice_id) used for this generation; NULL when no cloned voice was used.';
CREATE INDEX IF NOT EXISTS tracks_custom_voice_id_idx ON public.tracks (custom_voice_id) WHERE custom_voice_id IS NOT NULL;