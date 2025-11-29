-- Add language field to music_projects
ALTER TABLE public.music_projects
ADD COLUMN language VARCHAR(5) DEFAULT 'ru' CHECK (language IN ('ru', 'en'));

COMMENT ON COLUMN public.music_projects.language IS 'Project language: ru (Russian) or en (English)';

-- Create index for language filtering
CREATE INDEX idx_music_projects_language ON public.music_projects(language);