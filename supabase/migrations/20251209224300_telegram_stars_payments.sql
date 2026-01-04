-- =====================================================
-- Telegram Stars Payment System
-- Created: 2025-12-09
-- Description: Tables and functions for Telegram Stars integration
-- =====================================================

-- =====================================================
-- 1. PRODUCTS CATALOG
-- =====================================================

-- Product types enum
CREATE TYPE public.stars_product_type AS ENUM ('credit_package', 'subscription');

-- Product status enum  
CREATE TYPE public.stars_product_status AS ENUM ('active', 'inactive', 'archived');

-- Products table
CREATE TABLE public.stars_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Product identification
  product_code TEXT NOT NULL UNIQUE, -- e.g., 'credits_100', 'sub_pro'
  product_type public.stars_product_type NOT NULL,
  
  -- Display info
  name JSONB NOT NULL, -- { "en": "100 Credits", "ru": "100 Кредитов" }
  description JSONB NOT NULL, -- { "en": "...", "ru": "..." }
  
  -- Pricing
  stars_price INTEGER NOT NULL CHECK (stars_price > 0), -- Price in Telegram Stars (XTR)
  
  -- Product content
  credits_amount INTEGER, -- For credit packages: how many credits
  subscription_tier TEXT, -- For subscriptions: 'premium', 'pro'
  subscription_duration_days INTEGER, -- For subscriptions: duration
  
  -- Features
  features JSONB DEFAULT '[]'::jsonb, -- Array of feature strings
  
  -- Status
  status public.stars_product_status DEFAULT 'active',
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_stars_products_type ON public.stars_products(product_type);
CREATE INDEX idx_stars_products_status ON public.stars_products(status);
CREATE INDEX idx_stars_products_featured ON public.stars_products(is_featured) WHERE is_featured = true;

-- RLS Policies
ALTER TABLE public.stars_products ENABLE ROW LEVEL SECURITY;

-- Everyone can view active products
CREATE POLICY "Anyone can view active products"
  ON public.stars_products FOR SELECT
  USING (status = 'active');

-- Only admins can manage products
CREATE POLICY "Admins can manage products"
  ON public.stars_products FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE is_admin = true
    )
  );

COMMENT ON TABLE public.stars_products IS 'Telegram Stars product catalog (credit packages and subscriptions)';

-- =====================================================
-- 2. TRANSACTIONS TABLE
-- =====================================================

-- Transaction status enum
CREATE TYPE public.stars_transaction_status AS ENUM (
  'pending',        -- Invoice created, awaiting payment
  'processing',     -- Pre-checkout query received
  'completed',      -- Payment successful, credits granted
  'failed',         -- Payment failed
  'cancelled',      -- User cancelled
  'refunded'        -- Payment refunded
);

-- Transactions table
CREATE TABLE public.stars_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User & Product
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.stars_products(id),
  
  -- Telegram data
  telegram_payment_charge_id TEXT UNIQUE, -- From successful_payment
  telegram_user_id BIGINT NOT NULL, -- Telegram user ID
  invoice_payload TEXT NOT NULL, -- JSON payload sent with invoice
  
  -- Payment details
  stars_amount INTEGER NOT NULL CHECK (stars_amount > 0), -- Amount in Stars (XTR)
  credits_granted INTEGER, -- Credits granted (for credit packages)
  subscription_granted TEXT, -- Subscription tier granted
  
  -- Status & metadata
  status public.stars_transaction_status DEFAULT 'pending' NOT NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional data
  
  -- Idempotency
  idempotency_key TEXT UNIQUE, -- Prevent duplicate processing
  processed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_stars_transactions_user ON public.stars_transactions(user_id);
CREATE INDEX idx_stars_transactions_status ON public.stars_transactions(status);
CREATE INDEX idx_stars_transactions_telegram_id ON public.stars_transactions(telegram_payment_charge_id);
CREATE INDEX idx_stars_transactions_created ON public.stars_transactions(created_at DESC);
CREATE INDEX idx_stars_transactions_idempotency ON public.stars_transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- RLS Policies
ALTER TABLE public.stars_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.stars_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert transactions (via service role)
CREATE POLICY "Service role can insert transactions"
  ON public.stars_transactions FOR INSERT
  WITH CHECK (true);

-- System can update transactions (via service role)
CREATE POLICY "Service role can update transactions"
  ON public.stars_transactions FOR UPDATE
  USING (true);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON public.stars_transactions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE is_admin = true
    )
  );

COMMENT ON TABLE public.stars_transactions IS 'Telegram Stars payment transactions';

-- =====================================================
-- 3. SUBSCRIPTION HISTORY
-- =====================================================

-- Subscription status enum
CREATE TYPE public.subscription_status AS ENUM (
  'active',
  'expired',
  'cancelled',
  'pending'
);

-- Subscription history table
CREATE TABLE public.subscription_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User & subscription
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.stars_transactions(id),
  
  -- Subscription details
  tier TEXT NOT NULL, -- 'premium', 'pro'
  
  -- Period
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Status
  status public.subscription_status DEFAULT 'active' NOT NULL,
  cancelled_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_subscription_history_user ON public.subscription_history(user_id);
CREATE INDEX idx_subscription_history_status ON public.subscription_history(status);
CREATE INDEX idx_subscription_history_expires ON public.subscription_history(expires_at);
CREATE INDEX idx_subscription_history_active ON public.subscription_history(user_id, status, expires_at) 
  WHERE status = 'active';

-- RLS Policies
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.subscription_history FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscription_history FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE is_admin = true
    )
  );

COMMENT ON TABLE public.subscription_history IS 'User subscription history from Stars purchases';

-- =====================================================
-- 4. EXTEND EXISTING TABLES
-- =====================================================

-- Extend credit_transactions to link Stars payments
ALTER TABLE public.credit_transactions
ADD COLUMN IF NOT EXISTS stars_transaction_id UUID REFERENCES public.stars_transactions(id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_stars 
  ON public.credit_transactions(stars_transaction_id) 
  WHERE stars_transaction_id IS NOT NULL;

COMMENT ON COLUMN public.credit_transactions.stars_transaction_id IS 'Link to Stars payment transaction';

-- Extend profiles to track active subscription
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active_subscription_id UUID REFERENCES public.subscription_history(id),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription 
  ON public.profiles(active_subscription_id) 
  WHERE active_subscription_id IS NOT NULL;

COMMENT ON COLUMN public.profiles.active_subscription_id IS 'Currently active subscription';
COMMENT ON COLUMN public.profiles.subscription_expires_at IS 'When current subscription expires (denormalized for performance)';

-- =====================================================
-- 5. DATABASE FUNCTIONS
-- =====================================================

-- Function: Process Stars payment
CREATE OR REPLACE FUNCTION public.process_stars_payment(
  p_transaction_id UUID,
  p_telegram_payment_charge_id TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_transaction RECORD;
  v_product RECORD;
  v_user_id UUID;
  v_credit_transaction_id UUID;
  v_subscription_id UUID;
  v_result JSONB;
BEGIN
  -- Get transaction
  SELECT * INTO v_transaction
  FROM public.stars_transactions
  WHERE id = p_transaction_id
    AND status = 'processing'
  FOR UPDATE; -- Lock row

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transaction not found or not in processing status'
    );
  END IF;

  -- Check idempotency
  IF v_transaction.processed_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Transaction already processed',
      'transaction_id', v_transaction.id
    );
  END IF;

  -- Get product
  SELECT * INTO v_product
  FROM public.stars_products
  WHERE id = v_transaction.product_id;

  v_user_id := v_transaction.user_id;

  -- Process based on product type
  IF v_product.product_type = 'credit_package' THEN
    -- Grant credits
    INSERT INTO public.credit_transactions (
      user_id,
      amount,
      action_type,
      description,
      metadata,
      stars_transaction_id
    ) VALUES (
      v_user_id,
      v_product.credits_amount,
      'purchase',
      format('Stars purchase: %s', v_product.name->>'en'),
      p_metadata,
      p_transaction_id
    )
    RETURNING id INTO v_credit_transaction_id;

    -- Update transaction
    UPDATE public.stars_transactions
    SET 
      status = 'completed',
      telegram_payment_charge_id = p_telegram_payment_charge_id,
      credits_granted = v_product.credits_amount,
      processed_at = now(),
      updated_at = now()
    WHERE id = p_transaction_id;

    v_result := jsonb_build_object(
      'success', true,
      'type', 'credits',
      'credits_granted', v_product.credits_amount,
      'credit_transaction_id', v_credit_transaction_id
    );

  ELSIF v_product.product_type = 'subscription' THEN
    -- Create subscription
    INSERT INTO public.subscription_history (
      user_id,
      transaction_id,
      tier,
      starts_at,
      expires_at,
      status
    ) VALUES (
      v_user_id,
      p_transaction_id,
      v_product.subscription_tier,
      now(),
      now() + (v_product.subscription_duration_days || ' days')::INTERVAL,
      'active'
    )
    RETURNING id INTO v_subscription_id;

    -- Update profile
    UPDATE public.profiles
    SET 
      subscription_tier = v_product.subscription_tier::public.subscription_tier,
      active_subscription_id = v_subscription_id,
      subscription_expires_at = now() + (v_product.subscription_duration_days || ' days')::INTERVAL
    WHERE user_id = v_user_id;

    -- Update transaction
    UPDATE public.stars_transactions
    SET 
      status = 'completed',
      telegram_payment_charge_id = p_telegram_payment_charge_id,
      subscription_granted = v_product.subscription_tier,
      processed_at = now(),
      updated_at = now()
    WHERE id = p_transaction_id;

    v_result := jsonb_build_object(
      'success', true,
      'type', 'subscription',
      'subscription_tier', v_product.subscription_tier,
      'expires_at', now() + (v_product.subscription_duration_days || ' days')::INTERVAL,
      'subscription_id', v_subscription_id
    );
  END IF;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Update transaction to failed
    UPDATE public.stars_transactions
    SET 
      status = 'failed',
      error_message = SQLERRM,
      updated_at = now()
    WHERE id = p_transaction_id;

    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.process_stars_payment IS 'Process Stars payment: grant credits or activate subscription';

-- Function: Get subscription status
CREATE OR REPLACE FUNCTION public.get_subscription_status(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_subscription RECORD;
  v_result JSONB;
BEGIN
  -- Get active subscription
  SELECT * INTO v_subscription
  FROM public.subscription_history
  WHERE user_id = p_user_id
    AND status = 'active'
    AND expires_at > now()
  ORDER BY expires_at DESC
  LIMIT 1;

  IF FOUND THEN
    v_result := jsonb_build_object(
      'has_subscription', true,
      'tier', v_subscription.tier,
      'expires_at', v_subscription.expires_at,
      'days_remaining', EXTRACT(DAY FROM v_subscription.expires_at - now())
    );
  ELSE
    v_result := jsonb_build_object(
      'has_subscription', false,
      'tier', 'free'
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_subscription_status IS 'Get current subscription status for user';

-- Function: Get Stars payment stats (for admin)
CREATE OR REPLACE FUNCTION public.get_stars_payment_stats(
  p_start_date TIMESTAMPTZ DEFAULT now() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_transactions', COUNT(*),
    'completed_transactions', COUNT(*) FILTER (WHERE status = 'completed'),
    'total_stars_collected', COALESCE(SUM(stars_amount) FILTER (WHERE status = 'completed'), 0),
    'total_credits_granted', COALESCE(SUM(credits_granted) FILTER (WHERE status = 'completed'), 0),
    'active_subscriptions', (
      SELECT COUNT(*) 
      FROM public.subscription_history 
      WHERE status = 'active' AND expires_at > now()
    ),
    'period_start', p_start_date,
    'period_end', p_end_date
  ) INTO v_stats
  FROM public.stars_transactions
  WHERE created_at BETWEEN p_start_date AND p_end_date;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_stars_payment_stats IS 'Get Stars payment statistics for admin dashboard';

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Trigger: Update updated_at on stars_products
CREATE OR REPLACE FUNCTION public.update_stars_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stars_products_updated_at
  BEFORE UPDATE ON public.stars_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stars_products_updated_at();

-- Trigger: Update updated_at on stars_transactions
CREATE OR REPLACE FUNCTION public.update_stars_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stars_transactions_updated_at
  BEFORE UPDATE ON public.stars_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stars_transactions_updated_at();

-- Trigger: Update updated_at on subscription_history
CREATE OR REPLACE FUNCTION public.update_subscription_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_history_updated_at
  BEFORE UPDATE ON public.subscription_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_history_updated_at();

-- =====================================================
-- 7. SEED DATA (Sample Products)
-- =====================================================

-- Insert sample credit packages
INSERT INTO public.stars_products (
  product_code,
  product_type,
  name,
  description,
  stars_price,
  credits_amount,
  features,
  is_featured,
  sort_order
) VALUES
  (
    'credits_50',
    'credit_package',
    '{"en": "50 Credits", "ru": "50 Кредитов"}'::jsonb,
    '{"en": "Starter package for trying out MusicVerse AI", "ru": "Стартовый пакет для знакомства с MusicVerse AI"}'::jsonb,
    50,
    50,
    '["Generate up to 10 tracks", "Standard quality", "Personal use"]'::jsonb,
    false,
    1
  ),
  (
    'credits_100',
    'credit_package',
    '{"en": "100 Credits", "ru": "100 Кредитов"}'::jsonb,
    '{"en": "Most popular package for regular creators", "ru": "Самый популярный пакет для постоянных создателей"}'::jsonb,
    100,
    100,
    '["Generate up to 20 tracks", "Standard quality", "Personal use"]'::jsonb,
    true,
    2
  ),
  (
    'credits_300',
    'credit_package',
    '{"en": "300 Credits + 50 Bonus", "ru": "300 Кредитов + 50 Бонус"}'::jsonb,
    '{"en": "Best value with bonus credits", "ru": "Лучшее предложение с бонусными кредитами"}'::jsonb,
    300,
    350,
    '["Generate up to 70 tracks", "Standard quality", "Personal use", "+50 bonus credits"]'::jsonb,
    true,
    3
  ),
  (
    'credits_1000',
    'credit_package',
    '{"en": "1000 Credits + 200 Bonus", "ru": "1000 Кредитов + 200 Бонус"}'::jsonb,
    '{"en": "Pro package for power users", "ru": "Про пакет для активных пользователей"}'::jsonb,
    900,
    1200,
    '["Generate up to 240 tracks", "HD quality", "Commercial use", "+200 bonus credits", "Priority generation"]'::jsonb,
    false,
    4
  );

-- Insert sample subscriptions
INSERT INTO public.stars_products (
  product_code,
  product_type,
  name,
  description,
  stars_price,
  subscription_tier,
  subscription_duration_days,
  features,
  is_featured,
  sort_order
) VALUES
  (
    'sub_premium',
    'subscription',
    '{"en": "Premium Monthly", "ru": "Premium Месячная"}'::jsonb,
    '{"en": "Premium features for serious creators", "ru": "Premium возможности для серьёзных создателей"}'::jsonb,
    500,
    'premium',
    30,
    '["500 credits per month", "HD quality", "Priority queue", "Commercial use", "Advanced features"]'::jsonb,
    true,
    5
  ),
  (
    'sub_pro',
    'subscription',
    '{"en": "Pro Monthly", "ru": "Pro Месячная"}'::jsonb,
    '{"en": "Maximum power for professional musicians", "ru": "Максимальная мощность для профессиональных музыкантов"}'::jsonb,
    1500,
    'enterprise',
    30,
    '["2000 credits per month", "HD quality", "Priority queue", "Commercial use", "API access", "White-label export", "Dedicated support"]'::jsonb,
    false,
    6
  );

-- =====================================================
-- END OF MIGRATION
-- =====================================================
