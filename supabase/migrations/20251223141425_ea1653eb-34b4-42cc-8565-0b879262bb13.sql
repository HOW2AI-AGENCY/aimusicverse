-- Add banner_url column to music_projects table
ALTER TABLE public.music_projects 
ADD COLUMN banner_url text;

-- Add banner_prompt column to store the prompt used for generation
ALTER TABLE public.music_projects 
ADD COLUMN banner_prompt text;

-- Add comment for documentation
COMMENT ON COLUMN public.music_projects.banner_url IS 'URL for project banner (16:9 widescreen format)';
COMMENT ON COLUMN public.music_projects.banner_prompt IS 'Prompt used to generate the banner';