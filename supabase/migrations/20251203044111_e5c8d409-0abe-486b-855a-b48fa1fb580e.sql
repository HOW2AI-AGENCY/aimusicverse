-- Add active_version_id to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS active_version_id UUID REFERENCES track_versions(id);

-- Add version_label and clip_index to track_versions
ALTER TABLE track_versions ADD COLUMN IF NOT EXISTS version_label VARCHAR(10) DEFAULT 'A';
ALTER TABLE track_versions ADD COLUMN IF NOT EXISTS clip_index INTEGER DEFAULT 0;

-- Add clip tracking to generation_tasks
ALTER TABLE generation_tasks ADD COLUMN IF NOT EXISTS expected_clips INTEGER DEFAULT 2;
ALTER TABLE generation_tasks ADD COLUMN IF NOT EXISTS received_clips INTEGER DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_track_versions_track_label ON track_versions(track_id, version_label);
CREATE INDEX IF NOT EXISTS idx_tracks_active_version ON tracks(active_version_id);

-- Update existing track_versions with version_label 'A' and clip_index 0
UPDATE track_versions SET version_label = 'A', clip_index = 0 WHERE version_label IS NULL;

-- Set active_version_id for tracks that don't have one
UPDATE tracks t 
SET active_version_id = (
  SELECT tv.id FROM track_versions tv 
  WHERE tv.track_id = t.id 
  ORDER BY tv.is_primary DESC, tv.created_at ASC 
  LIMIT 1
)
WHERE t.active_version_id IS NULL;