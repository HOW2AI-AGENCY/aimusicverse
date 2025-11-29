-- Fix the analytics summary function
CREATE OR REPLACE FUNCTION get_track_analytics_summary(
  _track_id uuid,
  _time_period interval DEFAULT interval '30 days'
)
RETURNS TABLE (
  total_plays bigint,
  total_downloads bigint,
  total_shares bigint,
  unique_listeners bigint,
  total_likes bigint,
  plays_by_day jsonb
) 
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plays bigint;
  _downloads bigint;
  _shares bigint;
  _unique_listeners bigint;
  _likes bigint;
  _daily_plays jsonb;
BEGIN
  -- Get total plays
  SELECT COUNT(*) INTO _plays
  FROM track_analytics
  WHERE track_id = _track_id
    AND event_type = 'play'
    AND created_at >= now() - _time_period;
  
  -- Get total downloads
  SELECT COUNT(*) INTO _downloads
  FROM track_analytics
  WHERE track_id = _track_id
    AND event_type = 'download'
    AND created_at >= now() - _time_period;
  
  -- Get total shares
  SELECT COUNT(*) INTO _shares
  FROM track_analytics
  WHERE track_id = _track_id
    AND event_type = 'share'
    AND created_at >= now() - _time_period;
  
  -- Get unique listeners
  SELECT COUNT(DISTINCT user_id) INTO _unique_listeners
  FROM track_analytics
  WHERE track_id = _track_id
    AND event_type = 'play'
    AND created_at >= now() - _time_period
    AND user_id IS NOT NULL;
  
  -- Get total likes
  SELECT COUNT(*) INTO _likes
  FROM track_likes
  WHERE track_id = _track_id;
  
  -- Get plays by day
  SELECT jsonb_object_agg(day::date, count)
  INTO _daily_plays
  FROM (
    SELECT 
      date_trunc('day', created_at) as day,
      COUNT(*) as count
    FROM track_analytics
    WHERE track_id = _track_id
      AND event_type = 'play'
      AND created_at >= now() - _time_period
    GROUP BY date_trunc('day', created_at)
    ORDER BY day
  ) daily_stats;
  
  RETURN QUERY SELECT 
    _plays,
    _downloads,
    _shares,
    _unique_listeners,
    _likes,
    COALESCE(_daily_plays, '{}'::jsonb);
END;
$$;