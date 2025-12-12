-- Migration: Extend Existing Tables for Stars Payment System
-- Date: 2025-12-12
-- Tasks: T014-T020

BEGIN;

-- ============================================================================
-- Extend credit_transactions table
-- ============================================================================
-- Add Stars payment reference to existing credit transactions

ALTER TABLE public.credit_transactions
ADD COLUMN IF NOT EXISTS stars_transaction_id UUID REFERENCES stars_transactions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS telegram_payment_id TEXT; -- Deprecated, use stars_transaction_id

COMMENT ON COLUMN credit_transactions.stars_transaction_id IS 'Reference to Stars payment that allocated these credits';
COMMENT ON COLUMN credit_transactions.telegram_payment_id IS 'DEPRECATED: Legacy field, use stars_transaction_id';

-- ============================================================================
-- Extend profiles table
-- ============================================================================
-- Add subscription fields to user profiles

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' 
  CHECK (subscription_tier IN ('free', 'pro', 'premium', 'enterprise')),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stars_subscription_id TEXT, -- Telegram recurring subscription ID
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;

COMMENT ON COLUMN profiles.subscription_tier IS 'Current subscription tier (free, pro, premium, enterprise)';
COMMENT ON COLUMN profiles.subscription_expires_at IS 'Timestamp when subscription expires (NULL = lifetime/free)';
COMMENT ON COLUMN profiles.stars_subscription_id IS 'Telegram subscription ID for recurring payments';
COMMENT ON COLUMN profiles.auto_renew IS 'Whether subscription auto-renews (Telegram managed)';

COMMIT;
