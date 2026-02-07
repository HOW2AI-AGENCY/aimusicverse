-- Create function to cleanup old track versions based on tier limits
-- Free: max 10 versions per track, Pro: max 50
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
  -- Process all tracks or a specific one
  FOR v_track_record IN 
    SELECT DISTINCT tv.track_id, t.user_id
    FROM track_versions tv
    JOIN tracks t ON t.id = tv.track_id
    WHERE (p_track_id IS NULL OR tv.track_id = p_track_id)
  LOOP
    -- Get user tier
    SELECT COALESCE(uc.tier, 'free') INTO v_user_tier
    FROM user_credits uc
    WHERE uc.user_id = v_track_record.user_id;
    
    -- Determine max versions based on tier
    v_max_versions := CASE 
      WHEN v_user_tier IN ('pro', 'premium', 'unlimited') THEN p_max_pro
      ELSE p_max_free
    END;
    
    -- Count current versions for this track
    SELECT COUNT(*) INTO v_current_count
    FROM track_versions
    WHERE track_versions.track_id = v_track_record.track_id;
    
    -- Calculate how many to delete
    v_to_delete := GREATEST(0, v_current_count - v_max_versions);
    
    IF v_to_delete > 0 THEN
      -- Delete oldest non-primary versions (keep primary version always)
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

-- Create trigger to auto-cleanup when new version is added
CREATE OR REPLACE FUNCTION public.auto_cleanup_track_versions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cleanup_result RECORD;
BEGIN
  -- Run cleanup for the track that just got a new version
  FOR v_cleanup_result IN 
    SELECT * FROM cleanup_old_track_versions(NEW.track_id)
  LOOP
    -- Log cleanup if versions were deleted
    IF v_cleanup_result.deleted_count > 0 THEN
      RAISE LOG 'Auto-cleaned % old versions for track %', 
        v_cleanup_result.deleted_count, 
        v_cleanup_result.track_id;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger on track_versions insert
DROP TRIGGER IF EXISTS tr_auto_cleanup_versions ON track_versions;
CREATE TRIGGER tr_auto_cleanup_versions
  AFTER INSERT ON track_versions
  FOR EACH ROW
  EXECUTE FUNCTION auto_cleanup_track_versions();

-- Add index for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_track_versions_cleanup 
  ON track_versions(track_id, is_primary, created_at);

COMMENT ON FUNCTION cleanup_old_track_versions IS 'Cleanup old track versions based on user tier limits. Free: 10, Pro: 50';
COMMENT ON FUNCTION auto_cleanup_track_versions IS 'Trigger function to auto-cleanup versions when new ones are added';