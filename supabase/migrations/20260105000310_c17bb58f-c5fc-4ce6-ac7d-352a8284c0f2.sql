-- Add watermark-related columns to tracks table
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS is_watermarked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS watermarked_url text,
ADD COLUMN IF NOT EXISTS watermarked_at timestamptz,
ADD COLUMN IF NOT EXISTS watermark_status text;

COMMENT ON COLUMN public.tracks.is_watermarked IS 'Track has neural audio watermark applied';
COMMENT ON COLUMN public.tracks.watermarked_url IS 'URL of watermarked audio file';
COMMENT ON COLUMN public.tracks.watermarked_at IS 'Timestamp when watermark was applied';
COMMENT ON COLUMN public.tracks.watermark_status IS 'Status of watermark operation: pending, processing, completed, failed';