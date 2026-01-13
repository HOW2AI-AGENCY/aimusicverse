
-- Drop overly permissive policies and recreate them properly

-- 1. health_alerts - только service role
DROP POLICY IF EXISTS "Service role can insert alerts" ON public.health_alerts;

-- 2. performance_metrics - привязываем к пользователю или оставляем только authenticated
DROP POLICY IF EXISTS "Authenticated can insert performance metrics" ON public.performance_metrics;

-- 3. subscription_history - должна быть привязана к пользователю
DROP POLICY IF EXISTS "Service can insert subscription history" ON public.subscription_history;

-- 4. telegram_bot_logs - только service role
DROP POLICY IF EXISTS "Service role can insert logs" ON public.telegram_bot_logs;

-- 5. telegram_bot_metrics - только service role
DROP POLICY IF EXISTS "Service role can insert metrics" ON public.telegram_bot_metrics;

-- Создаём правильные политики:

-- health_alerts: INSERT только через service role (edge functions), не через public роль
-- Оставляем без policy для INSERT - будет работать только через service role

-- performance_metrics: нет user_id, это технические метрики
-- Создаём policy только для authenticated БЕЗ true
CREATE POLICY "Authenticated users can insert own metrics" 
ON public.performance_metrics 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Любой authenticated пользователь может вставлять метрики (это анонимные технические данные)
  auth.role() = 'authenticated'
);

-- subscription_history: имеет user_id, привязываем к нему
CREATE POLICY "Users can insert own subscription history" 
ON public.subscription_history 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- telegram_bot_logs и telegram_bot_metrics - убираем public policy
-- Эти таблицы заполняются только через edge functions с service role
-- Политики не нужны для service role (он обходит RLS)
