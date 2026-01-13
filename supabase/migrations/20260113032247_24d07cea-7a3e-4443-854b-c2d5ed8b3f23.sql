
-- Включаем RLS обратно и создаём deny-all политики для служебных таблиц
-- Это позволяет service role работать, но блокирует клиентский доступ

-- 1. failed_telegram_notifications
ALTER TABLE public.failed_telegram_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all client access" ON public.failed_telegram_notifications
FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);

-- 2. telegram_bot_sessions
ALTER TABLE public.telegram_bot_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all client access" ON public.telegram_bot_sessions
FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);

-- 3. telegram_menu_state
ALTER TABLE public.telegram_menu_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all client access" ON public.telegram_menu_state
FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);

-- 4. telegram_rate_limits
ALTER TABLE public.telegram_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all client access" ON public.telegram_rate_limits
FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);
