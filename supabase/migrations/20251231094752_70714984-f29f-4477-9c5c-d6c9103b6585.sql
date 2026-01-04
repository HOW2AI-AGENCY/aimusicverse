-- Function to check if user can create a project (max 3 for free users)
CREATE OR REPLACE FUNCTION public.can_create_project(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_tier text;
  v_project_count integer;
  v_limit integer := 3;
BEGIN
  -- Get user's subscription tier
  SELECT COALESCE(subscription_tier::text, 'free')
  INTO v_subscription_tier
  FROM profiles
  WHERE user_id = _user_id;

  -- Premium/Pro users have unlimited projects
  IF v_subscription_tier IN ('pro', 'premium', 'enterprise') THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'current_count', (SELECT COUNT(*) FROM music_projects WHERE user_id = _user_id),
      'limit', null,
      'tier', v_subscription_tier
    );
  END IF;

  -- Count user's projects
  SELECT COUNT(*)
  INTO v_project_count
  FROM music_projects
  WHERE user_id = _user_id;

  -- Check limit for free users
  IF v_project_count >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'current_count', v_project_count,
      'limit', v_limit,
      'tier', COALESCE(v_subscription_tier, 'free'),
      'reason', 'Бесплатные пользователи могут создать до 3 проектов. Оформите подписку для безлимитного доступа.'
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'current_count', v_project_count,
    'limit', v_limit,
    'remaining', v_limit - v_project_count,
    'tier', COALESCE(v_subscription_tier, 'free')
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.can_create_project(uuid) TO authenticated;