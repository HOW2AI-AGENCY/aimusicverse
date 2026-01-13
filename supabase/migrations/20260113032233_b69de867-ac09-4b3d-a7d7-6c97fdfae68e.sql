
-- Отключаем RLS на служебных таблицах Telegram бота
-- Эти таблицы управляются только через Edge Functions с service role
-- и не содержат чувствительных пользовательских данных

-- failed_telegram_notifications - очередь повторных уведомлений
ALTER TABLE public.failed_telegram_notifications DISABLE ROW LEVEL SECURITY;

-- telegram_bot_sessions - сессии бота (технические данные)
ALTER TABLE public.telegram_bot_sessions DISABLE ROW LEVEL SECURITY;

-- telegram_menu_state - состояние меню бота
ALTER TABLE public.telegram_menu_state DISABLE ROW LEVEL SECURITY;

-- telegram_rate_limits - rate limiting (технические данные)
ALTER TABLE public.telegram_rate_limits DISABLE ROW LEVEL SECURITY;
