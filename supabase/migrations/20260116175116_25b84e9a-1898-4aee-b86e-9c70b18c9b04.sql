-- Fix 1: Update tracks_status_check to include 'streaming_ready'
ALTER TABLE public.tracks DROP CONSTRAINT IF EXISTS tracks_status_check;

ALTER TABLE public.tracks ADD CONSTRAINT tracks_status_check 
CHECK (status::text = ANY (ARRAY[
  'draft'::text, 
  'pending'::text, 
  'processing'::text, 
  'completed'::text, 
  'failed'::text,
  'streaming_ready'::text
]));

-- Add comment for documentation
COMMENT ON CONSTRAINT tracks_status_check ON public.tracks IS 'Valid track status values including streaming_ready for partial completion state';