-- Phase 1: Extend tracks table with SunoAPI fields
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS suno_model VARCHAR(20),
ADD COLUMN IF NOT EXISTS generation_mode VARCHAR(20) DEFAULT 'simple',
ADD COLUMN IF NOT EXISTS vocal_gender VARCHAR(1),
ADD COLUMN IF NOT EXISTS style_weight DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS negative_tags TEXT,
ADD COLUMN IF NOT EXISTS streaming_url TEXT,
ADD COLUMN IF NOT EXISTS local_audio_url TEXT,
ADD COLUMN IF NOT EXISTS local_cover_url TEXT;

-- Extend generation_tasks table
ALTER TABLE generation_tasks
ADD COLUMN IF NOT EXISTS suno_task_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS callback_received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS audio_clips JSONB,
ADD COLUMN IF NOT EXISTS generation_mode VARCHAR(20),
ADD COLUMN IF NOT EXISTS model_used VARCHAR(20);

-- Enable realtime for progress monitoring
DO $$ 
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tracks;
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.generation_tasks;
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
  END;
END $$;