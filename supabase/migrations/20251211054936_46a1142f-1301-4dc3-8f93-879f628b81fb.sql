-- Populate stars_products with credit packages and subscriptions
-- Clear existing products first (if any)
DELETE FROM public.stars_products WHERE product_code IN (
  'credits_50', 'credits_150', 'credits_500', 
  'sub_basic', 'sub_pro', 'sub_enterprise'
);

-- Credit packages
INSERT INTO public.stars_products (product_code, name, description, product_type, stars_price, credits_amount, is_popular, sort_order, status) VALUES
('credits_50', '{"en": "Starter Pack", "ru": "Стартовый пакет"}', '{"en": "50 credits for generation", "ru": "50 кредитов для генерации"}', 'credit_package', 50, 50, false, 1, 'active'),
('credits_150', '{"en": "Popular Pack", "ru": "Популярный пакет"}', '{"en": "150 credits + 20 bonus", "ru": "150 кредитов + 20 бонус"}', 'credit_package', 100, 170, true, 2, 'active'),
('credits_500', '{"en": "Professional Pack", "ru": "Профессиональный пакет"}', '{"en": "500 credits + 100 bonus", "ru": "500 кредитов + 100 бонус"}', 'credit_package', 300, 600, false, 3, 'active');

-- Subscription products
INSERT INTO public.stars_products (product_code, name, description, product_type, stars_price, subscription_days, credits_amount, features, is_popular, sort_order, status) VALUES
('sub_basic', '{"en": "Basic", "ru": "Базовая"}', '{"en": "Basic subscription", "ru": "Базовая подписка"}', 'subscription', 200, 30, 100, '["100 кредитов/мес", "Приоритетная генерация", "Скидка 10%"]', false, 10, 'active'),
('sub_pro', '{"en": "Pro", "ru": "Профессиональная"}', '{"en": "Professional subscription", "ru": "Профессиональная подписка"}', 'subscription', 500, 30, 300, '["300 кредитов/мес", "Безлимит стемов", "MIDI экспорт", "Скидка 25%"]', true, 11, 'active'),
('sub_enterprise', '{"en": "Enterprise", "ru": "Для студий"}', '{"en": "Studio subscription", "ru": "Подписка для студий"}', 'subscription', 1000, 30, 1000, '["1000 кредитов/мес", "API доступ", "Коммерческая лицензия", "Скидка 50%"]', false, 12, 'active');

-- Add subscription_expires_at to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;