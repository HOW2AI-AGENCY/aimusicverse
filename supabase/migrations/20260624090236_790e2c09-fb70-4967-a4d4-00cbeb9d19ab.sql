
-- =========================================================
-- 1) PROFILES: hide telegram_id / telegram_chat_id from non-owners via column grants
-- =========================================================
REVOKE SELECT ON public.profiles FROM anon, authenticated, PUBLIC;

-- Owners still see all columns of their own row (RLS gates rows; column grant gates columns).
-- Give authenticated full SELECT (RLS limits to own row + public profiles join), but
-- restrict telegram columns by issuing column-level grant for anon and authenticated.
GRANT SELECT (
  id, user_id, first_name, last_name, username, language_code, photo_url,
  created_at, updated_at, subscription_tier, is_public, display_name,
  followers_count, following_count, bio, banner_url, social_links,
  pinned_tracks, pinned_projects, pinned_artists, profile_theme,
  profile_completeness, subscription_expires_at
) ON public.profiles TO anon;

GRANT SELECT (
  id, user_id, first_name, last_name, username, language_code, photo_url,
  created_at, updated_at, subscription_tier, is_public, display_name,
  followers_count, following_count, bio, banner_url, social_links,
  pinned_tracks, pinned_projects, pinned_artists, profile_theme,
  profile_completeness, subscription_expires_at,
  -- Owners need their telegram ids; RLS "Users can view own profile" restricts to own row.
  telegram_id, telegram_chat_id
) ON public.profiles TO authenticated;

GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- =========================================================
-- 2) PROMO_CODES: restrict to authenticated only
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view active promo codes" ON public.promo_codes;
CREATE POLICY "Authenticated can view active promo codes"
ON public.promo_codes
FOR SELECT
TO authenticated
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

REVOKE SELECT ON public.promo_codes FROM anon;

-- =========================================================
-- 3) TELEGRAM_BOT_CONFIG: remove public read; admins + service_role only
-- =========================================================
DROP POLICY IF EXISTS "Service role can read config" ON public.telegram_bot_config;
-- "Admins can manage bot config" policy already exists.
REVOKE SELECT ON public.telegram_bot_config FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.telegram_bot_config TO service_role;

-- =========================================================
-- 4) USER_ACHIEVEMENTS: drop public leaderboard exposure
-- =========================================================
DROP POLICY IF EXISTS "Public can view achievements for leaderboard" ON public.user_achievements;
-- Owners can still view own achievements via existing policy.
-- Leaderboards should use public.get_leaderboard() RPC.

-- =========================================================
-- 5) TINKOFF_SUBSCRIPTIONS: fix forged-jwt bypass + hide card_pan/card_exp_date
-- =========================================================
DROP POLICY IF EXISTS "System can manage subscriptions" ON public.tinkoff_subscriptions;
CREATE POLICY "Service role manages subscriptions"
ON public.tinkoff_subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Limit authenticated SELECT to non-card columns
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.tinkoff_subscriptions FROM anon, authenticated, PUBLIC;
GRANT SELECT (
  id, user_id, product_code, rebill_id, status, amount_cents, currency,
  billing_cycle_days, next_billing_date, last_payment_date, last_payment_id,
  failed_attempts, metadata, created_at, updated_at
) ON public.tinkoff_subscriptions TO authenticated;
GRANT ALL ON public.tinkoff_subscriptions TO service_role;

-- =========================================================
-- 6) STEMS bucket: lock down storage.objects SELECT policy
-- (bucket is also flipped to private via storage_update_bucket tool)
-- =========================================================
-- Existing "Users can view their own stems" already scopes by folder; leave it.
-- Make sure no broad SELECT policy on stems exists.
DROP POLICY IF EXISTS "Public read stems" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view stems" ON storage.objects;

-- =========================================================
-- 7) SECURITY DEFINER functions: revoke EXECUTE from anon/authenticated
-- for admin / analytics / system functions. Keep grants for functions
-- intentionally callable from the client or used inside RLS.
-- =========================================================
DO $$
DECLARE
  fn record;
  keep_names text[] := ARRAY[
    'has_role','is_premium_or_admin','is_user_blocked',
    'get_platform_stats','get_safe_public_profile','get_safe_public_profiles',
    'get_public_profile_info','get_public_profiles','get_leaderboard',
    'get_featured_tracks','get_optimized_cover_url','get_user_balance_summary',
    'get_subscription_status','get_user_roles','get_track_analytics_summary',
    'secure_credit_update','delete_notifications_by_group',
    'increment_track_play_count','increment_track_share_count',
    'ensure_track_version','check_telegram_rate_limit',
    'build_suno_prompt','get_complementary_tags','recommend_styles_for_user',
    'update_user_streak','can_create_project','cleanup_old_track_versions',
    'upsert_notification','link_transcription_to_version'
  ];
BEGIN
  FOR fn IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
      AND NOT (p.proname = ANY(keep_names))
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated',
                   fn.proname, fn.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role',
                   fn.proname, fn.args);
  END LOOP;
END$$;
