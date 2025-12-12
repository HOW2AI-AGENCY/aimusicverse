-- Sprint 014: Расширение аналитики и мониторинга

-- 1. Индексы для быстрого поиска и аналитики
CREATE INDEX IF NOT EXISTS idx_user_analytics_events_user_id ON public.user_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_events_event_type ON public.user_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_analytics_events_created_at ON public.user_analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_events_session ON public.user_analytics_events(session_id);

CREATE INDEX IF NOT EXISTS idx_deeplink_analytics_created_at ON public.deeplink_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deeplink_analytics_source ON public.deeplink_analytics(source);
CREATE INDEX IF NOT EXISTS idx_deeplink_analytics_type ON public.deeplink_analytics(deeplink_type);

CREATE INDEX IF NOT EXISTS idx_generation_tasks_status ON public.generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_created_at ON public.generation_tasks(created_at DESC);

-- 2. Функция для получения сводки по балансам пользователей
CREATE OR REPLACE FUNCTION public.get_user_balance_summary()
RETURNS TABLE (
  total_users bigint,
  total_balance bigint,
  total_earned bigint,
  total_spent bigint,
  avg_balance numeric,
  users_with_zero_balance bigint,
  users_low_balance bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint,
    COALESCE(SUM(uc.balance), 0)::bigint,
    COALESCE(SUM(uc.total_earned), 0)::bigint,
    COALESCE(SUM(uc.total_spent), 0)::bigint,
    ROUND(AVG(uc.balance)::numeric, 2),
    COUNT(CASE WHEN uc.balance = 0 THEN 1 END)::bigint,
    COUNT(CASE WHEN uc.balance > 0 AND uc.balance < 10 THEN 1 END)::bigint
  FROM public.user_credits uc;
END;
$$;

-- 3. Функция для получения статистики генераций
CREATE OR REPLACE FUNCTION public.get_generation_stats(_time_period interval DEFAULT '24 hours'::interval)
RETURNS TABLE (
  total_generations bigint,
  completed bigint,
  failed bigint,
  pending bigint,
  processing bigint,
  success_rate numeric,
  avg_duration_seconds numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint,
    COUNT(CASE WHEN gt.status = 'completed' THEN 1 END)::bigint,
    COUNT(CASE WHEN gt.status = 'failed' THEN 1 END)::bigint,
    COUNT(CASE WHEN gt.status = 'pending' THEN 1 END)::bigint,
    COUNT(CASE WHEN gt.status = 'processing' THEN 1 END)::bigint,
    ROUND(
      (COUNT(CASE WHEN gt.status = 'completed' THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 
      2
    ),
    ROUND(
      AVG(
        CASE WHEN gt.completed_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (gt.completed_at - gt.created_at)) 
        END
      )::numeric, 
      2
    )
  FROM public.generation_tasks gt
  WHERE gt.created_at >= now() - _time_period;
END;
$$;

-- 4. Функция для аналитики диплинков
CREATE OR REPLACE FUNCTION public.get_deeplink_stats(_time_period interval DEFAULT '7 days'::interval)
RETURNS TABLE (
  total_clicks bigint,
  unique_users bigint,
  conversions bigint,
  conversion_rate numeric,
  top_sources jsonb,
  top_types jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _clicks bigint;
  _users bigint;
  _conversions bigint;
  _conv_rate numeric;
  _top_sources jsonb;
  _top_types jsonb;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(DISTINCT da.user_id),
    COUNT(CASE WHEN da.converted = true THEN 1 END)
  INTO _clicks, _users, _conversions
  FROM deeplink_analytics da
  WHERE da.created_at >= now() - _time_period;
  
  _conv_rate := ROUND((_conversions::numeric / NULLIF(_clicks, 0)) * 100, 2);
  
  SELECT jsonb_agg(row_to_json(t))
  INTO _top_sources
  FROM (
    SELECT da.source, COUNT(*) as count
    FROM deeplink_analytics da
    WHERE da.created_at >= now() - _time_period AND da.source IS NOT NULL
    GROUP BY da.source
    ORDER BY count DESC
    LIMIT 10
  ) t;
  
  SELECT jsonb_agg(row_to_json(t))
  INTO _top_types
  FROM (
    SELECT da.deeplink_type, COUNT(*) as count
    FROM deeplink_analytics da
    WHERE da.created_at >= now() - _time_period
    GROUP BY da.deeplink_type
    ORDER BY count DESC
    LIMIT 10
  ) t;
  
  RETURN QUERY SELECT 
    _clicks,
    _users,
    _conversions,
    _conv_rate,
    COALESCE(_top_sources, '[]'::jsonb),
    COALESCE(_top_types, '[]'::jsonb);
END;
$$;

-- 5. Функция для аналитики поведения
CREATE OR REPLACE FUNCTION public.get_user_behavior_stats(_time_period interval DEFAULT '7 days'::interval)
RETURNS TABLE (
  total_events bigint,
  unique_sessions bigint,
  unique_users bigint,
  events_by_type jsonb,
  top_pages jsonb,
  hourly_distribution jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _events bigint;
  _sessions bigint;
  _users bigint;
  _by_type jsonb;
  _top_pages jsonb;
  _hourly jsonb;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(DISTINCT uae.session_id),
    COUNT(DISTINCT uae.user_id)
  INTO _events, _sessions, _users
  FROM user_analytics_events uae
  WHERE uae.created_at >= now() - _time_period;
  
  SELECT jsonb_object_agg(uae.event_type, cnt)
  INTO _by_type
  FROM (
    SELECT uae.event_type, COUNT(*) as cnt
    FROM user_analytics_events uae
    WHERE uae.created_at >= now() - _time_period
    GROUP BY uae.event_type
  ) uae;
  
  SELECT jsonb_agg(row_to_json(t))
  INTO _top_pages
  FROM (
    SELECT uae.page_path, COUNT(*) as views
    FROM user_analytics_events uae
    WHERE uae.created_at >= now() - _time_period 
      AND uae.event_type = 'page_view'
      AND uae.page_path IS NOT NULL
    GROUP BY uae.page_path
    ORDER BY views DESC
    LIMIT 10
  ) t;
  
  SELECT jsonb_object_agg(hour, cnt)
  INTO _hourly
  FROM (
    SELECT EXTRACT(HOUR FROM uae.created_at)::int as hour, COUNT(*) as cnt
    FROM user_analytics_events uae
    WHERE uae.created_at >= now() - _time_period
    GROUP BY hour
    ORDER BY hour
  ) sub;
  
  RETURN QUERY SELECT 
    _events,
    _sessions,
    _users,
    COALESCE(_by_type, '{}'::jsonb),
    COALESCE(_top_pages, '[]'::jsonb),
    COALESCE(_hourly, '{}'::jsonb);
END;
$$;

-- 6. RLS для user_analytics_events
DROP POLICY IF EXISTS "Service can insert analytics events" ON public.user_analytics_events;
CREATE POLICY "Service can insert analytics events" 
  ON public.user_analytics_events 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own analytics" ON public.user_analytics_events;
CREATE POLICY "Users can view own analytics" 
  ON public.user_analytics_events 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all analytics" ON public.user_analytics_events;
CREATE POLICY "Admins can view all analytics" 
  ON public.user_analytics_events 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role));