-- RPC function to get retention cohorts data
-- Returns user retention by registration cohort (D1, D7, D14, D30)

CREATE OR REPLACE FUNCTION public.get_retention_cohorts(
  start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  cohort_date DATE,
  cohort_size INTEGER,
  d1_retained INTEGER,
  d7_retained INTEGER,
  d14_retained INTEGER,
  d30_retained INTEGER,
  d1_rate NUMERIC,
  d7_rate NUMERIC,
  d14_rate NUMERIC,
  d30_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH cohorts AS (
    -- Get users grouped by registration date
    SELECT 
      DATE(p.created_at) AS reg_date,
      p.user_id
    FROM profiles p
    WHERE DATE(p.created_at) BETWEEN start_date AND end_date
  ),
  user_activity AS (
    -- Get last activity for each user from multiple sources
    SELECT 
      c.reg_date,
      c.user_id,
      COALESCE(
        (SELECT MAX(created_at) FROM tracks WHERE user_id = c.user_id),
        (SELECT MAX(created_at) FROM generation_tasks WHERE user_id = c.user_id),
        (SELECT MAX(created_at) FROM user_analytics_events WHERE user_id = c.user_id)
      ) AS last_activity
    FROM cohorts c
  ),
  retention_calc AS (
    SELECT
      ua.reg_date,
      ua.user_id,
      CASE WHEN DATE(ua.last_activity) >= ua.reg_date + INTERVAL '1 day' THEN 1 ELSE 0 END AS retained_d1,
      CASE WHEN DATE(ua.last_activity) >= ua.reg_date + INTERVAL '7 days' THEN 1 ELSE 0 END AS retained_d7,
      CASE WHEN DATE(ua.last_activity) >= ua.reg_date + INTERVAL '14 days' THEN 1 ELSE 0 END AS retained_d14,
      CASE WHEN DATE(ua.last_activity) >= ua.reg_date + INTERVAL '30 days' THEN 1 ELSE 0 END AS retained_d30
    FROM user_activity ua
  )
  SELECT
    rc.reg_date AS cohort_date,
    COUNT(DISTINCT rc.user_id)::INTEGER AS cohort_size,
    SUM(rc.retained_d1)::INTEGER AS d1_retained,
    SUM(rc.retained_d7)::INTEGER AS d7_retained,
    SUM(rc.retained_d14)::INTEGER AS d14_retained,
    SUM(rc.retained_d30)::INTEGER AS d30_retained,
    ROUND(SUM(rc.retained_d1)::NUMERIC / NULLIF(COUNT(DISTINCT rc.user_id), 0) * 100, 1) AS d1_rate,
    ROUND(SUM(rc.retained_d7)::NUMERIC / NULLIF(COUNT(DISTINCT rc.user_id), 0) * 100, 1) AS d7_rate,
    ROUND(SUM(rc.retained_d14)::NUMERIC / NULLIF(COUNT(DISTINCT rc.user_id), 0) * 100, 1) AS d14_rate,
    ROUND(SUM(rc.retained_d30)::NUMERIC / NULLIF(COUNT(DISTINCT rc.user_id), 0) * 100, 1) AS d30_rate
  FROM retention_calc rc
  GROUP BY rc.reg_date
  ORDER BY rc.reg_date DESC;
END;
$$;

-- Grant execute to authenticated users (admin check will be in app layer)
GRANT EXECUTE ON FUNCTION public.get_retention_cohorts TO authenticated;