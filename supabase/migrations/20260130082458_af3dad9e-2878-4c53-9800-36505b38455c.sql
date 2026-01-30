-- Create RPC function for telemetry statistics
CREATE OR REPLACE FUNCTION get_telemetry_stats(_time_period text DEFAULT '24 hours')
RETURNS TABLE (
  total_events bigint,
  unique_sessions bigint,
  unique_users bigint,
  events_by_type jsonb,
  top_events jsonb,
  platform_distribution jsonb,
  error_summary jsonb,
  avg_session_duration_sec numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_time timestamptz;
BEGIN
  -- Calculate start time based on period
  start_time := CASE _time_period
    WHEN '24 hours' THEN now() - interval '24 hours'
    WHEN '7 days' THEN now() - interval '7 days'
    WHEN '30 days' THEN now() - interval '30 days'
    WHEN '90 days' THEN now() - interval '90 days'
    ELSE now() - interval '7 days'
  END;

  RETURN QUERY
  WITH event_stats AS (
    SELECT
      COUNT(*)::bigint as total,
      COUNT(DISTINCT session_id)::bigint as sessions,
      COUNT(DISTINCT user_id)::bigint as users
    FROM telemetry_events
    WHERE created_at >= start_time
  ),
  events_by_type_agg AS (
    SELECT jsonb_object_agg(event_type, cnt) as data
    FROM (
      SELECT event_type, COUNT(*)::int as cnt
      FROM telemetry_events
      WHERE created_at >= start_time
      GROUP BY event_type
    ) t
  ),
  top_events_agg AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'event_name', event_name,
        'count', cnt,
        'avg_duration_ms', avg_duration
      )
    ) as data
    FROM (
      SELECT 
        event_name,
        COUNT(*)::int as cnt,
        AVG((metadata->>'duration_ms')::numeric) as avg_duration
      FROM telemetry_events
      WHERE created_at >= start_time
      GROUP BY event_name
      ORDER BY cnt DESC
      LIMIT 20
    ) t
  ),
  platform_agg AS (
    SELECT jsonb_object_agg(platform, cnt) as data
    FROM (
      SELECT COALESCE(platform, 'unknown') as platform, COUNT(*)::int as cnt
      FROM telemetry_events
      WHERE created_at >= start_time
      GROUP BY platform
    ) t
  ),
  error_agg AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'error_type', error_type,
        'error_message', error_message,
        'severity', severity,
        'count', cnt,
        'last_seen', last_seen
      )
    ) as data
    FROM (
      SELECT 
        error_type,
        LEFT(error_message, 100) as error_message,
        severity,
        COUNT(*)::int as cnt,
        MAX(created_at) as last_seen
      FROM error_logs
      WHERE created_at >= start_time
      GROUP BY error_type, LEFT(error_message, 100), severity
      ORDER BY cnt DESC
      LIMIT 20
    ) t
  )
  SELECT 
    es.total,
    es.sessions,
    es.users,
    COALESCE(ebt.data, '{}'::jsonb),
    COALESCE(te.data, '[]'::jsonb),
    COALESCE(pa.data, '{}'::jsonb),
    COALESCE(ea.data, '[]'::jsonb),
    NULL::numeric  -- avg_session_duration_sec placeholder
  FROM event_stats es
  CROSS JOIN events_by_type_agg ebt
  CROSS JOIN top_events_agg te
  CROSS JOIN platform_agg pa
  CROSS JOIN error_agg ea;
END;
$$;

-- Create RPC function for error trends
CREATE OR REPLACE FUNCTION get_error_trends(_time_period text DEFAULT '7 days')
RETURNS TABLE (
  total_errors bigint,
  critical_errors bigint,
  unique_fingerprints bigint,
  errors_by_day jsonb,
  errors_by_type jsonb,
  errors_by_severity jsonb,
  top_error_fingerprints jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_time timestamptz;
BEGIN
  start_time := CASE _time_period
    WHEN '24 hours' THEN now() - interval '24 hours'
    WHEN '7 days' THEN now() - interval '7 days'
    WHEN '30 days' THEN now() - interval '30 days'
    WHEN '90 days' THEN now() - interval '90 days'
    ELSE now() - interval '7 days'
  END;

  RETURN QUERY
  WITH basic_stats AS (
    SELECT
      COUNT(*)::bigint as total,
      COUNT(*) FILTER (WHERE severity = 'critical')::bigint as critical,
      COUNT(DISTINCT error_fingerprint)::bigint as fingerprints
    FROM error_logs
    WHERE created_at >= start_time
  ),
  by_day AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'day', day,
        'count', cnt,
        'critical', crit
      ) ORDER BY day
    ) as data
    FROM (
      SELECT 
        DATE(created_at) as day,
        COUNT(*)::int as cnt,
        COUNT(*) FILTER (WHERE severity = 'critical')::int as crit
      FROM error_logs
      WHERE created_at >= start_time
      GROUP BY DATE(created_at)
    ) t
  ),
  by_type AS (
    SELECT jsonb_object_agg(error_type, cnt) as data
    FROM (
      SELECT error_type, COUNT(*)::int as cnt
      FROM error_logs
      WHERE created_at >= start_time
      GROUP BY error_type
    ) t
  ),
  by_severity AS (
    SELECT jsonb_object_agg(severity, cnt) as data
    FROM (
      SELECT COALESCE(severity, 'unknown') as severity, COUNT(*)::int as cnt
      FROM error_logs
      WHERE created_at >= start_time
      GROUP BY severity
    ) t
  ),
  top_fingerprints AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'error_fingerprint', error_fingerprint,
        'error_type', error_type,
        'error_message', error_message,
        'occurrences', cnt,
        'affected_users', users,
        'last_seen', last_seen
      )
    ) as data
    FROM (
      SELECT 
        error_fingerprint,
        MAX(error_type) as error_type,
        LEFT(MAX(error_message), 100) as error_message,
        COUNT(*)::int as cnt,
        COUNT(DISTINCT user_id)::int as users,
        MAX(created_at) as last_seen
      FROM error_logs
      WHERE created_at >= start_time AND error_fingerprint IS NOT NULL
      GROUP BY error_fingerprint
      ORDER BY cnt DESC
      LIMIT 15
    ) t
  )
  SELECT 
    bs.total,
    bs.critical,
    bs.fingerprints,
    COALESCE(bd.data, '[]'::jsonb),
    COALESCE(bt.data, '{}'::jsonb),
    COALESCE(bsev.data, '{}'::jsonb),
    COALESCE(tf.data, '[]'::jsonb)
  FROM basic_stats bs
  CROSS JOIN by_day bd
  CROSS JOIN by_type bt
  CROSS JOIN by_severity bsev
  CROSS JOIN top_fingerprints tf;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_telemetry_stats(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_error_trends(text) TO authenticated;