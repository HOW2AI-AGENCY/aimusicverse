-- =====================================================
-- Telegram Stars Payment System - Performance & Maintenance
-- Created: 2025-12-12
-- Description: Additional indexes and cleanup jobs for Stars payment system
-- =====================================================

-- =====================================================
-- 1. PERFORMANCE INDEXES
-- =====================================================

-- Composite index for common query pattern (user + status filtering)
CREATE INDEX IF NOT EXISTS idx_stars_transactions_user_status_created
  ON public.stars_transactions(user_id, status, created_at DESC);

-- Index for webhook idempotency check optimization
-- This helps the webhook handler quickly find existing transactions
CREATE INDEX IF NOT EXISTS idx_stars_transactions_charge_status
  ON public.stars_transactions(telegram_payment_charge_id, status)
  WHERE telegram_payment_charge_id IS NOT NULL;

-- Index for pending transaction cleanup
CREATE INDEX IF NOT EXISTS idx_stars_transactions_pending_old
  ON public.stars_transactions(created_at)
  WHERE status = 'pending';

-- Index for product lookup by code (frequently used in invoice creation)
CREATE INDEX IF NOT EXISTS idx_stars_products_code_status
  ON public.stars_products(product_code, status)
  WHERE status = 'active';

-- =====================================================
-- 2. CLEANUP FUNCTION FOR OLD PENDING TRANSACTIONS
-- =====================================================

-- Function to clean up old pending transactions (older than 24 hours)
-- These are likely abandoned invoices that were never paid
CREATE OR REPLACE FUNCTION public.cleanup_old_pending_stars_transactions()
RETURNS JSONB AS $$
DECLARE
  v_deleted_count INTEGER;
  v_cutoff_time TIMESTAMPTZ;
BEGIN
  -- Calculate cutoff time (24 hours ago)
  v_cutoff_time := now() - INTERVAL '24 hours';
  
  -- Update old pending transactions to cancelled
  WITH updated AS (
    UPDATE public.stars_transactions
    SET 
      status = 'cancelled',
      error_message = 'Transaction expired (not paid within 24 hours)',
      updated_at = now()
    WHERE 
      status = 'pending'
      AND created_at < v_cutoff_time
      AND telegram_payment_charge_id IS NULL  -- Only cancel if not paid
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM updated;
  
  RETURN jsonb_build_object(
    'success', true,
    'cancelled_count', v_deleted_count,
    'cutoff_time', v_cutoff_time,
    'execution_time', now()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'execution_time', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_old_pending_stars_transactions IS 
  'Cleanup old pending Stars transactions (24+ hours old) by marking them as cancelled';

-- =====================================================
-- 3. STATISTICS FUNCTION FOR MONITORING
-- =====================================================

-- Function to get database performance stats for Stars tables
CREATE OR REPLACE FUNCTION public.get_stars_tables_stats()
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'stars_transactions', jsonb_build_object(
      'total_count', (SELECT COUNT(*) FROM public.stars_transactions),
      'pending_count', (SELECT COUNT(*) FROM public.stars_transactions WHERE status = 'pending'),
      'processing_count', (SELECT COUNT(*) FROM public.stars_transactions WHERE status = 'processing'),
      'completed_count', (SELECT COUNT(*) FROM public.stars_transactions WHERE status = 'completed'),
      'failed_count', (SELECT COUNT(*) FROM public.stars_transactions WHERE status = 'failed'),
      'cancelled_count', (SELECT COUNT(*) FROM public.stars_transactions WHERE status = 'cancelled'),
      'old_pending_count', (
        SELECT COUNT(*) 
        FROM public.stars_transactions 
        WHERE status = 'pending' AND created_at < now() - INTERVAL '24 hours'
      )
    ),
    'stars_products', jsonb_build_object(
      'active_count', (SELECT COUNT(*) FROM public.stars_products WHERE status = 'active'),
      'inactive_count', (SELECT COUNT(*) FROM public.stars_products WHERE status = 'inactive'),
      'archived_count', (SELECT COUNT(*) FROM public.stars_products WHERE status = 'archived')
    ),
    'subscription_history', jsonb_build_object(
      'total_count', (SELECT COUNT(*) FROM public.subscription_history),
      'active_count', (
        SELECT COUNT(*) 
        FROM public.subscription_history 
        WHERE status = 'active' AND expires_at > now()
      ),
      'expired_count', (
        SELECT COUNT(*) 
        FROM public.subscription_history 
        WHERE status = 'active' AND expires_at <= now()
      )
    )
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_stars_tables_stats IS 
  'Get statistics about Stars payment tables for monitoring';

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.cleanup_old_pending_stars_transactions() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_stars_tables_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_stars_tables_stats() TO service_role;
