-- Add daily earning limits columns to user_credits
ALTER TABLE public.user_credits 
ADD COLUMN IF NOT EXISTS daily_earned_today integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_earned_reset_at timestamptz DEFAULT now();

-- Create function to reset daily earnings at midnight
CREATE OR REPLACE FUNCTION public.reset_daily_earnings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_credits
  SET daily_earned_today = 0,
      daily_earned_reset_at = now()
  WHERE daily_earned_reset_at < CURRENT_DATE;
END;
$$;

-- Update subscription_tiers with new PRO and PREMIUM pricing
UPDATE public.subscription_tiers 
SET 
  price_robokassa = 350,
  credits_amount = 500,
  features = '["500 кредитов/месяц", "HD качество аудио", "5 треков одновременно", "Stem-сепарация", "MIDI экспорт", "Нет лимита баланса", "+50% бонус при докупке"]'::jsonb
WHERE code = 'pro';

UPDATE public.subscription_tiers 
SET 
  price_robokassa = 750,
  credits_amount = 1200,
  features = '["1200 кредитов/месяц", "Ultra HD качество", "10 треков одновременно", "AI Мастеринг", "Приоритетная генерация", "Все AI модели", "Персональная поддержка", "+100% бонус при докупке"]'::jsonb
WHERE code = 'premium';

-- Update stars_products for Tinkoff payments (RUB based)
UPDATE public.stars_products
SET 
  stars_price = 350,
  credits_amount = 500,
  description = '500 кредитов + HD качество + Stem-сепарация',
  features = '["500 кредитов/месяц", "HD качество", "5 треков", "Stem-сепарация", "MIDI экспорт"]'::jsonb
WHERE product_code = 'pro_monthly';

UPDATE public.stars_products
SET 
  stars_price = 750,
  credits_amount = 1200,
  description = '1200 кредитов + Ultra HD + AI Мастеринг + Приоритет',
  features = '["1200 кредитов/месяц", "Ultra HD", "10 треков", "AI Мастеринг", "Приоритет", "Все модели"]'::jsonb
WHERE product_code = 'premium_monthly';