-- Migration: Create CDN and Media Cache Tables
-- Sprint: 010 Infrastructure Setup
-- Created: 2025-12-03
-- Purpose: CDN caching, media processing queue, and optimization settings

-- Table for CDN asset caching
CREATE TABLE IF NOT EXISTS cdn_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_url TEXT NOT NULL UNIQUE,
  cdn_url TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'audio', 'video', 'other')),
  width INTEGER CHECK (width > 0),
  height INTEGER CHECK (height > 0),
  format TEXT, -- 'webp', 'jpeg', 'png', 'mp3', 'wav', etc.
  file_size_bytes BIGINT CHECK (file_size_bytes >= 0),
  cache_hit_count INTEGER DEFAULT 0 CHECK (cache_hit_count >= 0),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cdn_assets ENABLE ROW LEVEL SECURITY;

-- Anyone can read CDN assets
CREATE POLICY "Anyone can view CDN assets"
ON cdn_assets FOR SELECT
TO authenticated, anon
USING (true);

-- Only service role can manage CDN assets
CREATE POLICY "Service role can manage CDN assets"
ON cdn_assets FOR ALL
TO service_role
USING (true);

-- Create indexes
CREATE INDEX idx_cdn_assets_url ON cdn_assets(original_url);
CREATE INDEX idx_cdn_assets_type ON cdn_assets(asset_type);
CREATE INDEX idx_cdn_assets_accessed ON cdn_assets(last_accessed_at DESC);
CREATE INDEX idx_cdn_assets_expires ON cdn_assets(expires_at) WHERE expires_at IS NOT NULL;

-- Add comments
COMMENT ON TABLE cdn_assets IS 'CDN cached assets with metadata for performance tracking';
COMMENT ON COLUMN cdn_assets.cache_hit_count IS 'Number of times this CDN URL has been accessed';

-- Table for media processing queue
CREATE TABLE IF NOT EXISTS media_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN (
    'transcode_audio', 
    'optimize_image', 
    'generate_thumbnail', 
    'separate_stems',
    'generate_waveform',
    'extract_metadata'
  )),
  input_url TEXT NOT NULL,
  output_bucket TEXT NOT NULL,
  output_path TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  priority INTEGER DEFAULT 0, -- Higher number = higher priority
  attempts INTEGER DEFAULT 0 CHECK (attempts >= 0),
  max_attempts INTEGER DEFAULT 3,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE media_processing_queue ENABLE ROW LEVEL SECURITY;

-- Users can view their own processing tasks
CREATE POLICY "Users can view own processing tasks"
ON media_processing_queue FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own processing tasks
CREATE POLICY "Users can insert processing tasks"
ON media_processing_queue FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can cancel their own tasks
CREATE POLICY "Users can cancel own tasks"
ON media_processing_queue FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- Service role can manage all tasks
CREATE POLICY "Service role can manage processing tasks"
ON media_processing_queue FOR ALL
TO service_role
USING (true);

-- Create indexes
CREATE INDEX idx_media_queue_status ON media_processing_queue(status, priority DESC, created_at ASC);
CREATE INDEX idx_media_queue_user ON media_processing_queue(user_id);
CREATE INDEX idx_media_queue_type ON media_processing_queue(task_type);
CREATE INDEX idx_media_queue_created ON media_processing_queue(created_at DESC);

-- Add comments
COMMENT ON TABLE media_processing_queue IS 'Queue for asynchronous media processing tasks';
COMMENT ON COLUMN media_processing_queue.priority IS 'Task priority (higher = process sooner)';
COMMENT ON COLUMN media_processing_queue.progress IS 'Processing progress percentage (0-100)';

-- Table for asset optimization settings
CREATE TABLE IF NOT EXISTS asset_optimization_settings (
  asset_type TEXT PRIMARY KEY CHECK (asset_type IN ('cover', 'avatar', 'banner', 'track', 'stem', 'upload')),
  max_width INTEGER CHECK (max_width > 0),
  max_height INTEGER CHECK (max_height > 0),
  quality INTEGER CHECK (quality >= 1 AND quality <= 100), -- for images
  format TEXT, -- preferred format
  compression_level INTEGER CHECK (compression_level >= 0 AND compression_level <= 9), -- for audio
  generate_thumbnails BOOLEAN DEFAULT FALSE,
  thumbnail_sizes INTEGER[], -- array of sizes [128, 256, 512]
  max_duration_seconds INTEGER CHECK (max_duration_seconds > 0), -- for audio/video
  bitrate_kbps INTEGER CHECK (bitrate_kbps > 0), -- for audio
  sample_rate_hz INTEGER CHECK (sample_rate_hz > 0), -- for audio
  settings JSONB DEFAULT '{}'::jsonb, -- additional settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE asset_optimization_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read optimization settings
CREATE POLICY "Anyone can view optimization settings"
ON asset_optimization_settings FOR SELECT
TO authenticated, anon
USING (true);

-- Only service role can manage settings
CREATE POLICY "Service role can manage settings"
ON asset_optimization_settings FOR ALL
TO service_role
USING (true);

-- Add comments
COMMENT ON TABLE asset_optimization_settings IS 'Configuration for automatic asset optimization';

-- Insert default optimization settings
INSERT INTO asset_optimization_settings (
  asset_type, max_width, max_height, quality, format, 
  generate_thumbnails, thumbnail_sizes, bitrate_kbps, sample_rate_hz
) VALUES
  -- Cover images: high quality, generate thumbnails
  ('cover', 3000, 3000, 90, 'webp', TRUE, ARRAY[256, 512, 1024], NULL, NULL),
  
  -- Avatars: medium quality, generate thumbnails
  ('avatar', 512, 512, 85, 'webp', TRUE, ARRAY[64, 128, 256], NULL, NULL),
  
  -- Banners: high quality, wide format
  ('banner', 1920, 1080, 90, 'webp', TRUE, ARRAY[480, 960, 1920], NULL, NULL),
  
  -- Tracks: optimize for streaming
  ('track', NULL, NULL, NULL, 'mp3', TRUE, NULL, 320, 48000),
  
  -- Stems: high quality, no optimization
  ('stem', NULL, NULL, NULL, 'wav', FALSE, NULL, NULL, 48000),
  
  -- User uploads: optimize after upload
  ('upload', NULL, NULL, NULL, 'mp3', TRUE, NULL, 256, 44100)
ON CONFLICT (asset_type) DO NOTHING;

-- Function to increment CDN cache hit count
CREATE OR REPLACE FUNCTION increment_cdn_cache_hit(asset_url TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE cdn_assets
  SET 
    cache_hit_count = cache_hit_count + 1,
    last_accessed_at = NOW()
  WHERE original_url = asset_url OR cdn_url = asset_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_cdn_cache_hit IS 'Increment cache hit counter for CDN asset';

-- Function to update media processing queue timestamp
CREATE OR REPLACE FUNCTION update_media_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Set started_at when status changes to processing
  IF NEW.status = 'processing' AND OLD.status != 'processing' THEN
    NEW.started_at = NOW();
  END IF;
  
  -- Set completed_at when status changes to completed or failed
  IF NEW.status IN ('completed', 'failed') AND OLD.status NOT IN ('completed', 'failed') THEN
    NEW.completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER media_queue_updated_at_trigger
BEFORE UPDATE ON media_processing_queue
FOR EACH ROW
EXECUTE FUNCTION update_media_queue_updated_at();

-- Function to get next pending task from queue
CREATE OR REPLACE FUNCTION get_next_processing_task()
RETURNS media_processing_queue AS $$
DECLARE
  task media_processing_queue;
BEGIN
  -- Get highest priority pending task that hasn't exceeded max attempts
  SELECT * INTO task
  FROM media_processing_queue
  WHERE status = 'pending'
  AND attempts < max_attempts
  ORDER BY priority DESC, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  -- Update task status to processing
  IF FOUND THEN
    UPDATE media_processing_queue
    SET 
      status = 'processing',
      attempts = attempts + 1,
      started_at = NOW()
    WHERE id = task.id;
    
    -- Return updated task
    SELECT * INTO task
    FROM media_processing_queue
    WHERE id = task.id;
  END IF;
  
  RETURN task;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_next_processing_task IS 'Get next pending task from processing queue and mark as processing';

-- Function to update optimization settings timestamp
CREATE OR REPLACE FUNCTION update_optimization_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER optimization_settings_updated_at_trigger
BEFORE UPDATE ON asset_optimization_settings
FOR EACH ROW
EXECUTE FUNCTION update_optimization_settings_updated_at();

-- View for queue statistics
CREATE OR REPLACE VIEW media_queue_stats AS
SELECT
  status,
  task_type,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_processing_time_seconds,
  AVG(progress) as avg_progress
FROM media_processing_queue
GROUP BY status, task_type;

COMMENT ON VIEW media_queue_stats IS 'Statistics for media processing queue';
