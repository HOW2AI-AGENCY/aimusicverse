CREATE OR REPLACE FUNCTION public.cleanup_old_track_versions(
  p_track_id UUID DEFAULT NULL,
  p_max_free INT DEFAULT 10,
  p_max_pro INT DEFAULT 50
)
RETURNS TABLE(
  track_id UUID,
  deleted_count INT,
  kept_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_track_record RECORD;
  v_user_tier TEXT;
  v_max_versions INT;
  v_current_count INT;
  v_to_delete INT;
BEGIN
  FOR v_track_record IN
    SELECT DISTINCT tv.track_id, t.user_id
    FROM track_versions tv
    JOIN tracks t ON t.id = tv.track_id
    WHERE (p_track_id IS NULL OR tv.track_id = p_track_id)
  LOOP
    SELECT COALESCE(p.subscription_tier, 'free') INTO v_user_tier
    FROM profiles p
    WHERE p.user_id = v_track_record.user_id
    LIMIT 1;

    v_max_versions := CASE
      WHEN v_user_tier IN ('pro', 'premium', 'unlimited') THEN p_max_pro
      ELSE p_max_free
    END;

    SELECT COUNT(*) INTO v_current_count
    FROM track_versions
    WHERE track_versions.track_id = v_track_record.track_id;

    v_to_delete := GREATEST(0, v_current_count - v_max_versions);

    IF v_to_delete > 0 THEN
      DELETE FROM track_versions
      WHERE id IN (
        SELECT id FROM track_versions
        WHERE track_versions.track_id = v_track_record.track_id
          AND is_primary = false
        ORDER BY created_at ASC
        LIMIT v_to_delete
      );

      track_id := v_track_record.track_id;
      deleted_count := v_to_delete;
      kept_count := v_current_count - v_to_delete;
      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_old_track_versions(uuid, integer, integer) FROM anon, authenticated;