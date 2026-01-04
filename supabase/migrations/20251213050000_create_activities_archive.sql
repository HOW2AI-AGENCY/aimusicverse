-- Migration: Create activities_archive table for old activity storage
-- Sprint 011 Phase 10 Task T100
-- Created: 2025-12-13

-- Create activities_archive table with same structure as activities
CREATE TABLE IF NOT EXISTS activities_archive (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  actor_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT activities_archive_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT activities_archive_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add indexes for querying archived data
CREATE INDEX IF NOT EXISTS idx_activities_archive_user_id ON activities_archive(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_archive_actor_id ON activities_archive(actor_id);
CREATE INDEX IF NOT EXISTS idx_activities_archive_created_at ON activities_archive(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_archive_archived_at ON activities_archive(archived_at DESC);

-- Add comment
COMMENT ON TABLE activities_archive IS 'Archive table for activities older than 30 days to maintain performance';
