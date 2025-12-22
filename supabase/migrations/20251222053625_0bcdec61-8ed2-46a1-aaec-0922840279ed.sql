-- Add inline search menu items with switch_inline action type
INSERT INTO telegram_menu_items (menu_key, parent_key, title, icon_emoji, action_type, action_data, caption, description, sort_order, is_enabled)
VALUES 
  ('inline_search', 'main', 'ПОИСК', '🔍', 'submenu', NULL, 
   '🔍 *Поиск треков*\n\nИспользуйте inline\\-режим для быстрого поиска и отправки музыки в любой чат\\.', 
   'Быстрый поиск музыки в inline-режиме', 50, true),
  ('inline_my', 'inline_search', 'Мои треки', '🎵', 'switch_inline', 'my:', 
   NULL, 'Найти и отправить свои треки', 1, true),
  ('inline_public', 'inline_search', 'Публичные', '🌐', 'switch_inline', 'public:', 
   NULL, 'Поиск публичных треков', 2, true),
  ('inline_trending', 'inline_search', 'Тренды', '🔥', 'switch_inline', 'trending:', 
   NULL, 'Популярные треки сейчас', 3, true),
  ('inline_new', 'inline_search', 'Новое', '⭐', 'switch_inline', 'new:', 
   NULL, 'Свежие релизы за 24ч', 4, true),
  ('inline_genre', 'inline_search', 'По жанру', '🎸', 'switch_inline', 'genre:', 
   NULL, 'Поиск по жанрам', 5, true),
  ('inline_mood', 'inline_search', 'По настроению', '💭', 'switch_inline', 'mood:', 
   NULL, 'Поиск по настроению', 6, true),
  ('inline_projects', 'inline_search', 'Проекты', '📁', 'switch_inline', 'project:', 
   NULL, 'Поиск проектов', 7, true)
ON CONFLICT (menu_key) DO UPDATE SET
  parent_key = EXCLUDED.parent_key,
  title = EXCLUDED.title,
  icon_emoji = EXCLUDED.icon_emoji,
  action_type = EXCLUDED.action_type,
  action_data = EXCLUDED.action_data,
  caption = EXCLUDED.caption,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_enabled = EXCLUDED.is_enabled;

-- Create table for tracking inline result choices (analytics)
CREATE TABLE IF NOT EXISTS inline_result_chosen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  telegram_user_id BIGINT NOT NULL,
  result_id TEXT NOT NULL,
  result_type TEXT,
  query TEXT,
  inline_message_id TEXT,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_inline_result_chosen_telegram_user ON inline_result_chosen(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_inline_result_chosen_created_at ON inline_result_chosen(created_at);
CREATE INDEX IF NOT EXISTS idx_inline_result_chosen_result_type ON inline_result_chosen(result_type);

-- Enable RLS
ALTER TABLE inline_result_chosen ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can view own inline choices" ON inline_result_chosen
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Service can insert inline choices (from edge function)
CREATE POLICY "Service can insert inline choices" ON inline_result_chosen
  FOR INSERT WITH CHECK (true);

-- Add share_count column to tracks if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'share_count') THEN
    ALTER TABLE tracks ADD COLUMN share_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create function to increment share count
CREATE OR REPLACE FUNCTION increment_track_share_count(track_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE tracks SET share_count = COALESCE(share_count, 0) + 1 WHERE id = track_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;