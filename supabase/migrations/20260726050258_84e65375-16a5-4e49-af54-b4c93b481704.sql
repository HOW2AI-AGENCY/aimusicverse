-- Expire generation records that never received a provider callback.
CREATE OR REPLACE FUNCTION public.expire_stale_generations(p_timeout_minutes integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff timestamptz := now() - make_interval(mins => greatest(p_timeout_minutes, 5));
  v_recovered integer := 0;
  v_failed integer := 0;
  v_tasks integer := 0;
BEGIN
  -- 1) Tracks that actually have audio but were left in a transient status
  WITH fixed AS (
    UPDATE public.tracks
       SET status = 'completed',
           updated_at = now()
     WHERE status IN ('pending', 'processing')
       AND created_at < v_cutoff
       AND audio_url IS NOT NULL
    RETURNING 1
  )
  SELECT count(*) INTO v_recovered FROM fixed;

  -- 2) Tracks with no audio and no callback -> mark as failed so UI stops spinning
  WITH expired AS (
    UPDATE public.tracks
       SET status = 'failed',
           error_message = COALESCE(error_message, 'Генерация не завершилась: провайдер не прислал результат. Попробуйте создать трек заново.'),
           updated_at = now()
     WHERE status IN ('pending', 'processing')
       AND created_at < v_cutoff
       AND audio_url IS NULL
    RETURNING 1
  )
  SELECT count(*) INTO v_failed FROM expired;

  -- 3) Same for generation tasks (drives the "generating" indicator)
  WITH expired_tasks AS (
    UPDATE public.generation_tasks
       SET status = 'failed',
           error_message = COALESCE(error_message, 'Timed out: no provider callback received'),
           updated_at = now(),
           completed_at = COALESCE(completed_at, now())
     WHERE status IN ('pending', 'processing', 'streaming_ready')
       AND created_at < v_cutoff
    RETURNING 1
  )
  SELECT count(*) INTO v_tasks FROM expired_tasks;

  RETURN jsonb_build_object(
    'recovered_tracks', v_recovered,
    'failed_tracks', v_failed,
    'failed_tasks', v_tasks,
    'cutoff', v_cutoff
  );
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_generations(integer) FROM public;
GRANT EXECUTE ON FUNCTION public.expire_stale_generations(integer) TO service_role;

-- Run every 10 minutes so nothing can hang for days again.
SELECT cron.unschedule('expire-stale-generations')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-stale-generations');

SELECT cron.schedule(
  'expire-stale-generations',
  '*/10 * * * *',
  $$ SELECT public.expire_stale_generations(30); $$
);

-- One-off backfill for the records that are already stuck.
SELECT public.expire_stale_generations(30);