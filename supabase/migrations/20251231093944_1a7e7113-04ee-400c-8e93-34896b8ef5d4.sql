-- Function to get telemetry statistics for admin dashboard
CREATE OR REPLACE FUNCTION public.get_telemetry_stats(_time_period interval DEFAULT '24 hours'::interval)
RETURNS TABLE(
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
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    -- Total events
    (SELECT COUNT(*) FROM telemetry_events WHERE timestamp >= now() - _time_period)::bigint,
    
    -- Unique sessions
    (SELECT COUNT(DISTINCT session_id) FROM telemetry_events WHERE timestamp >= now() - _time_period)::bigint,
    
    -- Unique users
    (SELECT COUNT(DISTINCT user_id) FROM telemetry_events WHERE timestamp >= now() - _time_period AND user_id IS NOT NULL)::bigint,
    
    -- Events by type
    (
      SELECT COALESCE(jsonb_object_agg(event_type, cnt), '{}'::jsonb)
      FROM (
        SELECT event_type, COUNT(*) as cnt
        FROM telemetry_events
        WHERE timestamp >= now() - _time_period
        GROUP BY event_type
        ORDER BY cnt DESC
        LIMIT 20
      ) sub
    ),
    
    -- Top events
    (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT event_name, COUNT(*) as count, ROUND(AVG(duration_ms)::numeric, 2) as avg_duration_ms
        FROM telemetry_events
        WHERE timestamp >= now() - _time_period
        GROUP BY event_name
        ORDER BY count DESC
        LIMIT 15
      ) t
    ),
    
    -- Platform distribution
    (
      SELECT COALESCE(jsonb_object_agg(platform, cnt), '{}'::jsonb)
      FROM (
        SELECT COALESCE(platform, 'unknown') as platform, COUNT(*) as cnt
        FROM telemetry_events
        WHERE timestamp >= now() - _time_period
        GROUP BY platform
      ) sub
    ),
    
    -- Error summary
    (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT 
          error_type,
          error_message,
          severity,
          COUNT(*) as count,
          MAX(created_at) as last_seen
        FROM error_logs
        WHERE created_at >= now() - _time_period
        GROUP BY error_type, error_message, severity
        ORDER BY count DESC
        LIMIT 20
      ) t
    ),
    
    -- Average session duration (calculated from session events)
    (
      SELECT ROUND(AVG(duration)::numeric, 2)
      FROM (
        SELECT 
          session_id,
          EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) as duration
        FROM telemetry_events
        WHERE timestamp >= now() - _time_period
        GROUP BY session_id
        HAVING COUNT(*) > 1
      ) sub
    );
END;
$function$;

-- Function to get error trends
CREATE OR REPLACE FUNCTION public.get_error_trends(_time_period interval DEFAULT '7 days'::interval)
RETURNS TABLE(
  total_errors bigint,
  critical_errors bigint,
  unique_fingerprints bigint,
  errors_by_day jsonb,
  errors_by_type jsonb,
  errors_by_severity jsonb,
  top_error_fingerprints jsonb
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM error_logs WHERE created_at >= now() - _time_period)::bigint,
    (SELECT COUNT(*) FROM error_logs WHERE created_at >= now() - _time_period AND severity = 'critical')::bigint,
    (SELECT COUNT(DISTINCT error_fingerprint) FROM error_logs WHERE created_at >= now() - _time_period)::bigint,
    
    -- Errors by day
    (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT 
          date_trunc('day', created_at)::date as day,
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE severity = 'critical') as critical
        FROM error_logs
        WHERE created_at >= now() - _time_period
        GROUP BY day
        ORDER BY day
      ) t
    ),
    
    -- Errors by type
    (
      SELECT COALESCE(jsonb_object_agg(error_type, cnt), '{}'::jsonb)
      FROM (
        SELECT error_type, COUNT(*) as cnt
        FROM error_logs
        WHERE created_at >= now() - _time_period
        GROUP BY error_type
        ORDER BY cnt DESC
        LIMIT 15
      ) sub
    ),
    
    -- Errors by severity
    (
      SELECT COALESCE(jsonb_object_agg(severity, cnt), '{}'::jsonb)
      FROM (
        SELECT severity, COUNT(*) as cnt
        FROM error_logs
        WHERE created_at >= now() - _time_period
        GROUP BY severity
      ) sub
    ),
    
    -- Top error fingerprints
    (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT 
          error_fingerprint,
          error_type,
          error_message,
          COUNT(*) as occurrences,
          COUNT(DISTINCT user_id) as affected_users,
          MAX(created_at) as last_seen
        FROM error_logs
        WHERE created_at >= now() - _time_period
        GROUP BY error_fingerprint, error_type, error_message
        ORDER BY occurrences DESC
        LIMIT 10
      ) t
    );
END;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_telemetry_stats(interval) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_error_trends(interval) TO authenticated;