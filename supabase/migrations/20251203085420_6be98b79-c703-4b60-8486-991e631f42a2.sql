-- Add telegram file_id caching to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS telegram_file_id TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS telegram_cover_file_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tracks_telegram_file_id ON tracks(telegram_file_id) WHERE telegram_file_id IS NOT NULL;