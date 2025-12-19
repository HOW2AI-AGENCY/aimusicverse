-- Function to auto-delete expired notifications (fixed syntax)
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer := 0;
  v_count integer;
BEGIN
  -- Delete expired notifications
  WITH deleted AS (
    DELETE FROM public.notifications
    WHERE expires_at IS NOT NULL AND expires_at < now()
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM deleted;
  v_deleted := v_deleted + v_count;
  
  -- Delete read notifications older than 30 days
  WITH deleted AS (
    DELETE FROM public.notifications
    WHERE read = true 
      AND created_at < now() - interval '30 days'
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM deleted;
  v_deleted := v_deleted + v_count;
  
  -- Keep max 100 notifications per user (delete oldest read first)
  WITH ranked AS (
    SELECT id, user_id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY read ASC, created_at DESC) as rn
    FROM public.notifications
  ),
  deleted AS (
    DELETE FROM public.notifications
    WHERE id IN (SELECT id FROM ranked WHERE rn > 100)
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM deleted;
  v_deleted := v_deleted + v_count;
  
  RETURN v_deleted;
END;
$$;

-- Function to upsert notification with auto-replace
CREATE OR REPLACE FUNCTION public.upsert_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text,
  p_group_key text DEFAULT NULL,
  p_action_url text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}',
  p_expires_at timestamptz DEFAULT NULL,
  p_priority integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  -- If group_key provided, update existing or insert new
  IF p_group_key IS NOT NULL THEN
    UPDATE public.notifications
    SET 
      title = p_title,
      message = p_message,
      type = p_type,
      action_url = p_action_url,
      metadata = COALESCE(metadata, '{}'::jsonb) || p_metadata,
      expires_at = p_expires_at,
      priority = p_priority,
      read = false,
      created_at = now()
    WHERE user_id = p_user_id AND group_key = p_group_key
    RETURNING id INTO v_notification_id;
    
    IF v_notification_id IS NOT NULL THEN
      RETURN v_notification_id;
    END IF;
  END IF;
  
  -- Insert new notification
  INSERT INTO public.notifications (
    user_id, title, message, type, group_key, 
    action_url, metadata, expires_at, priority, read
  )
  VALUES (
    p_user_id, p_title, p_message, p_type, p_group_key,
    p_action_url, p_metadata, p_expires_at, p_priority, false
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Function to delete notifications by group
CREATE OR REPLACE FUNCTION public.delete_notifications_by_group(
  p_user_id uuid,
  p_group_key text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM public.notifications
    WHERE user_id = p_user_id AND group_key = p_group_key
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM deleted;
  
  RETURN v_count;
END;
$$;