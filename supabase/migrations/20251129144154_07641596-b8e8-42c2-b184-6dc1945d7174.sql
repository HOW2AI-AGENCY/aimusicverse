-- Add is_public field to music_projects (if not exists)
ALTER TABLE public.music_projects 
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Add is_public field to artists (if not exists)
ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Create subscription_tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'premium', 'enterprise');

-- Add subscription_tier to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier public.subscription_tier DEFAULT 'free';

-- Create function to check if user is premium or admin
CREATE OR REPLACE FUNCTION public.is_premium_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id 
    AND subscription_tier IN ('premium', 'enterprise')
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role = 'admin'
  );
$$;

-- Update RLS policies for music_projects to include public projects
DROP POLICY IF EXISTS "Users can view own projects" ON public.music_projects;
CREATE POLICY "Users can view own or public projects" 
ON public.music_projects 
FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

-- Update RLS policies for tracks to include public tracks
DROP POLICY IF EXISTS "Users can view own tracks or public tracks" ON public.tracks;
CREATE POLICY "Users can view own or public tracks" 
ON public.tracks 
FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

-- Update RLS policies for artists to include public artists
DROP POLICY IF EXISTS "Users can view own artists" ON public.artists;
CREATE POLICY "Users can view own or public artists" 
ON public.artists 
FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_music_projects_is_public ON public.music_projects(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_tracks_is_public ON public.tracks(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_artists_is_public ON public.artists(is_public) WHERE is_public = true;