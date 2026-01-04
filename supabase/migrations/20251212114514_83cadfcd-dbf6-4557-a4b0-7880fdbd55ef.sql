-- Таблица для хранения сессий бота (вместо in-memory storage)
CREATE TABLE IF NOT EXISTS public.telegram_bot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL,
  session_type TEXT NOT NULL, -- 'pending_upload', 'awaiting_audio', etc.
  mode TEXT, -- 'cover', 'extend', 'upload'
  options JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_sessions_user ON public.telegram_bot_sessions(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_expires ON public.telegram_bot_sessions(expires_at);

-- Таблица конфигурации бота
CREATE TABLE IF NOT EXISTS public.telegram_bot_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_bot_config_key ON public.telegram_bot_config(config_key);

-- RLS политики для сессий
ALTER TABLE public.telegram_bot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage sessions" ON public.telegram_bot_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- RLS политики для конфигурации
ALTER TABLE public.telegram_bot_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bot config" ON public.telegram_bot_config
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can read config" ON public.telegram_bot_config
  FOR SELECT USING (true);

-- Функция очистки истёкших сессий
CREATE OR REPLACE FUNCTION public.cleanup_expired_bot_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.telegram_bot_sessions
  WHERE expires_at < now();
END;
$$;

-- Вставляем начальную конфигурацию
INSERT INTO public.telegram_bot_config (config_key, config_value, description) VALUES
  ('welcome_message', '"🎵 Добро пожаловать в MusicVerse AI!\n\nЯ помогу вам создавать музыку с помощью ИИ."', 'Приветственное сообщение'),
  ('track_ready_message', '"🎉 Ваш трек готов!"', 'Сообщение о готовности трека'),
  ('error_message', '"😔 Не удалось выполнить операцию. Попробуйте позже."', 'Сообщение об ошибке'),
  ('notifications_enabled', 'true', 'Включены ли уведомления о генерации'),
  ('error_notifications_enabled', 'true', 'Включены ли уведомления об ошибках'),
  ('system_notifications_enabled', 'false', 'Включены ли системные уведомления'),
  ('rate_limiting_enabled', 'true', 'Включено ли ограничение частоты'),
  ('commands', '[{"command":"/start","description":"Запустить бота","enabled":true},{"command":"/help","description":"Справка по командам","enabled":true},{"command":"/generate","description":"Создать трек","enabled":true},{"command":"/library","description":"Моя библиотека","enabled":true},{"command":"/cover","description":"Создать кавер","enabled":true},{"command":"/extend","description":"Расширить трек","enabled":true},{"command":"/upload","description":"Загрузить аудио","enabled":true},{"command":"/cancel","description":"Отменить операцию","enabled":true}]', 'Список команд бота')
ON CONFLICT (config_key) DO NOTHING;