-- Add cover_prompt field for AI-generated cover art prompts
ALTER TABLE public.music_projects 
ADD COLUMN IF NOT EXISTS cover_prompt text;