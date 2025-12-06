-- Add columns for Suno video generation
ALTER TABLE public.video_generation_tasks 
ADD COLUMN IF NOT EXISTS suno_task_id TEXT,
ADD COLUMN IF NOT EXISTS video_task_id TEXT,
ADD COLUMN IF NOT EXISTS suno_audio_id TEXT,
ADD COLUMN IF NOT EXISTS local_video_url TEXT;

-- Create index for video_task_id lookups
CREATE INDEX IF NOT EXISTS idx_video_tasks_video_task_id ON public.video_generation_tasks(video_task_id);

-- Add video columns to tracks table
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS local_video_url TEXT;