
-- Metrics table for suno-music-generate outcomes
CREATE TABLE IF NOT EXISTS public.suno_generation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  correlation_id text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('success','failure','rate_limit','insufficient_credits','validation_error','unauthorized','exception')),
  http_status integer,
  error_code text,
  error_message text,
  model_requested text,
  model_used text,
  retry_count integer NOT NULL DEFAULT 0,
  fallback_used boolean NOT NULL DEFAULT false,
  duration_ms integer,
  track_id uuid,
  task_id uuid,
  suno_task_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.suno_generation_events TO authenticated;
GRANT ALL ON public.suno_generation_events TO service_role;

ALTER TABLE public.suno_generation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_generation_events"
  ON public.suno_generation_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "service_role_writes_generation_events"
  ON public.suno_generation_events FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_suno_gen_events_created_at ON public.suno_generation_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suno_gen_events_outcome ON public.suno_generation_events (outcome, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suno_gen_events_user ON public.suno_generation_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suno_gen_events_correlation ON public.suno_generation_events (correlation_id);

-- Daily aggregation view for monitoring dashboards
CREATE OR REPLACE VIEW public.suno_generation_stats_daily
WITH (security_invoker = true) AS
SELECT
  date_trunc('day', created_at) AS day,
  outcome,
  http_status,
  model_used,
  count(*)::bigint AS event_count,
  avg(duration_ms)::integer AS avg_duration_ms,
  max(retry_count) AS max_retries,
  sum(CASE WHEN fallback_used THEN 1 ELSE 0 END)::bigint AS fallback_count
FROM public.suno_generation_events
GROUP BY 1,2,3,4;

GRANT SELECT ON public.suno_generation_stats_daily TO authenticated;
