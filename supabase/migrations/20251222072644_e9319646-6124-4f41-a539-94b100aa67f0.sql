-- Create subscription_tiers table for managing pricing plans
CREATE TABLE public.subscription_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- free, basic, pro, premium, enterprise
  name JSONB NOT NULL DEFAULT '{}', -- { "en": "Free", "ru": "Бесплатный" }
  description JSONB NOT NULL DEFAULT '{}', -- Multi-language descriptions
  icon_emoji TEXT NOT NULL DEFAULT '⚡', -- Emoji for display
  
  -- Pricing
  price_usd NUMERIC(10,2) DEFAULT 0, -- Price in USD
  price_stars INTEGER DEFAULT 0, -- Price in Telegram Stars
  price_robokassa NUMERIC(10,2) DEFAULT 0, -- Price for Robokassa (RUB)
  
  -- Credits
  credits_amount INTEGER NOT NULL DEFAULT 0, -- Credits per period
  credits_period TEXT NOT NULL DEFAULT 'month', -- day, week, month, year
  
  -- Features
  max_concurrent_generations INTEGER DEFAULT 2,
  audio_quality TEXT DEFAULT 'standard', -- standard, hd, ultra
  has_priority BOOLEAN DEFAULT false,
  has_stem_separation BOOLEAN DEFAULT false,
  has_mastering BOOLEAN DEFAULT false,
  has_midi_export BOOLEAN DEFAULT false,
  has_api_access BOOLEAN DEFAULT false,
  has_dedicated_support BOOLEAN DEFAULT false,
  
  -- Display
  display_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  badge_text TEXT, -- "Популярный", "Лучшая цена"
  color TEXT, -- For UI theming
  
  -- Business logic
  min_purchase_amount NUMERIC(10,2) DEFAULT 0, -- For enterprise
  custom_pricing BOOLEAN DEFAULT false, -- For enterprise negotiations
  
  -- Metadata
  features JSONB DEFAULT '[]', -- Additional feature flags
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view active tiers"
ON public.subscription_tiers
FOR SELECT
USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage tiers"
ON public.subscription_tiers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_subscription_tiers_updated_at
  BEFORE UPDATE ON public.subscription_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default tiers with correct emojis
INSERT INTO public.subscription_tiers (code, name, description, icon_emoji, price_usd, price_stars, price_robokassa, credits_amount, credits_period, display_order, max_concurrent_generations, audio_quality, has_priority, has_stem_separation, has_mastering, has_midi_export, features, badge_text) VALUES

('free', 
  '{"en": "FREE", "ru": "БЕСПЛАТНЫЙ"}'::jsonb,
  '{"en": "50 credits per day, basic generation", "ru": "50 кредитов в сутки, базовая генерация"}'::jsonb,
  '⚡', 0, 0, 0, 50, 'day', 0, 2, 'standard', false, false, false, false,
  '["Базовая генерация", "2 трека одновременно", "Стандартное качество"]'::jsonb,
  NULL
),

('basic',
  '{"en": "BASIC", "ru": "БАЗОВЫЙ"}'::jsonb,
  '{"en": "1000 credits per month, priority generation", "ru": "1000 кредитов в месяц, приоритетная генерация"}'::jsonb,
  '🥉', 10, 500, 950, 1000, 'month', 1, 3, 'hd', true, false, false, false,
  '["1000 кредитов/месяц", "Приоритетная генерация", "HD качество", "3 трека одновременно"]'::jsonb,
  NULL
),

('pro',
  '{"en": "PRO", "ru": "ПРО"}'::jsonb,
  '{"en": "2250 credits per month, HD quality, stem separation", "ru": "2250 кредитов в месяц, HD качество, stem-сепарация"}'::jsonb,
  '🥈', 18, 900, 1750, 2250, 'month', 2, 5, 'hd', true, true, false, true,
  '["2250 кредитов/месяц", "HD качество", "5 треков одновременно", "Stem-сепарация", "MIDI экспорт"]'::jsonb,
  'Популярный'
),

('premium',
  '{"en": "PREMIUM", "ru": "ПРЕМИУМ"}'::jsonb,
  '{"en": "5000 credits per month, Ultra HD, mastering", "ru": "5000 кредитов в месяц, Ultra HD качество, мастеринг"}'::jsonb,
  '🥇', 29, 1450, 2800, 5000, 'month', 3, 10, 'ultra', true, true, true, true,
  '["5000 кредитов/месяц", "Ultra HD качество", "10 треков одновременно", "Полный анализ + MIDI", "Мастеринг", "Приоритетная поддержка"]'::jsonb,
  'Лучшая цена'
),

('enterprise',
  '{"en": "ENTERPRISE", "ru": "КОРПОРАТИВНЫЙ"}'::jsonb,
  '{"en": "Custom pricing, API access, dedicated support", "ru": "Договорная цена, API доступ, выделенная поддержка"}'::jsonb,
  '🏆', 50, 0, 4500, 0, 'month', 4, 0, 'ultra', true, true, true, true,
  '["Безлимитные кредиты", "API доступ", "White-label решение", "SLA гарантии", "Персональная поддержка 24/7", "Кастомные модели"]'::jsonb,
  'Для бизнеса'
);

-- Update enterprise tier settings
UPDATE public.subscription_tiers 
SET custom_pricing = true, 
    min_purchase_amount = 50,
    has_api_access = true,
    has_dedicated_support = true
WHERE code = 'enterprise';

-- Add index for quick lookups
CREATE INDEX idx_subscription_tiers_code ON public.subscription_tiers(code);
CREATE INDEX idx_subscription_tiers_active ON public.subscription_tiers(is_active, display_order);

-- Update menu items with correct emojis
UPDATE telegram_menu_items SET icon_emoji = '⚡', title = '⚡ Бесплатный' WHERE menu_key = 'tariff_free';
UPDATE telegram_menu_items SET icon_emoji = '🥉', title = '🥉 Basic' WHERE menu_key = 'tariff_basic' OR menu_key = 'tariff_pro';
UPDATE telegram_menu_items SET icon_emoji = '🥈', title = '🥈 Pro' WHERE menu_key = 'tariff_pro';
UPDATE telegram_menu_items SET icon_emoji = '🥇', title = '🥇 Premium' WHERE menu_key = 'tariff_premium';
UPDATE telegram_menu_items SET icon_emoji = '🏆', title = '🏆 Enterprise' WHERE menu_key = 'tariff_enterprise';