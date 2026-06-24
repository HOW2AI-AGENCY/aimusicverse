-- ============================================================================
-- Security findings batch — 11 issues
-- ============================================================================

-- 1. Storage: drop broad SELECT policies that allow LISTING in public buckets.
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can read audio" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for audio references" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for bot assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for broadcast images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for project banners" ON storage.objects;

-- 2. comment_likes
DROP POLICY IF EXISTS "Users can view comment likes" ON public.comment_likes;
CREATE POLICY "Authenticated users can view comment likes"
  ON public.comment_likes FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.comment_likes FROM anon;

-- 3. track_likes
DROP POLICY IF EXISTS "Users can view own likes or likes on public tracks" ON public.track_likes;
CREATE POLICY "Authenticated users can view track likes"
  ON public.track_likes FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.track_likes FROM anon;

-- 4. user_follows
DROP POLICY IF EXISTS "Anyone can view follows" ON public.user_follows;
CREATE POLICY "Authenticated users can view follows"
  ON public.user_follows FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.user_follows FROM anon;

-- 5. performance_metrics
DROP POLICY IF EXISTS "Performance metrics are publicly readable" ON public.performance_metrics;
CREATE POLICY "Admins can view performance metrics"
  ON public.performance_metrics FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.performance_metrics FROM anon;

-- 6. profiles: drop anon-facing SELECT
DROP POLICY IF EXISTS "Anon can view profiles of public content creators" ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;

-- 7. payment_transactions: column-level revoke
REVOKE SELECT (ip_address, user_agent) ON public.payment_transactions FROM authenticated, anon;

-- 8. tinkoff_subscriptions: enforce masked card_pan via trigger
CREATE OR REPLACE FUNCTION public.enforce_masked_card_pan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.card_pan IS NOT NULL THEN
    IF NEW.card_pan ~ '\d{8,}' THEN
      RAISE EXCEPTION 'card_pan must be masked before storage (raw card numbers are not allowed)'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tinkoff_subscriptions_mask_card_pan ON public.tinkoff_subscriptions;
CREATE TRIGGER tinkoff_subscriptions_mask_card_pan
  BEFORE INSERT OR UPDATE ON public.tinkoff_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_masked_card_pan();

-- 9. track_stems: require authentication
DROP POLICY IF EXISTS "Users can view own track stems" ON public.track_stems;
CREATE POLICY "Authenticated users can view own or public track stems"
  ON public.track_stems FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = track_stems.track_id
        AND (tracks.user_id = auth.uid() OR tracks.is_public = true)
    )
  );
REVOKE SELECT ON public.track_stems FROM anon;

-- 10/11. SECURITY DEFINER hardening
DO $$
DECLARE
  fn record;
  client_rpcs text[] := ARRAY[
    'has_role','is_premium_or_admin','can_create_project',
    'ensure_track_version','link_transcription_to_version',
    'increment_track_play_count','increment_track_share_count',
    'get_user_balance_summary','get_subscription_status',
    'get_leaderboard','get_platform_stats',
    'get_featured_tracks','get_complementary_tags','get_optimized_cover_url',
    'get_public_profile_info','get_public_profiles',
    'get_safe_public_profile','get_safe_public_profiles',
    'get_track_analytics_summary','recommend_styles_for_user',
    'update_user_streak','is_user_blocked','build_suno_prompt',
    'get_telegram_bot_metrics','get_deeplink_stats','get_funnel_analytics',
    'get_funnel_dropoff_stats','get_user_behavior_stats',
    'get_generation_stats','get_generation_analytics','get_gamification_analytics',
    'get_payment_analytics','get_stars_payment_stats','get_retention_cohorts',
    'get_error_trends','get_telemetry_stats','delete_notifications_by_group',
    'upsert_notification','cleanup_expired_notifications','secure_credit_update'
  ];
  anon_allowed text[] := ARRAY[
    'has_role',
    'get_featured_tracks','get_leaderboard','get_platform_stats',
    'get_public_profile_info','get_public_profiles',
    'get_safe_public_profile','get_safe_public_profiles',
    'get_optimized_cover_url','get_complementary_tags',
    'build_suno_prompt'
  ];
BEGIN
  FOR fn IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated',
      fn.proname, fn.args
    );
    IF fn.proname = ANY(client_rpcs) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated', fn.proname, fn.args);
    END IF;
    IF fn.proname = ANY(anon_allowed) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO anon', fn.proname, fn.args);
    END IF;
  END LOOP;
END $$;
