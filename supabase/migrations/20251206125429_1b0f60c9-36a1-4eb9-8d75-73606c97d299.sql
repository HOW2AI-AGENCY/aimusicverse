-- Add new statistics fields to user_credits
ALTER TABLE public.user_credits ADD COLUMN IF NOT EXISTS total_tracks integer DEFAULT 0;
ALTER TABLE public.user_credits ADD COLUMN IF NOT EXISTS total_shares integer DEFAULT 0;
ALTER TABLE public.user_credits ADD COLUMN IF NOT EXISTS total_likes_received integer DEFAULT 0;
ALTER TABLE public.user_credits ADD COLUMN IF NOT EXISTS total_plays integer DEFAULT 0;

-- Create trigger function to update total_tracks when a track is created
CREATE OR REPLACE FUNCTION public.update_user_total_tracks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_credits (user_id, total_tracks)
    VALUES (NEW.user_id, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      total_tracks = COALESCE(public.user_credits.total_tracks, 0) + 1,
      updated_at = now();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_credits 
    SET total_tracks = GREATEST(COALESCE(total_tracks, 0) - 1, 0),
        updated_at = now()
    WHERE user_id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for tracks
DROP TRIGGER IF EXISTS trigger_update_user_total_tracks ON public.tracks;
CREATE TRIGGER trigger_update_user_total_tracks
AFTER INSERT OR DELETE ON public.tracks
FOR EACH ROW
EXECUTE FUNCTION public.update_user_total_tracks();

-- Create trigger function to update total_likes_received when a track receives a like
CREATE OR REPLACE FUNCTION public.update_user_total_likes_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  track_owner_id uuid;
BEGIN
  -- Get track owner
  SELECT user_id INTO track_owner_id FROM public.tracks WHERE id = COALESCE(NEW.track_id, OLD.track_id);
  
  IF track_owner_id IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.user_credits (user_id, total_likes_received)
      VALUES (track_owner_id, 1)
      ON CONFLICT (user_id) DO UPDATE SET
        total_likes_received = COALESCE(public.user_credits.total_likes_received, 0) + 1,
        updated_at = now();
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.user_credits 
      SET total_likes_received = GREATEST(COALESCE(total_likes_received, 0) - 1, 0),
          updated_at = now()
      WHERE user_id = track_owner_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for track_likes
DROP TRIGGER IF EXISTS trigger_update_user_total_likes_received ON public.track_likes;
CREATE TRIGGER trigger_update_user_total_likes_received
AFTER INSERT OR DELETE ON public.track_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_user_total_likes_received();

-- Create trigger function to update total_shares from credit_transactions
CREATE OR REPLACE FUNCTION public.update_user_total_shares()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.action_type = 'share' THEN
    UPDATE public.user_credits 
    SET total_shares = COALESCE(total_shares, 0) + 1,
        updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger for credit_transactions (shares)
DROP TRIGGER IF EXISTS trigger_update_user_total_shares ON public.credit_transactions;
CREATE TRIGGER trigger_update_user_total_shares
AFTER INSERT ON public.credit_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_user_total_shares();

-- Create function to update total_plays from track_analytics
CREATE OR REPLACE FUNCTION public.update_user_total_plays()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  track_owner_id uuid;
BEGIN
  IF NEW.event_type = 'play' THEN
    SELECT user_id INTO track_owner_id FROM public.tracks WHERE id = NEW.track_id;
    
    IF track_owner_id IS NOT NULL THEN
      INSERT INTO public.user_credits (user_id, total_plays)
      VALUES (track_owner_id, 1)
      ON CONFLICT (user_id) DO UPDATE SET
        total_plays = COALESCE(public.user_credits.total_plays, 0) + 1,
        updated_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger for track_analytics (plays)
DROP TRIGGER IF EXISTS trigger_update_user_total_plays ON public.track_analytics;
CREATE TRIGGER trigger_update_user_total_plays
AFTER INSERT ON public.track_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_user_total_plays();

-- Update get_leaderboard function to support categories
CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit integer DEFAULT 50, _category text DEFAULT 'overall')
RETURNS TABLE(
  rank bigint, 
  user_id uuid, 
  username text, 
  photo_url text, 
  level integer, 
  experience integer, 
  total_earned integer, 
  current_streak integer, 
  achievements_count bigint,
  total_tracks integer,
  total_shares integer,
  total_likes_received integer,
  total_plays integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT 
    ROW_NUMBER() OVER (
      ORDER BY 
        CASE _category
          WHEN 'generators' THEN COALESCE(uc.total_tracks, 0)
          WHEN 'sharers' THEN COALESCE(uc.total_shares, 0)
          WHEN 'popular' THEN COALESCE(uc.total_likes_received, 0)
          WHEN 'listeners' THEN COALESCE(uc.total_plays, 0)
          ELSE uc.experience
        END DESC,
        uc.total_earned DESC
    ) as rank,
    uc.user_id,
    p.username,
    p.photo_url,
    uc.level,
    uc.experience,
    uc.total_earned,
    uc.current_streak,
    (SELECT COUNT(*) FROM public.user_achievements ua WHERE ua.user_id = uc.user_id) as achievements_count,
    COALESCE(uc.total_tracks, 0) as total_tracks,
    COALESCE(uc.total_shares, 0) as total_shares,
    COALESCE(uc.total_likes_received, 0) as total_likes_received,
    COALESCE(uc.total_plays, 0) as total_plays
  FROM public.user_credits uc
  LEFT JOIN public.profiles p ON p.user_id = uc.user_id
  WHERE p.is_public = true OR p.user_id = auth.uid()
  ORDER BY 
    CASE _category
      WHEN 'generators' THEN COALESCE(uc.total_tracks, 0)
      WHEN 'sharers' THEN COALESCE(uc.total_shares, 0)
      WHEN 'popular' THEN COALESCE(uc.total_likes_received, 0)
      WHEN 'listeners' THEN COALESCE(uc.total_plays, 0)
      ELSE uc.experience
    END DESC,
    uc.total_earned DESC
  LIMIT _limit;
$function$;

-- Backfill existing data
UPDATE public.user_credits uc SET
  total_tracks = (SELECT COUNT(*) FROM public.tracks t WHERE t.user_id = uc.user_id),
  total_likes_received = (
    SELECT COUNT(*) FROM public.track_likes tl 
    JOIN public.tracks t ON t.id = tl.track_id 
    WHERE t.user_id = uc.user_id
  ),
  total_shares = (
    SELECT COUNT(*) FROM public.credit_transactions ct 
    WHERE ct.user_id = uc.user_id AND ct.action_type = 'share'
  ),
  total_plays = (
    SELECT COUNT(*) FROM public.track_analytics ta 
    JOIN public.tracks t ON t.id = ta.track_id 
    WHERE t.user_id = uc.user_id AND ta.event_type = 'play'
  );