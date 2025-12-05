-- Add likes_count column to tracks table
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- Create function to update likes_count
CREATE OR REPLACE FUNCTION public.update_track_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tracks 
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = NEW.track_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tracks 
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = OLD.track_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Create trigger for track_likes
DROP TRIGGER IF EXISTS update_track_likes_count_trigger ON public.track_likes;
CREATE TRIGGER update_track_likes_count_trigger
AFTER INSERT OR DELETE ON public.track_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_track_likes_count();

-- Backfill existing likes counts
UPDATE public.tracks t
SET likes_count = (
  SELECT COUNT(*) 
  FROM public.track_likes tl 
  WHERE tl.track_id = t.id
);

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_tracks_likes_count ON public.tracks(likes_count DESC);