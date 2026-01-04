-- Add HD audio fields to tracks table for AudioSR upscaling
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS audio_url_hd text,
ADD COLUMN IF NOT EXISTS audio_quality text DEFAULT 'standard' CHECK (audio_quality IN ('standard', 'hd')),
ADD COLUMN IF NOT EXISTS upscale_status text CHECK (upscale_status IN ('pending', 'processing', 'completed', 'failed'));

COMMENT ON COLUMN public.tracks.audio_url_hd IS 'HD audio URL (48kHz upscaled via AudioSR)';
COMMENT ON COLUMN public.tracks.audio_quality IS 'Audio quality: standard or hd (48kHz)';
COMMENT ON COLUMN public.tracks.upscale_status IS 'Status of audio upscaling process';