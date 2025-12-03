-- Migration: Create Storage Lifecycle Management
-- Sprint: 010 Infrastructure Setup
-- Created: 2025-12-03
-- Purpose: Automatic cleanup of expired files and storage quotas management

-- Function to cleanup expired temporary files
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS TABLE (
  deleted_count INTEGER,
  freed_bytes BIGINT
) AS $$
DECLARE
  total_deleted INTEGER := 0;
  total_freed BIGINT := 0;
  file_record RECORD;
BEGIN
  -- Find and delete expired temporary files
  FOR file_record IN
    SELECT * FROM file_registry
    WHERE is_temporary = TRUE
    AND expires_at IS NOT NULL
    AND expires_at < NOW()
  LOOP
    -- Delete from storage (would need to call storage API)
    -- For now, just mark in registry
    DELETE FROM file_registry WHERE id = file_record.id;
    
    total_deleted := total_deleted + 1;
    total_freed := total_freed + file_record.file_size_bytes;
  END LOOP;
  
  RETURN QUERY SELECT total_deleted, total_freed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_files IS 'Delete expired temporary files from storage';

-- Function to get storage quota for user based on subscription
CREATE OR REPLACE FUNCTION get_user_storage_quota(user_uuid UUID)
RETURNS BIGINT AS $$
DECLARE
  quota_gb INTEGER;
  quota_bytes BIGINT;
BEGIN
  -- Get quota from active subscription
  SELECT storage_quota_gb INTO quota_gb
  FROM user_subscriptions
  WHERE user_id = user_uuid
  AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no active subscription, return default (1GB)
  IF quota_gb IS NULL THEN
    quota_gb := 1;
  END IF;
  
  -- Convert to bytes (NULL means unlimited)
  IF quota_gb IS NULL THEN
    RETURN NULL;
  ELSE
    RETURN quota_gb::BIGINT * 1073741824; -- GB to bytes
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_storage_quota IS 'Get storage quota in bytes for user based on subscription tier';

-- Function to update storage quotas from subscriptions
CREATE OR REPLACE FUNCTION sync_storage_quotas()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Update quotas based on active subscriptions
  UPDATE storage_usage su
  SET 
    quota_bytes = CASE 
      WHEN us.tier = 'free' THEN 1073741824 -- 1GB
      WHEN us.tier = 'pro' THEN 53687091200 -- 50GB
      WHEN us.tier = 'premium' THEN 536870912000 -- 500GB
      WHEN us.tier = 'enterprise' THEN NULL -- unlimited
      ELSE 1073741824 -- default 1GB
    END,
    updated_at = NOW()
  FROM (
    SELECT DISTINCT ON (user_id) user_id, tier
    FROM user_subscriptions
    WHERE status = 'active'
    ORDER BY user_id, created_at DESC
  ) us
  WHERE su.user_id = us.user_id
  AND (
    su.quota_bytes IS DISTINCT FROM CASE 
      WHEN us.tier = 'free' THEN 1073741824
      WHEN us.tier = 'pro' THEN 53687091200
      WHEN us.tier = 'premium' THEN 536870912000
      WHEN us.tier = 'enterprise' THEN NULL
      ELSE 1073741824
    END
  );
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sync_storage_quotas IS 'Sync storage quotas with current subscription tiers';

-- Function to validate file upload against quota
CREATE OR REPLACE FUNCTION validate_file_upload(
  user_uuid UUID,
  file_size BIGINT
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_usage BIGINT,
  quota BIGINT,
  available BIGINT,
  usage_percentage NUMERIC
) AS $$
DECLARE
  usage BIGINT;
  user_quota BIGINT;
  is_allowed BOOLEAN;
  space_available BIGINT;
  usage_pct NUMERIC;
BEGIN
  -- Get current usage and quota
  SELECT total_bytes, quota_bytes INTO usage, user_quota
  FROM storage_usage
  WHERE user_id = user_uuid;
  
  -- Create record if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO storage_usage (user_id, total_bytes)
    VALUES (user_uuid, 0)
    RETURNING total_bytes, quota_bytes INTO usage, user_quota;
  END IF;
  
  -- Check if upload is allowed
  IF user_quota IS NULL THEN
    -- Unlimited quota
    is_allowed := TRUE;
    space_available := NULL;
    usage_pct := 0;
  ELSE
    is_allowed := (usage + file_size) <= user_quota;
    space_available := user_quota - usage;
    usage_pct := ROUND((usage::NUMERIC / user_quota::NUMERIC) * 100, 2);
  END IF;
  
  RETURN QUERY SELECT 
    is_allowed, 
    usage, 
    user_quota, 
    space_available,
    usage_pct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_file_upload IS 'Validate if file upload is allowed based on storage quota';

-- Function to get files by entity
CREATE OR REPLACE FUNCTION get_entity_files(
  entity_type_param TEXT,
  entity_id_param UUID
)
RETURNS TABLE (
  id UUID,
  file_path TEXT,
  file_name TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  bucket_id TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fr.id,
    fr.file_path,
    fr.file_name,
    fr.file_size_bytes,
    fr.mime_type,
    fr.bucket_id,
    fr.created_at
  FROM file_registry fr
  WHERE fr.entity_type = entity_type_param
  AND fr.entity_id = entity_id_param
  ORDER BY fr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_entity_files IS 'Get all files for a specific entity (track, project, etc.)';

-- Function to mark file as temporary with expiration
CREATE OR REPLACE FUNCTION mark_file_temporary(
  file_id UUID,
  expires_in_hours INTEGER DEFAULT 24
)
RETURNS VOID AS $$
BEGIN
  UPDATE file_registry
  SET 
    is_temporary = TRUE,
    expires_at = NOW() + (expires_in_hours || ' hours')::INTERVAL,
    updated_at = NOW()
  WHERE id = file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_file_temporary IS 'Mark a file as temporary with automatic expiration';

-- Function to extend file expiration
CREATE OR REPLACE FUNCTION extend_file_expiration(
  file_id UUID,
  additional_hours INTEGER
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  new_expiration TIMESTAMPTZ;
BEGIN
  UPDATE file_registry
  SET 
    expires_at = COALESCE(expires_at, NOW()) + (additional_hours || ' hours')::INTERVAL,
    updated_at = NOW()
  WHERE id = file_id
  RETURNING expires_at INTO new_expiration;
  
  RETURN new_expiration;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION extend_file_expiration IS 'Extend expiration time for a temporary file';

-- Function to get storage statistics
CREATE OR REPLACE FUNCTION get_storage_statistics()
RETURNS TABLE (
  total_users INTEGER,
  total_files BIGINT,
  total_size_bytes BIGINT,
  total_size_gb NUMERIC,
  avg_size_per_user_gb NUMERIC,
  users_over_quota INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT su.user_id)::INTEGER as total_users,
    COUNT(fr.id) as total_files,
    COALESCE(SUM(fr.file_size_bytes), 0) as total_size_bytes,
    ROUND(COALESCE(SUM(fr.file_size_bytes), 0)::NUMERIC / 1073741824, 2) as total_size_gb,
    ROUND(AVG(su.total_bytes)::NUMERIC / 1073741824, 2) as avg_size_per_user_gb,
    COUNT(DISTINCT CASE 
      WHEN su.quota_bytes IS NOT NULL AND su.total_bytes > su.quota_bytes 
      THEN su.user_id 
    END)::INTEGER as users_over_quota
  FROM storage_usage su
  LEFT JOIN file_registry fr ON fr.user_id = su.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_storage_statistics IS 'Get overall storage statistics';

-- Create view for user storage summary
CREATE OR REPLACE VIEW user_storage_summary AS
SELECT 
  su.user_id,
  p.username,
  su.total_bytes,
  ROUND(su.total_bytes::NUMERIC / 1073741824, 2) as total_gb,
  su.quota_bytes,
  CASE 
    WHEN su.quota_bytes IS NULL THEN 'Unlimited'
    ELSE ROUND(su.quota_bytes::NUMERIC / 1073741824, 2)::TEXT || ' GB'
  END as quota_display,
  CASE 
    WHEN su.quota_bytes IS NULL THEN 0
    ELSE ROUND((su.total_bytes::NUMERIC / su.quota_bytes::NUMERIC) * 100, 2)
  END as usage_percentage,
  CASE 
    WHEN su.quota_bytes IS NOT NULL AND su.total_bytes > su.quota_bytes THEN true
    ELSE false
  END as over_quota,
  COUNT(fr.id) as file_count,
  us.tier as subscription_tier,
  su.updated_at
FROM storage_usage su
LEFT JOIN profiles p ON p.user_id = su.user_id
LEFT JOIN file_registry fr ON fr.user_id = su.user_id
LEFT JOIN LATERAL (
  SELECT tier 
  FROM user_subscriptions 
  WHERE user_id = su.user_id 
  AND status = 'active'
  ORDER BY created_at DESC 
  LIMIT 1
) us ON true
GROUP BY su.user_id, p.username, su.total_bytes, su.quota_bytes, us.tier, su.updated_at;

COMMENT ON VIEW user_storage_summary IS 'Summary of storage usage per user with subscription info';

-- Trigger to prevent file upload if over quota
CREATE OR REPLACE FUNCTION check_quota_before_insert()
RETURNS TRIGGER AS $$
DECLARE
  is_allowed BOOLEAN;
BEGIN
  -- Check quota
  SELECT allowed INTO is_allowed
  FROM validate_file_upload(NEW.user_id, NEW.file_size_bytes);
  
  IF NOT is_allowed THEN
    RAISE EXCEPTION 'Storage quota exceeded. Please upgrade your plan or delete some files.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (commented out for now to avoid blocking uploads during development)
-- Uncomment when ready to enforce quotas
/*
CREATE TRIGGER file_registry_quota_check
BEFORE INSERT ON file_registry
FOR EACH ROW
EXECUTE FUNCTION check_quota_before_insert();
*/

COMMENT ON FUNCTION check_quota_before_insert IS 'Prevent file insert if user exceeds storage quota';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_storage_usage_over_quota 
ON storage_usage(user_id) 
WHERE quota_bytes IS NOT NULL AND total_bytes > quota_bytes;

CREATE INDEX IF NOT EXISTS idx_file_registry_temporary 
ON file_registry(expires_at, is_temporary) 
WHERE is_temporary = TRUE;
