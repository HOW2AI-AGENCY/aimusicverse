-- Delete inline_search menu items
DELETE FROM telegram_menu_items WHERE menu_key LIKE 'inline_%';

-- Update tariffs to be a submenu instead of webapp
UPDATE telegram_menu_items 
SET action_type = 'submenu', action_data = NULL 
WHERE menu_key = 'tariffs';

-- Update feedback to be a submenu
UPDATE telegram_menu_items 
SET action_type = 'submenu', action_data = NULL 
WHERE menu_key = 'feedback';

-- Create user_feedback table for storing feedback messages
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  telegram_id BIGINT NOT NULL,
  telegram_chat_id BIGINT,
  type TEXT NOT NULL CHECK (type IN ('support', 'bug', 'idea', 'rating')),
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'closed')),
  admin_reply TEXT,
  replied_by UUID,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_user_feedback_status ON user_feedback(status);
CREATE INDEX idx_user_feedback_type ON user_feedback(type);
CREATE INDEX idx_user_feedback_created_at ON user_feedback(created_at DESC);
CREATE INDEX idx_user_feedback_telegram_id ON user_feedback(telegram_id);

-- Enable RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Service role can insert feedback from bot
CREATE POLICY "Service can insert feedback"
ON user_feedback FOR INSERT
WITH CHECK (true);

-- Users can view own feedback
CREATE POLICY "Users can view own feedback"
ON user_feedback FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
ON user_feedback FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update feedback (for replies)
CREATE POLICY "Admins can update feedback"
ON user_feedback FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert tariff submenu items
INSERT INTO telegram_menu_items (menu_key, parent_key, title, caption, description, icon_emoji, action_type, action_data, sort_order) VALUES
('tariff_free', 'tariffs', '🆓 Бесплатный', 
'🆓 *БЕСПЛАТНЫЙ ТАРИФ*

✅ 5 кредитов в день
✅ Базовая генерация музыки
✅ 2 трека одновременно
✅ Стандартное качество

_Идеально для знакомства с платформой\\!_',
'Бесплатный тариф для начала работы', '🆓', 'callback', 'tariff_info_free', 0),

('tariff_pro', 'tariffs', '⭐ Pro', 
'⭐ *PRO ТАРИФ*

💰 *499 Stars / месяц*

✅ 100 кредитов в месяц
✅ Приоритетная генерация
✅ 5 треков одновременно
✅ HD качество
✅ Расширенный анализ
✅ Stem\\-сепарация

_Для активных музыкантов\\!_',
'Pro тариф с расширенными возможностями', '⭐', 'callback', 'tariff_buy_pro', 1),

('tariff_premium', 'tariffs', '💎 Premium', 
'💎 *PREMIUM ТАРИФ*

💰 *1499 Stars / месяц*

✅ 500 кредитов в месяц
✅ Максимальный приоритет
✅ 10 треков одновременно
✅ Ultra HD качество
✅ Полный анализ \\+ MIDI
✅ Stem\\-сепарация \\+ мастеринг
✅ Приватный менеджер

_Для профессионалов\\!_',
'Premium тариф для профессионалов', '💎', 'callback', 'tariff_buy_premium', 2),

('tariff_enterprise', 'tariffs', '👑 Enterprise', 
'👑 *ENTERPRISE ТАРИФ*

💰 *Индивидуально*

✅ Безлимитные кредиты
✅ API доступ
✅ White\\-label решение
✅ Выделенные ресурсы
✅ SLA гарантии
✅ Персональная поддержка 24/7
✅ Кастомные модели

_Свяжитесь с нами\\!_',
'Enterprise решение для компаний', '👑', 'callback', 'tariff_contact_enterprise', 3)
ON CONFLICT (menu_key) DO UPDATE SET
  parent_key = EXCLUDED.parent_key,
  title = EXCLUDED.title,
  caption = EXCLUDED.caption,
  description = EXCLUDED.description,
  icon_emoji = EXCLUDED.icon_emoji,
  action_type = EXCLUDED.action_type,
  action_data = EXCLUDED.action_data,
  sort_order = EXCLUDED.sort_order;