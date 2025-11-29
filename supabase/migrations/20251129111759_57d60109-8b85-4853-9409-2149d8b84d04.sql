-- Create project type enum
CREATE TYPE project_type AS ENUM (
  'single', 'ep', 'album', 'ost', 
  'background_music', 'jingle', 'compilation', 'mixtape'
);

-- Create artists table for musical personas
CREATE TABLE public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  style_description TEXT,
  voice_sample_url TEXT,
  genre_tags TEXT[],
  mood_tags TEXT[],
  is_ai_generated BOOLEAN DEFAULT false,
  suno_persona_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on artists
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own artists"
  ON public.artists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own artists"
  ON public.artists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own artists"
  ON public.artists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own artists"
  ON public.artists FOR DELETE
  USING (auth.uid() = user_id);

-- Expand music_projects table
ALTER TABLE public.music_projects 
  ADD COLUMN project_type project_type DEFAULT 'single',
  ADD COLUMN description TEXT,
  ADD COLUMN concept TEXT,
  ADD COLUMN release_date DATE,
  ADD COLUMN target_audience TEXT,
  ADD COLUMN reference_artists TEXT[],
  ADD COLUMN reference_tracks TEXT[],
  ADD COLUMN bpm_range INT4RANGE,
  ADD COLUMN key_signature VARCHAR(10),
  ADD COLUMN primary_artist_id UUID REFERENCES public.artists(id) ON DELETE SET NULL,
  ADD COLUMN label_name VARCHAR(255),
  ADD COLUMN copyright_info TEXT,
  ADD COLUMN is_commercial BOOLEAN DEFAULT false,
  ADD COLUMN ai_context JSONB;

-- Create project tracks table for tracklist management
CREATE TABLE public.project_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.music_projects(id) ON DELETE CASCADE,
  track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
  position INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  style_prompt TEXT,
  notes TEXT,
  recommended_tags TEXT[],
  recommended_structure TEXT,
  duration_target INTEGER,
  collab_artist_id UUID REFERENCES public.artists(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, position)
);

-- Enable RLS on project_tracks
ALTER TABLE public.project_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tracks in own projects"
  ON public.project_tracks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.music_projects 
    WHERE music_projects.id = project_tracks.project_id 
    AND music_projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert tracks in own projects"
  ON public.project_tracks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.music_projects 
    WHERE music_projects.id = project_tracks.project_id 
    AND music_projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update tracks in own projects"
  ON public.project_tracks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.music_projects 
    WHERE music_projects.id = project_tracks.project_id 
    AND music_projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete tracks in own projects"
  ON public.project_tracks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.music_projects 
    WHERE music_projects.id = project_tracks.project_id 
    AND music_projects.user_id = auth.uid()
  ));

-- Create track change log for versioning and audit trail
CREATE TABLE public.track_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.track_versions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  change_type VARCHAR(50) NOT NULL,
  changed_by VARCHAR(20) NOT NULL,
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  ai_model_used VARCHAR(100),
  prompt_used TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on track_change_log
ALTER TABLE public.track_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own track logs"
  ON public.track_change_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tracks 
    WHERE tracks.id = track_change_log.track_id 
    AND tracks.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own track logs"
  ON public.track_change_log FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tracks 
    WHERE tracks.id = track_change_log.track_id 
    AND tracks.user_id = auth.uid()
  ));

-- Create project assets table for media
CREATE TABLE public.project_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.music_projects(id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  width INTEGER,
  height INTEGER,
  is_primary BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on project_assets
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assets in own projects"
  ON public.project_assets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.music_projects 
    WHERE music_projects.id = project_assets.project_id 
    AND music_projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert assets in own projects"
  ON public.project_assets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.music_projects 
    WHERE music_projects.id = project_assets.project_id 
    AND music_projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update assets in own projects"
  ON public.project_assets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.music_projects 
    WHERE music_projects.id = project_assets.project_id 
    AND music_projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete assets in own projects"
  ON public.project_assets FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.music_projects 
    WHERE music_projects.id = project_assets.project_id 
    AND music_projects.user_id = auth.uid()
  ));

-- Create storage bucket for project assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-assets', 'project-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for project-assets bucket
CREATE POLICY "Users can view assets in own projects"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload assets to own projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update assets in own projects"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete assets in own projects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_artists_updated_at
  BEFORE UPDATE ON public.artists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_tracks_updated_at
  BEFORE UPDATE ON public.project_tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();