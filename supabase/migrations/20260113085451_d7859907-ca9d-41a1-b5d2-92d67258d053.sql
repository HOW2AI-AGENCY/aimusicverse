-- Таблица для рекуррентных подписок Тинькофф
CREATE TABLE IF NOT EXISTS public.tinkoff_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  rebill_id TEXT NOT NULL,  -- Тинькофф RebillId для автосписания
  card_pan TEXT,  -- Маска карты **** 1234
  card_exp_date TEXT,  -- Срок действия MM/YY
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RUB',
  billing_cycle_days INTEGER NOT NULL DEFAULT 30,
  next_billing_date TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  last_payment_id UUID REFERENCES payment_transactions(id),
  failed_attempts INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Индексы
CREATE INDEX idx_tinkoff_subs_user_id ON tinkoff_subscriptions(user_id);
CREATE INDEX idx_tinkoff_subs_status ON tinkoff_subscriptions(status);
CREATE INDEX idx_tinkoff_subs_next_billing ON tinkoff_subscriptions(next_billing_date) WHERE status = 'active';
CREATE UNIQUE INDEX idx_tinkoff_subs_user_product ON tinkoff_subscriptions(user_id, product_code) WHERE status = 'active';

-- RLS политики
ALTER TABLE tinkoff_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
ON tinkoff_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions"
ON tinkoff_subscriptions FOR ALL
USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- Добавить поле recurrent в payment_transactions для связи с подпиской
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES tinkoff_subscriptions(id);
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS is_recurrent BOOLEAN DEFAULT false;

-- Добавить поле price_rub_cents в stars_products если его нет
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stars_products' AND column_name = 'price_rub_cents') THEN
    ALTER TABLE stars_products ADD COLUMN price_rub_cents INTEGER;
  END IF;
END $$;

-- Обновить цены в рублях для существующих продуктов (примерные цены)
UPDATE stars_products SET price_rub_cents = stars_price * 200 WHERE price_rub_cents IS NULL;

-- Триггер для updated_at
CREATE OR REPLACE FUNCTION update_tinkoff_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tinkoff_subscriptions_updated_at
  BEFORE UPDATE ON tinkoff_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_tinkoff_subscription_updated_at();