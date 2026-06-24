
-- ============================================================
-- 1. payment_transactions: hide ip_address + user_agent from clients
-- ============================================================
REVOKE SELECT (ip_address, user_agent) ON public.payment_transactions FROM authenticated;
REVOKE SELECT (ip_address, user_agent) ON public.payment_transactions FROM anon;
-- service_role retains full access (ALL granted by default in our setup).

-- ============================================================
-- 2. tinkoff_subscriptions: allow users to read their own rows
--     (card_pan / card_exp_date column-level SELECT was already
--      revoked from authenticated/anon in a previous migration.)
-- ============================================================
GRANT SELECT ON public.tinkoff_subscriptions TO authenticated;

DROP POLICY IF EXISTS "Users view own tinkoff subscriptions" ON public.tinkoff_subscriptions;
CREATE POLICY "Users view own tinkoff subscriptions"
  ON public.tinkoff_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. storage.objects — audio bucket: cover non-recordings user folders
-- ============================================================
DROP POLICY IF EXISTS "Users can read own files in audio bucket" ON storage.objects;
CREATE POLICY "Users can read own files in audio bucket"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'audio'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can upload own files to audio bucket" ON storage.objects;
CREATE POLICY "Users can upload own files to audio bucket"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'audio'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update own files in audio bucket" ON storage.objects;
CREATE POLICY "Users can update own files in audio bucket"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'audio'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'audio'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- 4. storage.objects — stems bucket: add UPDATE policy for owners
-- ============================================================
DROP POLICY IF EXISTS "Users can update own stems" ON storage.objects;
CREATE POLICY "Users can update own stems"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'stems'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'stems'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 5. SECURITY DEFINER functions: revoke EXECUTE from anon + authenticated
--     for admin / cron / trigger / service-only helpers.
--     User-facing helpers (has_role, get_safe_public_profiles, etc.) stay.
-- ============================================================

-- Analytics / admin reporting
REVOKE EXECUTE ON FUNCTION public.get_deeplink_stats(interval) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_error_trends(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_error_trends(interval) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_funnel_analytics(date, date) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_funnel_dropoff_stats(text, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_gamification_analytics(interval) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_generation_analytics(interval) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_generation_stats(interval) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_payment_analytics(interval) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_retention_cohorts(date, date) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_stars_payment_stats() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_telegram_bot_metrics(interval) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_telemetry_stats(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_telemetry_stats(interval) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_track_analytics_summary(uuid, interval) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_behavior_stats(interval) FROM anon, authenticated;

-- Notification / queue workers (called by edge functions / cron)
REVOKE EXECUTE ON FUNCTION public.get_pending_notification_retries(integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_pending_telegram_notifications(integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_pending_telegram_retries(integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_notification(uuid, text, text, text, text, text, jsonb, timestamp with time zone, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_notifications_by_group(uuid, text) FROM anon, authenticated;

-- Cleanup / maintenance jobs
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_bot_sessions() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_notifications() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_wizard_states() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_failed_telegram_notifications() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_generation_history() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_track_versions(uuid, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_stuck_generation_tasks() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_telegram_queue() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_telegram_rate_limits() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_cleanup_track_versions() FROM anon, authenticated;

-- Credits / payment internals (must go through edge functions)
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer, text, text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_generation_credits(uuid, integer, text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.secure_credit_update(uuid, integer, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_gateway_payment(uuid, text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_stars_payment(uuid, text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_track_version(uuid, text, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_transcription_to_version(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_telegram_rate_limit(bigint, text, integer, integer) FROM anon, authenticated;

-- Internal helpers (consumed by RLS / triggers, not by clients directly)
REVOKE EXECUTE ON FUNCTION public.get_user_roles(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_create_project(uuid) FROM anon, authenticated;
