-- Fix function search_path warnings
CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit integer DEFAULT 50)
RETURNS TABLE(
  rank bigint,
  user_id uuid,
  username text,
  photo_url text,
  level integer,
  experience integer,
  total_earned integer,
  current_streak integer,
  achievements_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    ROW_NUMBER() OVER (ORDER BY uc.experience DESC, uc.total_earned DESC) as rank,
    uc.user_id,
    p.username,
    p.photo_url,
    uc.level,
    uc.experience,
    uc.total_earned,
    uc.current_streak,
    (SELECT COUNT(*) FROM public.user_achievements ua WHERE ua.user_id = uc.user_id) as achievements_count
  FROM public.user_credits uc
  LEFT JOIN public.profiles p ON p.user_id = uc.user_id
  WHERE p.is_public = true OR p.user_id = auth.uid()
  ORDER BY uc.experience DESC, uc.total_earned DESC
  LIMIT _limit;
$$;

CREATE OR REPLACE FUNCTION public.get_level_from_experience(_experience integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT GREATEST(1, FLOOR(SQRT(_experience / 100))::integer + 1);
$$;

CREATE OR REPLACE FUNCTION public.get_experience_for_level(_level integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT ((_level - 1) * (_level - 1) * 100)::integer;
$$;