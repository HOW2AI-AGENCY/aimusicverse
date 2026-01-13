
-- Удаляем overly permissive policies для служебных таблиц
-- Service role обходит RLS, поэтому эти политики не нужны

-- 1. failed_telegram_notifications
DROP POLICY IF EXISTS "Service role can manage failed notifications" ON public.failed_telegram_notifications;

-- 2. klangio_analysis_logs 
DROP POLICY IF EXISTS "Service can manage klangio logs" ON public.klangio_analysis_logs;

-- 3. telegram_bot_sessions
DROP POLICY IF EXISTS "Service role can manage sessions" ON public.telegram_bot_sessions;

-- 4. telegram_menu_state
DROP POLICY IF EXISTS "Service role full access" ON public.telegram_menu_state;

-- 5. telegram_rate_limits
DROP POLICY IF EXISTS "Service role full access for rate limits" ON public.telegram_rate_limits;

-- 6. user_generation_stats
DROP POLICY IF EXISTS "System can manage generation stats" ON public.user_generation_stats;
