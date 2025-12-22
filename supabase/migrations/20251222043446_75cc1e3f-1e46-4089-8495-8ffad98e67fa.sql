-- Create telegram_menu_items table for dynamic bot menu configuration
CREATE TABLE public.telegram_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_key TEXT UNIQUE NOT NULL,
  parent_key TEXT,
  sort_order INTEGER DEFAULT 0,
  
  -- Content
  title TEXT NOT NULL,
  caption TEXT,
  description TEXT,
  
  -- Media
  image_url TEXT,
  image_fallback TEXT,
  
  -- Button action
  action_type TEXT NOT NULL DEFAULT 'callback',
  action_data TEXT,
  
  -- Layout
  row_position INTEGER DEFAULT 0,
  column_span INTEGER DEFAULT 1,
  
  -- Meta
  is_enabled BOOLEAN DEFAULT true,
  show_in_menu BOOLEAN DEFAULT true,
  requires_auth BOOLEAN DEFAULT false,
  icon_emoji TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create telegram_bot_logs table for action logging
CREATE TABLE public.telegram_bot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL,
  chat_id BIGINT NOT NULL,
  action_type TEXT NOT NULL,
  action_data JSONB,
  menu_key TEXT,
  message_id INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_bot_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for telegram_menu_items
CREATE POLICY "Service role can read menu items" ON public.telegram_menu_items
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage menu items" ON public.telegram_menu_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policies for telegram_bot_logs
CREATE POLICY "Service role can insert logs" ON public.telegram_bot_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view logs" ON public.telegram_bot_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_telegram_menu_items_parent ON public.telegram_menu_items(parent_key);
CREATE INDEX idx_telegram_menu_items_enabled ON public.telegram_menu_items(is_enabled, show_in_menu);
CREATE INDEX idx_telegram_bot_logs_user ON public.telegram_bot_logs(telegram_user_id);
CREATE INDEX idx_telegram_bot_logs_time ON public.telegram_bot_logs(created_at DESC);
CREATE INDEX idx_telegram_bot_logs_action ON public.telegram_bot_logs(action_type, created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_telegram_menu_items_updated_at
  BEFORE UPDATE ON public.telegram_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_settings_updated_at();

-- Seed data for main menu structure according to design
INSERT INTO public.telegram_menu_items (menu_key, parent_key, sort_order, title, icon_emoji, action_type, action_data, row_position, column_span) VALUES
  -- Main menu items
  ('main', NULL, 0, 'Главное меню', '🏠', 'callback', 'main_menu', 0, 2),
  ('about', 'main', 1, 'О НАС', 'ℹ️', 'submenu', 'menu_about', 1, 1),
  ('tariffs', 'main', 2, 'ТАРИФЫ', '💎', 'webapp', '/pricing', 1, 1),
  ('open_app', 'main', 3, 'ОТКРЫТЬ ПРИЛОЖЕНИЕ', '🚀', 'webapp', '/', 2, 2),
  ('tracks', 'main', 4, 'ТРЕКИ', '🎵', 'callback', 'nav_library', 3, 1),
  ('projects', 'main', 5, 'ПРОЕКТЫ', '📁', 'callback', 'nav_projects', 3, 1),
  ('blog', 'main', 6, 'НАШ БЛОГ', '📰', 'webapp', '/blog', 4, 2),
  ('profile', 'main', 7, 'ПРОФИЛЬ', '👤', 'callback', 'nav_profile', 5, 1),
  ('settings', 'main', 8, 'НАСТРОЙКИ', '⚙️', 'webapp', '/settings', 5, 1),
  ('guides', 'main', 9, 'РУКОВОДСТВА', '📖', 'submenu', 'menu_guides', 6, 2),
  ('upload', 'main', 10, 'ЗАГРУЗИТЬ', '📤', 'callback', 'nav_upload', 7, 1),
  ('cloud', 'main', 11, 'ОБЛАКО', '☁️', 'webapp', '/cloud', 7, 1),
  ('feedback', 'main', 12, 'ОБРАТНАЯ СВЯЗЬ', '💬', 'url', 'https://t.me/musicverse_support', 8, 2),
  
  -- About submenu
  ('about_company', 'about', 1, 'О компании', '🏢', 'callback', 'about_company', 0, 1),
  ('about_technology', 'about', 2, 'Технологии', '🔬', 'callback', 'about_tech', 0, 1),
  ('about_team', 'about', 3, 'Наша команда', '👥', 'callback', 'about_team', 1, 2),
  ('about_contacts', 'about', 4, 'Контакты', '📞', 'callback', 'about_contacts', 2, 2),
  
  -- Guides submenu
  ('guide_start', 'guides', 1, 'Быстрый старт', '🚀', 'callback', 'guide_start', 0, 2),
  ('guide_generate', 'guides', 2, 'Генерация музыки', '🎵', 'callback', 'guide_generate', 1, 1),
  ('guide_lyrics', 'guides', 3, 'Написание текстов', '📝', 'callback', 'guide_lyrics', 1, 1),
  ('guide_projects', 'guides', 4, 'Работа с проектами', '📁', 'callback', 'guide_projects', 2, 2),
  ('guide_faq', 'guides', 5, 'FAQ', '❓', 'callback', 'guide_faq', 3, 2);