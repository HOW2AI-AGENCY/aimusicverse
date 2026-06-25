-- Voice Cloning Database Migration
-- MusicVerse AI - Suno Voice API Integration
--
-- This migration adds tables and structures for voice cloning functionality:
-- - voices table: Stores custom voices
-- - voice_tasks table: Tracks voice cloning progress
-- - RLS policies for security
-- - Indexes for performance

-- ============================================================================
-- VOICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic information
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Audio files
  sample_url TEXT NOT NULL,
  waveform_url TEXT,
  duration_seconds INT,

  -- Verification
  is_verified BOOLEAN DEFAULT false,
  provider_voice_id VARCHAR(255) UNIQUE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Additional metadata
  metadata JSONB DEFAULT '{}',

  -- Constraints
  CONSTRAINT voices_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT voices_sample_url_not_empty CHECK (length(trim(sample_url)) > 0)
);

-- Indexes for voices table
CREATE INDEX IF NOT EXISTS idx_voices_user_id ON voices(user_id);
CREATE INDEX IF NOT EXISTS idx_voices_provider_voice_id ON voices(provider_voice_id);
CREATE INDEX IF NOT EXISTS idx_voices_is_verified ON voices(is_verified);
CREATE INDEX IF NOT EXISTS idx_voices_created_at ON voices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voices_deleted_at ON voices(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================================================
-- VOICE TASKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User and voice relationship
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  voice_id UUID REFERENCES voices(id) ON DELETE SET NULL,

  -- Validation phase
  validate_task_id VARCHAR(255) UNIQUE,
  validate_phrase TEXT,
  validate_status VARCHAR(50),

  -- Generation phase
  generate_task_id VARCHAR(255) UNIQUE,
  recording_url TEXT,
  generate_status VARCHAR(50),

  -- Final result
  provider_voice_id VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Additional metadata
  metadata JSONB DEFAULT '{}'
);

-- Indexes for voice_tasks table
CREATE INDEX IF NOT EXISTS idx_voice_tasks_user_id ON voice_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_tasks_voice_id ON voice_tasks(voice_id);
CREATE INDEX IF NOT EXISTS idx_voice_tasks_validate_task_id ON voice_tasks(validate_task_id);
CREATE INDEX IF NOT EXISTS idx_voice_tasks_generate_task_id ON voice_tasks(generate_task_id);
CREATE INDEX IF NOT EXISTS idx_voice_tasks_created_at ON voice_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_tasks_completed_at ON voice_tasks(completed_at) WHERE completed_at IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_tasks ENABLE ROW LEVEL SECURITY;

-- Voices table RLS policies
CREATE POLICY "Users can view own voices"
  ON voices FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create voices"
  ON voices FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own voices"
  ON voices FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own voices"
  ON voices FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own voice tasks"
  ON voice_tasks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create voice tasks"
  ON voice_tasks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own voice tasks"
  ON voice_tasks FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own voice tasks"
  ON voice_tasks FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Create or replace function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to voices table
CREATE TRIGGER update_voices_updated_at
  BEFORE UPDATE ON voices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to voice_tasks table
CREATE TRIGGER update_voice_tasks_updated_at
  BEFORE UPDATE ON voice_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get voice cloning progress
CREATE OR REPLACE FUNCTION get_voice_cloning_progress(task_id UUID)
RETURNS TABLE (
  step TEXT,
  status TEXT,
  message TEXT,
  percentage INT
) AS $$
DECLARE
  task_record RECORD;
  current_step TEXT;
  status_text TEXT;
  message_text TEXT;
  progress INT;
BEGIN
  -- Get task record
  SELECT * INTO task_record
  FROM voice_tasks
  WHERE id = task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  -- Determine current step and progress
  IF task_record.provider_voice_id IS NOT NULL THEN
    current_step := 'completed';
    status_text := 'completed';
    message_text := 'Voice is ready to use';
    progress := 100;
  ELSIF task_record.generate_task_id IS NOT NULL THEN
    current_step := 'wait_voice_id';
    status_text := COALESCE(task_record.generate_status, 'pending');
    message_text := 'Waiting for voice ID';
    progress := 83;
  ELSIF task_record.recording_url IS NOT NULL THEN
    current_step := 'generate_voice';
    status_text := 'generating';
    message_text := 'Generating voice from recording';
    progress := 67;
  ELSIF task_record.validate_phrase IS NOT NULL THEN
    current_step := 'record_phrase';
    status_text := 'ready';
    message_text := 'Ready to record phrase';
    progress := 50;
  ELSIF task_record.validate_task_id IS NOT NULL THEN
    current_step := 'validate_phrase';
    status_text := COALESCE(task_record.validate_status, 'pending');
    message_text := 'Waiting for validation phrase';
    progress := 17;
  ELSE
    current_step := 'upload';
    status_text := 'pending';
    message_text := 'Upload original voice';
    progress := 0;
  END IF;

  RETURN QUERY NEXT
  SELECT current_step, status_text, message_text, progress;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR CONVENIENCE
-- ============================================================================

-- View for active voices (verified and not deleted)
CREATE OR REPLACE VIEW active_voices AS
SELECT
  id,
  user_id,
  name,
  description,
  sample_url,
  waveform_url,
  duration_seconds,
  provider_voice_id,
  metadata,
  created_at,
  updated_at
FROM voices
WHERE is_verified = true
  AND deleted_at IS NULL;

-- View for voice cloning statistics
CREATE OR REPLACE VIEW voice_cloning_stats AS
SELECT
  u.id AS user_id,
  COUNT(DISTINCT v.id) AS total_voices,
  COUNT(DISTINCT CASE WHEN v.is_verified THEN v.id END) AS verified_voices,
  COUNT(DISTINCT CASE WHEN v.deleted_at IS NULL THEN v.id END) AS active_voices
FROM users u
LEFT JOIN voices v ON v.user_id = u.id
GROUP BY u.id;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE voices IS 'Custom AI voices created by users via Suno Voice API';
COMMENT ON TABLE voice_tasks IS 'Tracks progress of voice cloning workflow (6-step process)';
COMMENT ON COLUMN voices.provider_voice_id IS 'Voice ID from Suno API, used for music generation';
COMMENT ON COLUMN voices.is_verified IS 'Whether voice has been successfully created and is ready for use';
COMMENT ON COLUMN voice_tasks.validate_task_id IS 'Task ID returned by Suno /voice/validate endpoint';
COMMENT ON COLUMN voice_tasks.generate_task_id IS 'Task ID returned by Suno /voice/generate endpoint';
COMMENT ON COLUMN voice_tasks.provider_voice_id IS 'Final voice ID from Suno API after successful cloning';
COMMENT ON COLUMN voice_tasks.validate_phrase IS 'Validation phrase that user needs to record';
COMMENT ON COLUMN voice_tasks.recording_url IS 'URL to user''s recording of the validation phrase';

-- ============================================================================
-- GRANTS (if needed for specific use cases)
-- ============================================================================

-- These are typically handled by RLS, but can be added for service roles
-- GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT ALL ON TABLE voices TO authenticated;
-- GRANT ALL ON TABLE voice_tasks TO authenticated;
-- GRANT ALL ON SEQUENCE voices_id_seq TO authenticated;
-- GRANT ALL ON SEQUENCE voice_tasks_id_seq TO authenticated;

-- ============================================================================
-- CLEANUP FUNCTIONS (for maintenance)
-- ============================================================================

-- Function to cleanup old failed tasks
CREATE OR REPLACE FUNCTION cleanup_old_voice_tasks(days_to_keep INT DEFAULT 7)
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM voice_tasks
  WHERE created_at < now() - (days_to_keep || 7) * INTERVAL '1 day'
    AND (completed_at IS NULL OR completed_at < now() - (days_to_keep || 7) * INTERVAL '1 day');

  GET DIAGNOSTICS deleted_count INTO deleted_count;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_voice_tasks IS 'Cleanup old voice tasks older than specified days';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Voice Cloning Database Migration Completed Successfully';
  RAISE NOTICE 'Tables created: voices, voice_tasks';
  RAISE NOTICE 'RLS policies enabled';
  RAISE NOTICE 'Indexes created for performance';
  RAISE NOTICE 'Triggers and functions created';
END $$;