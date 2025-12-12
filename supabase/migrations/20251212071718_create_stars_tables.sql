-- Migration: Create Stars Tables for Telegram Stars Payment System
-- Date: 2025-12-12
-- Tasks: T007-T013

BEGIN;

-- ============================================================================
-- Table 1: stars_products
-- ============================================================================
-- Product catalog for credit packages and subscriptions

CREATE TABLE IF NOT EXISTS public.stars_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product identification
  product_type TEXT NOT NULL CHECK (product_type IN ('credits', 'subscription')),
  sku TEXT NOT NULL UNIQUE, -- e.g., 'credits_100', 'sub_pro'
  name TEXT NOT NULL, -- Display name: "100 Credits Package"
  description TEXT,
  
  -- Pricing
  price_stars INTEGER NOT NULL CHECK (price_stars > 0), -- Price in Telegram Stars
  
  -- Credits (for product_type = 'credits')
  credits_amount INTEGER CHECK (
    (product_type = 'credits' AND credits_amount > 0) OR
    (product_type = 'subscription' AND credits_amount IS NULL)
  ),
  
  -- Subscription (for product_type = 'subscription')
  subscription_tier TEXT CHECK (
    (product_type = 'subscription' AND subscription_tier IN ('pro', 'premium', 'enterprise')) OR
    (product_type = 'credits' AND subscription_tier IS NULL)
  ),
  subscription_days INTEGER CHECK (
    (product_type = 'subscription' AND subscription_days > 0) OR
    (product_type = 'credits' AND subscription_days IS NULL)
  ),
  
  -- Display and sorting
  display_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true, -- Can be disabled without deletion
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Flexible storage for future features
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE stars_products IS 'Product catalog for Telegram Stars payments';
COMMENT ON COLUMN stars_products.sku IS 'Unique product identifier (e.g., credits_100, sub_pro)';
COMMENT ON COLUMN stars_products.price_stars IS 'Price in Telegram Stars (1 Star ≈ $0.01)';
COMMENT ON COLUMN stars_products.metadata IS 'Additional product data (tags, badges, promotion codes)';

-- ============================================================================
-- Table 2: stars_transactions
-- ============================================================================
-- Transaction log for all Stars payments

CREATE TABLE IF NOT EXISTS public.stars_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User and product
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES stars_products(id) ON DELETE RESTRICT,
  
  -- Telegram payment details
  telegram_charge_id TEXT NOT NULL UNIQUE, -- Idempotency key from Telegram
  telegram_bot_payment_charge_id TEXT, -- Secondary ID from Telegram
  invoice_payload TEXT NOT NULL, -- Original payload sent in invoice
  
  -- Amount
  amount_stars INTEGER NOT NULL CHECK (amount_stars > 0),
  amount_usd_cents INTEGER, -- Approximate USD value (for analytics)
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  failure_reason TEXT, -- If status = 'failed'
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Telegram payment metadata + custom fields
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);

COMMENT ON TABLE stars_transactions IS 'Log of all Telegram Stars payment transactions';
COMMENT ON COLUMN stars_transactions.telegram_charge_id IS 'Unique payment ID from Telegram (prevents duplicates)';
COMMENT ON COLUMN stars_transactions.invoice_payload IS 'JSON payload from invoice creation (contains product details)';
COMMENT ON COLUMN stars_transactions.amount_usd_cents IS 'USD equivalent in cents (for reporting, not authoritative)';

-- ============================================================================
-- Table 3: subscription_history
-- ============================================================================
-- Audit log for subscription lifecycle events

CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User and subscription
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'premium', 'enterprise')),
  
  -- Action
  action TEXT NOT NULL CHECK (action IN (
    'subscribe',    -- First subscription
    'renew',        -- Auto-renewal
    'upgrade',      -- Tier upgrade (free→pro, pro→premium)
    'downgrade',    -- Tier downgrade (premium→pro, pro→free)
    'cancel',       -- User cancelled
    'expire'        -- Subscription expired (non-payment)
  )),
  
  -- Related transaction
  stars_transaction_id UUID REFERENCES stars_transactions(id) ON DELETE SET NULL,
  
  -- Previous state (for upgrades/downgrades)
  previous_tier TEXT,
  previous_expires_at TIMESTAMPTZ,
  
  -- New state
  new_tier TEXT NOT NULL,
  new_expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE subscription_history IS 'Audit log of subscription lifecycle events';
COMMENT ON COLUMN subscription_history.action IS 'Type of subscription change';
COMMENT ON COLUMN subscription_history.previous_tier IS 'Tier before change (for audit)';

-- ============================================================================
-- Seed Data: Initial Products
-- ============================================================================

-- Credit packages
INSERT INTO stars_products (product_type, sku, name, description, price_stars, credits_amount, display_order, is_featured) VALUES
('credits', 'credits_50', '50 Credits', 'Perfect for beginners', 200, 50, 1, false),
('credits', 'credits_100', '100 Credits', 'Most popular choice', 500, 100, 2, true),
('credits', 'credits_300', '300 Credits', 'Best value + 50 bonus credits', 1200, 350, 3, false),
('credits', 'credits_1000', '1000 Credits', 'Professional package + 200 bonus', 3500, 1200, 4, false)
ON CONFLICT (sku) DO NOTHING;

-- Subscriptions
INSERT INTO stars_products (product_type, sku, name, description, price_stars, subscription_tier, subscription_days, display_order) VALUES
('subscription', 'sub_pro', 'Pro Subscription', '500 credits/month + priority queue', 2000, 'pro', 30, 5),
('subscription', 'sub_premium', 'Premium Subscription', '2000 credits/month + commercial use', 6000, 'premium', 30, 6)
ON CONFLICT (sku) DO NOTHING;

COMMIT;
