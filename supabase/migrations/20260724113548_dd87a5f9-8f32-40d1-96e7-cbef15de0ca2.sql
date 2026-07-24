
-- 1) Metrics table -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.generation_skip_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID,
  track_id UUID,
  user_id UUID,
  code TEXT NOT NULL,
  clip_index INTEGER,
  clip_id TEXT,
  available_keys TEXT[],
  source TEXT NOT NULL DEFAULT 'callback',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS generation_skip_metrics_code_created_idx
  ON public.generation_skip_metrics (code, created_at DESC);
CREATE INDEX IF NOT EXISTS generation_skip_metrics_track_idx
  ON public.generation_skip_metrics (track_id);

GRANT SELECT ON public.generation_skip_metrics TO authenticated;
GRANT ALL ON public.generation_skip_metrics TO service_role;

ALTER TABLE public.generation_skip_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all skip metrics"
  ON public.generation_skip_metrics FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own track skip metrics"
  ON public.generation_skip_metrics FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- No INSERT/UPDATE policy for authenticated — writes go through service_role
-- (trigger + edge functions) only.

-- 2) Aggregate view ---------------------------------------------------------
CREATE OR REPLACE VIEW public.generation_skip_stats AS
SELECT
  code,
  COUNT(*)::bigint                                                 AS total,
  COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') AS last_24h,
  COUNT(*) FILTER (WHERE created_at > now() - interval '7 days')   AS last_7d,
  MAX(created_at) AS last_seen_at
FROM public.generation_skip_metrics
WHERE created_at > now() - interval '30 days'
GROUP BY code
ORDER BY total DESC;

GRANT SELECT ON public.generation_skip_stats TO authenticated;
GRANT ALL   ON public.generation_skip_stats TO service_role;

-- 3) Auto-mine notifications.metadata -> metrics ---------------------------
CREATE OR REPLACE FUNCTION public.mine_generation_skip_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clip JSONB;
  task_uuid UUID;
  track_uuid UUID;
BEGIN
  IF NEW.metadata IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only handle generation notifications
  IF NEW.group_key IS NULL OR NEW.group_key NOT LIKE 'generation_%' THEN
    RETURN NEW;
  END IF;

  BEGIN
    task_uuid := NULLIF(regexp_replace(NEW.group_key, '^generation_', ''), '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    task_uuid := NULL;
  END;

  IF task_uuid IS NOT NULL THEN
    SELECT track_id INTO track_uuid FROM public.generation_tasks WHERE id = task_uuid;
  END IF;

  -- skippedClips entries
  IF jsonb_typeof(NEW.metadata->'skippedClips') = 'array' THEN
    FOR clip IN SELECT jsonb_array_elements(NEW.metadata->'skippedClips')
    LOOP
      INSERT INTO public.generation_skip_metrics
        (task_id, track_id, user_id, code, clip_index, clip_id, available_keys, source, message)
      VALUES (
        task_uuid,
        track_uuid,
        NEW.user_id,
        COALESCE(clip->>'code', 'unknown'),
        NULLIF(clip->>'clipIndex','')::int,
        clip->>'clipId',
        CASE WHEN jsonb_typeof(clip->'availableKeys') = 'array'
             THEN ARRAY(SELECT jsonb_array_elements_text(clip->'availableKeys'))
             ELSE NULL END,
        'callback',
        clip->>'message'
      );
    END LOOP;
  END IF;

  -- Partial-delivery flag
  IF COALESCE(NEW.metadata->>'partialDelivery','false') = 'true' THEN
    INSERT INTO public.generation_skip_metrics
      (task_id, track_id, user_id, code, source, message)
    VALUES (
      task_uuid, track_uuid, NEW.user_id, 'partial_delivery', 'callback',
      NEW.metadata->>'partialReason'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mine_generation_skip_metrics ON public.notifications;
CREATE TRIGGER trg_mine_generation_skip_metrics
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.mine_generation_skip_metrics();

-- 4) Backfill active_version_id --------------------------------------------
CREATE OR REPLACE FUNCTION public.backfill_active_versions(p_limit INTEGER DEFAULT 500)
RETURNS TABLE(track_id UUID, previous_active UUID, new_active UUID, reason TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  chosen_id UUID;
  chosen_reason TEXT;
BEGIN
  FOR r IN
    SELECT t.id AS tid, t.active_version_id, t.status
    FROM public.tracks t
    WHERE t.status IN ('completed','processing','partial_delivery')
      AND EXISTS (
        SELECT 1 FROM public.track_versions v
        WHERE v.track_id = t.id AND v.audio_url IS NOT NULL AND v.audio_url <> ''
      )
      AND (
        t.active_version_id IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM public.track_versions v
          WHERE v.id = t.active_version_id
            AND v.audio_url IS NOT NULL AND v.audio_url <> ''
        )
      )
    ORDER BY t.updated_at DESC
    LIMIT p_limit
  LOOP
    -- Prefer explicit is_primary version, else earliest clip_index with audio
    SELECT v.id INTO chosen_id
    FROM public.track_versions v
    WHERE v.track_id = r.tid
      AND v.audio_url IS NOT NULL AND v.audio_url <> ''
    ORDER BY v.is_primary DESC, v.clip_index ASC NULLS LAST, v.created_at ASC
    LIMIT 1;

    IF chosen_id IS NULL THEN
      CONTINUE;
    END IF;

    chosen_reason := CASE
      WHEN r.active_version_id IS NULL THEN 'missing_active_version'
      ELSE 'stale_active_version'
    END;

    UPDATE public.track_versions
      SET is_primary = (id = chosen_id)
      WHERE track_id = r.tid;

    UPDATE public.tracks
      SET active_version_id = chosen_id,
          updated_at = now()
      WHERE id = r.tid;

    track_id := r.tid;
    previous_active := r.active_version_id;
    new_active := chosen_id;
    reason := chosen_reason;
    RETURN NEXT;
  END LOOP;
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.backfill_active_versions(INTEGER) TO service_role;

-- 5) Rebuild track versions from a generation task (used by retry) ---------
CREATE OR REPLACE FUNCTION public.rebuild_track_versions_from_task(
  p_task_id UUID,
  p_caller UUID DEFAULT NULL
)
RETURNS TABLE(versions_created INTEGER, versions_updated INTEGER, active_version UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_row RECORD;
  clip JSONB;
  clip_idx INTEGER;
  audio TEXT;
  cover TEXT;
  duration_val INTEGER;
  existing_id UUID;
  created_count INTEGER := 0;
  updated_count INTEGER := 0;
  first_ready UUID;
BEGIN
  SELECT * INTO task_row FROM public.generation_tasks WHERE id = p_task_id;
  IF task_row IS NULL THEN
    RAISE EXCEPTION 'Task % not found', p_task_id;
  END IF;

  IF p_caller IS NOT NULL
     AND task_row.user_id <> p_caller
     AND NOT public.has_role(p_caller, 'admin') THEN
    RAISE EXCEPTION 'Not authorized to rebuild task %', p_task_id;
  END IF;

  IF task_row.track_id IS NULL OR jsonb_typeof(task_row.audio_clips) <> 'array' THEN
    versions_created := 0; versions_updated := 0; active_version := NULL;
    RETURN NEXT;
    RETURN;
  END IF;

  clip_idx := 0;
  FOR clip IN SELECT jsonb_array_elements(task_row.audio_clips)
  LOOP
    audio := COALESCE(
      NULLIF(clip->>'sourceAudioUrl',''),
      NULLIF(clip->>'source_audio_url',''),
      NULLIF(clip->>'audioUrl',''),
      NULLIF(clip->>'audio_url','')
    );
    cover := COALESCE(
      NULLIF(clip->>'sourceImageUrl',''),
      NULLIF(clip->>'source_image_url',''),
      NULLIF(clip->>'imageUrl',''),
      NULLIF(clip->>'image_url','')
    );
    duration_val := NULLIF(clip->>'duration','')::int;

    IF audio IS NULL THEN
      clip_idx := clip_idx + 1;
      CONTINUE;
    END IF;

    SELECT id INTO existing_id
      FROM public.track_versions
      WHERE track_id = task_row.track_id AND clip_index = clip_idx
      LIMIT 1;

    IF existing_id IS NULL THEN
      INSERT INTO public.track_versions
        (track_id, clip_index, version_label, audio_url, cover_url,
         duration_seconds, is_primary, version_type, source_type, metadata)
      VALUES (
        task_row.track_id, clip_idx,
        CASE clip_idx WHEN 0 THEN 'A' WHEN 1 THEN 'B' ELSE chr(65 + clip_idx) END,
        audio, cover, duration_val, clip_idx = 0, 'original', 'suno',
        jsonb_build_object('rebuilt_at', now(), 'from_task', p_task_id)
      );
      created_count := created_count + 1;
    ELSE
      UPDATE public.track_versions
        SET audio_url = COALESCE(NULLIF(audio_url,''), audio),
            cover_url = COALESCE(NULLIF(cover_url,''), cover),
            duration_seconds = COALESCE(duration_seconds, duration_val),
            metadata = COALESCE(metadata, '{}'::jsonb)
                       || jsonb_build_object('rebuilt_at', now())
        WHERE id = existing_id
          AND (audio_url IS NULL OR audio_url = ''
               OR cover_url IS NULL OR cover_url = '');
      IF FOUND THEN updated_count := updated_count + 1; END IF;
    END IF;

    clip_idx := clip_idx + 1;
  END LOOP;

  SELECT v.id INTO first_ready
  FROM public.track_versions v
  WHERE v.track_id = task_row.track_id
    AND v.audio_url IS NOT NULL AND v.audio_url <> ''
  ORDER BY v.is_primary DESC, v.clip_index ASC NULLS LAST, v.created_at ASC
  LIMIT 1;

  IF first_ready IS NOT NULL THEN
    UPDATE public.track_versions
      SET is_primary = (id = first_ready)
      WHERE track_id = task_row.track_id;
    UPDATE public.tracks
      SET active_version_id = first_ready,
          status = CASE WHEN status = 'failed' THEN 'completed' ELSE status END,
          updated_at = now()
      WHERE id = task_row.track_id;
  END IF;

  versions_created := created_count;
  versions_updated := updated_count;
  active_version := first_ready;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rebuild_track_versions_from_task(UUID, UUID) TO service_role;

-- 6) Schedule backfill via pg_cron every 10 minutes ------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'backfill-active-versions') THEN
    PERFORM cron.unschedule('backfill-active-versions');
  END IF;
END $$;

SELECT cron.schedule(
  'backfill-active-versions',
  '*/10 * * * *',
  $cron$ SELECT public.backfill_active_versions(500); $cron$
);
