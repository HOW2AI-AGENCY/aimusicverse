-- Inline mode support: search history table + computed fields + trending view + featured RPC

-- 1) Add computed columns used by inline mode (nullable, backfill via trigger)
ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS computed_genre text,
  ADD COLUMN IF NOT EXISTS computed_mood text,
  ADD COLUMN IF NOT EXISTS trending_score numeric,
  ADD COLUMN IF NOT EXISTS quality_score numeric;

CREATE INDEX IF NOT EXISTS idx_tracks_computed_genre_public
  ON public.tracks (computed_genre)
  WHERE is_public = true AND computed_genre IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tracks_computed_mood_public
  ON public.tracks (computed_mood)
  WHERE is_public = true AND computed_mood IS NOT NULL;

-- 2) Compute helper: simple heuristics from style/tags
CREATE OR REPLACE FUNCTION public.compute_track_genre(_style text, _tags text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO ''
AS $$
  SELECT
    CASE
      WHEN coalesce(_style,'') ILIKE '%hip%hop%' OR coalesce(_style,'') ILIKE '%rap%' OR coalesce(_tags,'') ILIKE '%hip%hop%' OR coalesce(_tags,'') ILIKE '%rap%' THEN 'hiphop'
      WHEN coalesce(_style,'') ILIKE '%rock%' OR coalesce(_tags,'') ILIKE '%rock%' THEN 'rock'
      WHEN coalesce(_style,'') ILIKE '%pop%' OR coalesce(_tags,'') ILIKE '%pop%' THEN 'pop'
      WHEN coalesce(_style,'') ILIKE '%house%' OR coalesce(_style,'') ILIKE '%techno%' OR coalesce(_style,'') ILIKE '%edm%' OR coalesce(_tags,'') ILIKE '%edm%' THEN 'electronic'
      WHEN coalesce(_style,'') ILIKE '%jazz%' OR coalesce(_tags,'') ILIKE '%jazz%' THEN 'jazz'
      WHEN coalesce(_style,'') ILIKE '%classical%' OR coalesce(_tags,'') ILIKE '%classical%' THEN 'classical'
      WHEN coalesce(_style,'') ILIKE '%ambient%' OR coalesce(_style,'') ILIKE '%chill%' OR coalesce(_tags,'') ILIKE '%ambient%' OR coalesce(_tags,'') ILIKE '%chill%' THEN 'ambient'
      WHEN coalesce(_style,'') ILIKE '%metal%' OR coalesce(_tags,'') ILIKE '%metal%' THEN 'metal'
      WHEN coalesce(_style,'') ILIKE '%folk%' OR coalesce(_style,'') ILIKE '%acoustic%' OR coalesce(_tags,'') ILIKE '%acoustic%' THEN 'folk'
      ELSE NULL
    END;
$$;

CREATE OR REPLACE FUNCTION public.compute_track_mood(_style text, _tags text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO ''
AS $$
  SELECT
    CASE
      WHEN coalesce(_style,'') ILIKE '%sad%' OR coalesce(_tags,'') ILIKE '%sad%' THEN 'sad'
      WHEN coalesce(_style,'') ILIKE '%happy%' OR coalesce(_tags,'') ILIKE '%happy%' THEN 'happy'
      WHEN coalesce(_style,'') ILIKE '%dark%' OR coalesce(_tags,'') ILIKE '%dark%' THEN 'dark'
      WHEN coalesce(_style,'') ILIKE '%chill%' OR coalesce(_tags,'') ILIKE '%chill%' THEN 'chill'
      WHEN coalesce(_style,'') ILIKE '%energetic%' OR coalesce(_tags,'') ILIKE '%energetic%' THEN 'energetic'
      ELSE NULL
    END;
$$;

-- 3) Trigger: keep computed fields up to date + rough scores
CREATE OR REPLACE FUNCTION public.update_track_inline_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _likes int;
  _plays int;
  _age_hours numeric;
BEGIN
  NEW.computed_genre := public.compute_track_genre(NEW.style, NEW.tags);
  NEW.computed_mood := public.compute_track_mood(NEW.style, NEW.tags);

  _likes := COALESCE(NEW.likes_count, 0);
  _plays := COALESCE(NEW.play_count, 0);
  _age_hours := GREATEST(0, EXTRACT(EPOCH FROM (now() - COALESCE(NEW.created_at, now()))) / 3600.0);

  NEW.trending_score := (_likes * 2) + (_plays * 0.1) + (24 / (1 + _age_hours));
  NEW.quality_score := (_likes * 1.5) + (_plays * 0.05);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tracks_inline_fields ON public.tracks;
CREATE TRIGGER trg_tracks_inline_fields
BEFORE INSERT OR UPDATE OF style, tags, likes_count, play_count, created_at
ON public.tracks
FOR EACH ROW
EXECUTE FUNCTION public.update_track_inline_fields();

-- Backfill existing rows
UPDATE public.tracks
SET computed_genre = public.compute_track_genre(style, tags),
    computed_mood  = public.compute_track_mood(style, tags),
    trending_score = (COALESCE(likes_count,0) * 2) + (COALESCE(play_count,0) * 0.1) + (24 / (1 + GREATEST(0, EXTRACT(EPOCH FROM (now() - COALESCE(created_at, now()))) / 3600.0))),
    quality_score  = (COALESCE(likes_count,0) * 1.5) + (COALESCE(play_count,0) * 0.05)
WHERE computed_genre IS NULL OR computed_mood IS NULL OR trending_score IS NULL OR quality_score IS NULL;

-- 4) Trending view used by inline-enhanced.ts
CREATE OR REPLACE VIEW public.trending_tracks AS
SELECT
  t.id,
  t.title,
  t.style,
  t.tags,
  COALESCE(t.audio_url, t.telegram_file_id) AS audio_url,
  t.telegram_file_id,
  t.cover_url,
  t.duration_seconds,
  t.created_at,
  t.user_id,
  p.username AS creator_username,
  p.display_name AS creator_name,
  t.computed_genre,
  t.computed_mood,
  t.trending_score,
  t.quality_score
FROM public.tracks t
JOIN public.profiles p ON p.user_id = t.user_id
WHERE t.is_public = true
  AND t.status = 'completed'
  AND (t.audio_url IS NOT NULL OR t.telegram_file_id IS NOT NULL);

-- 5) Featured tracks RPC used by inline-enhanced.ts
CREATE OR REPLACE FUNCTION public.get_featured_tracks(limit_count integer DEFAULT 20, offset_count integer DEFAULT 0)
RETURNS TABLE(
  id uuid,
  title varchar,
  style varchar,
  tags text,
  audio_url text,
  telegram_file_id text,
  cover_url text,
  duration_seconds integer,
  created_at timestamptz,
  user_id uuid,
  creator_username text,
  creator_name text,
  computed_genre text,
  computed_mood text,
  trending_score numeric,
  quality_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    t.id,
    t.title,
    t.style,
    t.tags,
    COALESCE(t.audio_url, t.telegram_file_id) AS audio_url,
    t.telegram_file_id,
    t.cover_url,
    t.duration_seconds,
    t.created_at,
    t.user_id,
    p.username AS creator_username,
    p.display_name AS creator_name,
    t.computed_genre,
    t.computed_mood,
    t.trending_score,
    t.quality_score
  FROM public.tracks t
  JOIN public.profiles p ON p.user_id = t.user_id
  WHERE t.is_public = true
    AND t.status = 'completed'
    AND (t.audio_url IS NOT NULL OR t.telegram_file_id IS NOT NULL)
  ORDER BY t.quality_score DESC NULLS LAST, t.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
$$;

-- 6) Inline search history table
CREATE TABLE IF NOT EXISTS public.inline_search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  telegram_user_id bigint,
  query text,
  category text,
  results_count integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inline_search_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their inline search history" ON public.inline_search_history;
CREATE POLICY "Users can view their inline search history"
ON public.inline_search_history
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their inline search history" ON public.inline_search_history;
CREATE POLICY "Users can insert their inline search history"
ON public.inline_search_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_inline_search_history_user_created
ON public.inline_search_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inline_search_history_telegram_user_created
ON public.inline_search_history (telegram_user_id, created_at DESC);
