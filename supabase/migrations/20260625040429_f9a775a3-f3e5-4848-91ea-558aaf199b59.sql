
-- 1. Audio bucket: drop broad permissive policies, keep strict 'recordings/{uid}/' paths only
DROP POLICY IF EXISTS "Users can upload own files to audio bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files in audio bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files in audio bucket" ON storage.objects;

-- Ensure strict SELECT/UPDATE exist (INSERT and DELETE strict policies already exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can update their own audio') THEN
    CREATE POLICY "Users can update their own audio" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = 'recordings' AND (storage.foldername(name))[2] = (auth.uid())::text)
      WITH CHECK (bucket_id = 'audio' AND (storage.foldername(name))[1] = 'recordings' AND (storage.foldername(name))[2] = (auth.uid())::text);
  END IF;
END $$;

-- 2. Promo codes: remove bulk read policy; expose validation via SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Authenticated can view active promo codes" ON public.promo_codes;

CREATE OR REPLACE FUNCTION public.validate_promo_code(
  p_code text,
  p_product_code text,
  p_stars_price integer
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_promo public.promo_codes%ROWTYPE;
  v_user_usage integer;
  v_max_per_user integer;
  v_discount_stars integer := 0;
  v_min_purchase integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Требуется авторизация');
  END IF;

  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE code = upper(p_code) AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Промокод не найден');
  END IF;

  IF v_promo.valid_from IS NOT NULL AND v_promo.valid_from > now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Промокод ещё не активен');
  END IF;
  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Промокод истёк');
  END IF;
  IF v_promo.max_uses IS NOT NULL AND COALESCE(v_promo.current_uses, 0) >= v_promo.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Промокод исчерпан');
  END IF;

  SELECT COUNT(*) INTO v_user_usage
  FROM public.promo_code_usage
  WHERE promo_code_id = v_promo.id AND user_id = v_user_id;

  v_max_per_user := COALESCE(v_promo.max_uses_per_user, 1);
  IF v_user_usage >= v_max_per_user THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Вы уже использовали этот промокод');
  END IF;

  IF COALESCE(array_length(v_promo.product_codes, 1), 0) > 0
     AND NOT (p_product_code = ANY(v_promo.product_codes)) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Промокод не применим к этому продукту');
  END IF;

  v_min_purchase := COALESCE(v_promo.min_purchase_stars, 0);
  IF p_stars_price < v_min_purchase THEN
    RETURN jsonb_build_object('valid', false, 'error', format('Минимальная сумма покупки: %s Stars', v_min_purchase));
  END IF;

  IF v_promo.discount_percent IS NOT NULL THEN
    v_discount_stars := floor(p_stars_price * (v_promo.discount_percent::numeric / 100))::integer;
  ELSIF v_promo.discount_stars IS NOT NULL THEN
    v_discount_stars := LEAST(v_promo.discount_stars, p_stars_price - 1);
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'promo', jsonb_build_object(
      'id', v_promo.id,
      'code', v_promo.code,
      'discount_percent', v_promo.discount_percent,
      'discount_stars', v_promo.discount_stars,
      'bonus_credits', COALESCE(v_promo.bonus_credits, 0),
      'max_uses', v_promo.max_uses,
      'current_uses', COALESCE(v_promo.current_uses, 0),
      'max_uses_per_user', v_max_per_user,
      'valid_from', v_promo.valid_from,
      'valid_until', v_promo.valid_until,
      'product_codes', COALESCE(v_promo.product_codes, ARRAY[]::text[]),
      'min_purchase_stars', v_min_purchase,
      'is_active', v_promo.is_active
    ),
    'discount_stars', v_discount_stars,
    'bonus_credits', COALESCE(v_promo.bonus_credits, 0),
    'final_price', p_stars_price - v_discount_stars
  );
END;
$$;

REVOKE ALL ON FUNCTION public.validate_promo_code(text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(text, text, integer) TO authenticated;
