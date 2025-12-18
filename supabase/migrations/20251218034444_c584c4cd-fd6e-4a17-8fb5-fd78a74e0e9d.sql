-- Add visual_aesthetic field to music_projects for cover generation guidance
ALTER TABLE public.music_projects 
ADD COLUMN IF NOT EXISTS visual_aesthetic TEXT;

COMMENT ON COLUMN public.music_projects.visual_aesthetic IS 'Visual styling guidance for AI cover generation';