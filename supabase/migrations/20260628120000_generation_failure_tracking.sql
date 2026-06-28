-- Sprint 034: Structured failure tracking for generation_tasks
-- Adds columns for retry tracking, failure categorization, and generation parameters

-- Failure category enum-like column
ALTER TABLE public.generation_tasks
  ADD COLUMN IF NOT EXISTS failure_category TEXT,
  ADD COLUMN IF NOT EXISTS abort_reason TEXT,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS generation_params JSONB;

-- Index for failure analysis queries
CREATE INDEX IF NOT EXISTS idx_generation_tasks_failure_category
  ON public.generation_tasks(failure_category)
  WHERE failure_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_generation_tasks_created_status
  ON public.generation_tasks(created_at DESC, status);

-- Comment constraints for valid failure categories
COMMENT ON COLUMN public.generation_tasks.failure_category IS 'Structured failure type: api_error, rate_limit, content_policy, timeout, network, validation, unknown';
COMMENT ON COLUMN public.generation_tasks.abort_reason IS 'User-initiated abort reason or system abort cause';
COMMENT ON COLUMN public.generation_tasks.retry_count IS 'Number of automatic retry attempts before final failure';
COMMENT ON COLUMN public.generation_tasks.generation_params IS 'Snapshot of generation parameters (model, mode, style, vocals, etc.)';

-- RPC: Failure pattern analysis for admin dashboard
CREATE OR REPLACE FUNCTION public.get_generation_failure_patterns(
  _time_period INTERVAL DEFAULT '7 days'::INTERVAL
)
RETURNS TABLE(
  failure_category TEXT,
  error_count BIGINT,
  percentage NUMERIC,
  avg_retry_count NUMERIC,
  most_common_error TEXT,
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH failed AS (
    SELECT *
    FROM generation_tasks
    WHERE status = 'failed'
      AND created_at >= NOW() - _time_period
  ),
  total AS (
    SELECT COUNT(*)::NUMERIC AS cnt FROM failed
  )
  SELECT
    COALESCE(f.failure_category, 'uncategorized') AS failure_category,
    COUNT(*)::BIGINT AS error_count,
    ROUND(COUNT(*)::NUMERIC / GREATEST(t.cnt, 1) * 100, 1) AS percentage,
    ROUND(AVG(COALESCE(f.retry_count, 0))::NUMERIC, 1) AS avg_retry_count,
    MODE() WITHIN GROUP (ORDER BY f.error_message) AS most_common_error,
    MIN(f.created_at) AS first_seen,
    MAX(f.created_at) AS last_seen
  FROM failed f, total t
  GROUP BY COALESCE(f.failure_category, 'uncategorized'), t.cnt
  ORDER BY error_count DESC;
END;
$$;

-- Grant execute to authenticated users (admin check done in app)
GRANT EXECUTE ON FUNCTION public.get_generation_failure_patterns TO authenticated;

-- RPC: Generation success rate over time (for dashboard charts)
CREATE OR REPLACE FUNCTION public.get_generation_success_timeline(
  _time_period INTERVAL DEFAULT '7 days'::INTERVAL,
  _bucket_size INTERVAL DEFAULT '1 hour'::INTERVAL
)
RETURNS TABLE(
  bucket TIMESTAMPTZ,
  total BIGINT,
  completed BIGINT,
  failed BIGINT,
  success_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc('hour', gt.created_at) AS bucket,
    COUNT(*)::BIGINT AS total,
    COUNT(*) FILTER (WHERE gt.status = 'completed')::BIGINT AS completed,
    COUNT(*) FILTER (WHERE gt.status = 'failed')::BIGINT AS failed,
    ROUND(
      COUNT(*) FILTER (WHERE gt.status = 'completed')::NUMERIC /
      GREATEST(COUNT(*), 1) * 100,
      1
    ) AS success_rate
  FROM generation_tasks gt
  WHERE gt.created_at >= NOW() - _time_period
    AND gt.status IN ('completed', 'failed')
  GROUP BY date_trunc('hour', gt.created_at)
  ORDER BY bucket;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_generation_success_timeline TO authenticated;
