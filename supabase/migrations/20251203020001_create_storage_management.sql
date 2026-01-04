-- Migration: Create Storage Management Tables
-- Sprint: 010 Infrastructure Setup
-- Created: 2025-12-03
-- Purpose: Track storage usage, file registry, and enforce quotas

-- Table for tracking user storage usage
CREATE TABLE IF NOT EXISTS storage_usage (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_bytes BIGINT DEFAULT 0 CHECK (total_bytes >= 0),
  tracks_bytes BIGINT DEFAULT 0 CHECK (tracks_bytes >= 0),
  covers_bytes BIGINT DEFAULT 0 CHECK (covers_bytes >= 0),
  stems_bytes BIGINT DEFAULT 0 CHECK (stems_bytes >= 0),
  uploads_bytes BIGINT DEFAULT 0 CHECK (uploads_bytes >= 0),
  avatars_bytes BIGINT DEFAULT 0 CHECK (avatars_bytes >= 0),
  banners_bytes BIGINT DEFAULT 0 CHECK (banners_bytes >= 0),
  quota_bytes BIGINT DEFAULT 1073741824, -- 1GB default quota
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE storage_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own storage usage
CREATE POLICY "Users can view own storage usage"
ON storage_usage FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- System can update storage usage
CREATE POLICY "System can update storage usage"
ON storage_usage FOR ALL
TO service_role
USING (true);

-- Create indexes
CREATE INDEX idx_storage_usage_user ON storage_usage(user_id);
CREATE INDEX idx_storage_usage_quota_exceeded ON storage_usage(user_id) WHERE total_bytes > quota_bytes;

-- Add comments
COMMENT ON TABLE storage_usage IS 'Tracks storage usage per user with quotas';
COMMENT ON COLUMN storage_usage.quota_bytes IS 'Storage quota in bytes (NULL = unlimited)';

-- Table for file registry (audit trail and cleanup management)
CREATE TABLE IF NOT EXISTS file_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes >= 0),
  mime_type TEXT,
  entity_type TEXT, -- 'track', 'cover', 'stem', 'avatar', 'banner', 'upload'
  entity_id UUID, -- reference to tracks.id, etc.
  is_temporary BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ, -- for temporary files
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bucket_id, file_path)
);

-- Enable RLS
ALTER TABLE file_registry ENABLE ROW LEVEL SECURITY;

-- Users can view their own files
CREATE POLICY "Users can view own files"
ON file_registry FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own files
CREATE POLICY "Users can insert own files"
ON file_registry FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
ON file_registry FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- System can manage all files
CREATE POLICY "System can manage all files"
ON file_registry FOR ALL
TO service_role
USING (true);

-- Create indexes
CREATE INDEX idx_file_registry_user ON file_registry(user_id);
CREATE INDEX idx_file_registry_bucket ON file_registry(bucket_id);
CREATE INDEX idx_file_registry_entity ON file_registry(entity_type, entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX idx_file_registry_expires ON file_registry(expires_at) WHERE is_temporary = TRUE AND expires_at IS NOT NULL;
CREATE INDEX idx_file_registry_created ON file_registry(created_at DESC);

-- Add comments
COMMENT ON TABLE file_registry IS 'Registry of all files in storage with metadata and lifecycle information';
COMMENT ON COLUMN file_registry.entity_type IS 'Type of entity this file belongs to (track, cover, stem, etc.)';
COMMENT ON COLUMN file_registry.entity_id IS 'ID of the entity this file belongs to';
COMMENT ON COLUMN file_registry.is_temporary IS 'Whether this is a temporary file that should be cleaned up';
COMMENT ON COLUMN file_registry.expires_at IS 'When this temporary file should be deleted';

-- Function to update storage_usage when files are added/removed
CREATE OR REPLACE FUNCTION update_storage_usage()
RETURNS TRIGGER AS $$
DECLARE
  bucket_column TEXT;
BEGIN
  -- Determine which bucket column to update
  CASE NEW.bucket_id
    WHEN 'tracks' THEN bucket_column := 'tracks_bytes';
    WHEN 'covers' THEN bucket_column := 'covers_bytes';
    WHEN 'stems' THEN bucket_column := 'stems_bytes';
    WHEN 'uploads' THEN bucket_column := 'uploads_bytes';
    WHEN 'avatars' THEN bucket_column := 'avatars_bytes';
    WHEN 'banners' THEN bucket_column := 'banners_bytes';
    ELSE bucket_column := NULL;
  END CASE;

  IF TG_OP = 'INSERT' THEN
    -- Insert or update storage_usage
    INSERT INTO storage_usage (user_id, total_bytes)
    VALUES (NEW.user_id, NEW.file_size_bytes)
    ON CONFLICT (user_id) DO UPDATE
    SET 
      total_bytes = storage_usage.total_bytes + NEW.file_size_bytes,
      updated_at = NOW();
    
    -- Update specific bucket column if applicable
    IF bucket_column IS NOT NULL THEN
      EXECUTE format('UPDATE storage_usage SET %I = %I + $1, updated_at = NOW() WHERE user_id = $2', 
                     bucket_column, bucket_column)
      USING NEW.file_size_bytes, NEW.user_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Determine bucket column for deletion
    CASE OLD.bucket_id
      WHEN 'tracks' THEN bucket_column := 'tracks_bytes';
      WHEN 'covers' THEN bucket_column := 'covers_bytes';
      WHEN 'stems' THEN bucket_column := 'stems_bytes';
      WHEN 'uploads' THEN bucket_column := 'uploads_bytes';
      WHEN 'avatars' THEN bucket_column := 'avatars_bytes';
      WHEN 'banners' THEN bucket_column := 'banners_bytes';
      ELSE bucket_column := NULL;
    END CASE;
    
    -- Decrease storage_usage
    UPDATE storage_usage
    SET 
      total_bytes = GREATEST(0, total_bytes - OLD.file_size_bytes),
      updated_at = NOW()
    WHERE user_id = OLD.user_id;
    
    -- Update specific bucket column if applicable
    IF bucket_column IS NOT NULL THEN
      EXECUTE format('UPDATE storage_usage SET %I = GREATEST(0, %I - $1), updated_at = NOW() WHERE user_id = $2', 
                     bucket_column, bucket_column)
      USING OLD.file_size_bytes, OLD.user_id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS file_registry_storage_trigger ON file_registry;
CREATE TRIGGER file_registry_storage_trigger
AFTER INSERT OR DELETE ON file_registry
FOR EACH ROW
EXECUTE FUNCTION update_storage_usage();

-- Function to check if user has sufficient storage quota
CREATE OR REPLACE FUNCTION check_storage_quota(user_uuid UUID, additional_bytes BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage BIGINT;
  user_quota BIGINT;
BEGIN
  -- Get current usage
  SELECT total_bytes, quota_bytes INTO current_usage, user_quota
  FROM storage_usage
  WHERE user_id = user_uuid;
  
  -- If no record exists, create one with default quota
  IF NOT FOUND THEN
    INSERT INTO storage_usage (user_id, total_bytes)
    VALUES (user_uuid, 0)
    RETURNING quota_bytes INTO user_quota;
    current_usage := 0;
  END IF;
  
  -- If quota is NULL (unlimited), return true
  IF user_quota IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if new file would exceed quota
  RETURN (COALESCE(current_usage, 0) + additional_bytes) <= user_quota;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_storage_quota IS 'Check if user has sufficient storage quota for a file of given size';

-- Function to get storage usage percentage
CREATE OR REPLACE FUNCTION get_storage_usage_percentage(user_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  current_usage BIGINT;
  user_quota BIGINT;
BEGIN
  SELECT total_bytes, quota_bytes INTO current_usage, user_quota
  FROM storage_usage
  WHERE user_id = user_uuid;
  
  -- If no quota (unlimited), return 0
  IF user_quota IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate percentage
  IF user_quota = 0 THEN
    RETURN 100;
  END IF;
  
  RETURN ROUND((COALESCE(current_usage, 0)::NUMERIC / user_quota::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_storage_usage_percentage IS 'Get storage usage as percentage (0-100)';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_file_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER file_registry_updated_at_trigger
BEFORE UPDATE ON file_registry
FOR EACH ROW
EXECUTE FUNCTION update_file_registry_updated_at();

-- Initialize storage_usage for existing users
INSERT INTO storage_usage (user_id, total_bytes)
SELECT id, 0
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
