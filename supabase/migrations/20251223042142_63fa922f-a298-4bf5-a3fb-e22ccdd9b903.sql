-- Add status column to track_stems for tracking when re-splitting is needed
ALTER TABLE public.track_stems 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'ready';

-- Add updated_at column if not exists
ALTER TABLE public.track_stems 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_track_stems_status ON public.track_stems(status);

-- Add comment
COMMENT ON COLUMN public.track_stems.status IS 'Status of stem: ready, needs_resplit, processing';