-- Create funnel analytics RPC function
-- Tracks: Visit → Register → First Track → Publish → Payment

CREATE OR REPLACE FUNCTION public.get_funnel_analytics(
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  step_name TEXT,
  step_order INT,
  users_count BIGINT,
  conversion_rate NUMERIC,
  dropoff_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_visitors BIGINT;
  v_registered_users BIGINT;
  v_first_track_users BIGINT;
  v_published_users BIGINT;
  v_paying_users BIGINT;
BEGIN
  -- Step 1: Total unique visitors (from analytics events or profiles created)
  SELECT COUNT(DISTINCT uae.user_id) INTO v_total_visitors
  FROM user_analytics_events uae
  WHERE uae.created_at >= p_start_date AND uae.created_at < p_end_date + INTERVAL '1 day';
  
  -- If no analytics events, use profiles as fallback
  IF v_total_visitors = 0 THEN
    SELECT COUNT(*) INTO v_total_visitors
    FROM profiles p
    WHERE p.created_at >= p_start_date AND p.created_at < p_end_date + INTERVAL '1 day';
  END IF;
  
  -- Step 2: Registered users (profiles created in period)
  SELECT COUNT(*) INTO v_registered_users
  FROM profiles p
  WHERE p.created_at >= p_start_date AND p.created_at < p_end_date + INTERVAL '1 day';
  
  -- Step 3: Users who created their first track
  SELECT COUNT(DISTINCT t.user_id) INTO v_first_track_users
  FROM tracks t
  WHERE t.created_at >= p_start_date AND t.created_at < p_end_date + INTERVAL '1 day'
    AND NOT EXISTS (
      SELECT 1 FROM tracks t2 
      WHERE t2.user_id = t.user_id 
        AND t2.created_at < p_start_date
    );
  
  -- Step 4: Users who published a track (is_public = true)
  SELECT COUNT(DISTINCT t.user_id) INTO v_published_users
  FROM tracks t
  WHERE t.is_public = true
    AND t.created_at >= p_start_date AND t.created_at < p_end_date + INTERVAL '1 day';
  
  -- Step 5: Users who made a payment
  SELECT COUNT(DISTINCT pt.user_id) INTO v_paying_users
  FROM payment_transactions pt
  WHERE pt.status = 'completed'
    AND pt.created_at >= p_start_date AND pt.created_at < p_end_date + INTERVAL '1 day';
  
  -- Ensure we have at least 1 for calculations
  IF v_total_visitors = 0 THEN v_total_visitors := 1; END IF;
  
  -- Return funnel steps
  RETURN QUERY
  SELECT 
    'Посетители'::TEXT AS step_name,
    1::INT AS step_order,
    v_total_visitors AS users_count,
    100.0::NUMERIC AS conversion_rate,
    0.0::NUMERIC AS dropoff_rate
  UNION ALL
  SELECT 
    'Регистрация'::TEXT,
    2::INT,
    v_registered_users,
    ROUND((v_registered_users::NUMERIC / v_total_visitors * 100), 2),
    ROUND(((v_total_visitors - v_registered_users)::NUMERIC / v_total_visitors * 100), 2)
  UNION ALL
  SELECT 
    'Первый трек'::TEXT,
    3::INT,
    v_first_track_users,
    CASE WHEN v_registered_users > 0 
      THEN ROUND((v_first_track_users::NUMERIC / v_registered_users * 100), 2)
      ELSE 0 
    END,
    CASE WHEN v_registered_users > 0 
      THEN ROUND(((v_registered_users - v_first_track_users)::NUMERIC / v_registered_users * 100), 2)
      ELSE 0 
    END
  UNION ALL
  SELECT 
    'Публикация'::TEXT,
    4::INT,
    v_published_users,
    CASE WHEN v_first_track_users > 0 
      THEN ROUND((v_published_users::NUMERIC / v_first_track_users * 100), 2)
      ELSE 0 
    END,
    CASE WHEN v_first_track_users > 0 
      THEN ROUND(((v_first_track_users - v_published_users)::NUMERIC / v_first_track_users * 100), 2)
      ELSE 0 
    END
  UNION ALL
  SELECT 
    'Платёж'::TEXT,
    5::INT,
    v_paying_users,
    CASE WHEN v_published_users > 0 
      THEN ROUND((v_paying_users::NUMERIC / v_published_users * 100), 2)
      ELSE 0 
    END,
    CASE WHEN v_published_users > 0 
      THEN ROUND(((v_published_users - v_paying_users)::NUMERIC / v_published_users * 100), 2)
      ELSE 0 
    END
  ORDER BY 2;
END;
$$;