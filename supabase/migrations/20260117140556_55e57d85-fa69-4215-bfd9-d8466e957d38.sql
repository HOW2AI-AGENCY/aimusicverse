-- Fix all functions missing SET search_path = public

-- 1. Fix update_notification_settings_updated_at
CREATE OR REPLACE FUNCTION public.update_notification_settings_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Fix update_tinkoff_subscription_updated_at
CREATE OR REPLACE FUNCTION public.update_tinkoff_subscription_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Fix is_user_blocked (SECURITY DEFINER - critical)
CREATE OR REPLACE FUNCTION public.is_user_blocked(
  p_blocker_id uuid,
  p_blocked_id uuid
)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.blocked_users
    WHERE blocker_id = p_blocker_id
    AND blocked_id = p_blocked_id
  );
END;
$$;

-- 4. Fix update_track_likes_count
CREATE OR REPLACE FUNCTION public.update_track_likes_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tracks SET likes_count = likes_count + 1 WHERE id = NEW.track_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tracks SET likes_count = likes_count - 1 WHERE id = OLD.track_id;
  END IF;
  RETURN NULL;
END;
$$;

-- 5. Fix update_updated_at_column if exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;