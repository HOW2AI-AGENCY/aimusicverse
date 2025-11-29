-- Create music projects table
CREATE TABLE public.music_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'single' CHECK (type IN ('single', 'ep', 'album')),
  genre VARCHAR(100),
  mood VARCHAR(100),
  context_vector JSONB,
  cover_url TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tracks table
CREATE TABLE public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.music_projects(id) ON DELETE SET NULL,
  title VARCHAR(255),
  prompt TEXT NOT NULL,
  lyrics TEXT,
  style VARCHAR(255),
  tags TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'processing', 'completed', 'failed')),
  provider VARCHAR(50) DEFAULT 'lovable_ai',
  audio_url TEXT,
  cover_url TEXT,
  duration_seconds INTEGER,
  has_vocals BOOLEAN DEFAULT true,
  model_name VARCHAR(50),
  suno_id VARCHAR(255),
  suno_task_id VARCHAR(255) UNIQUE,
  error_message TEXT,
  play_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create track versions table
CREATE TABLE public.track_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  parent_version_id UUID REFERENCES public.track_versions(id),
  version_type VARCHAR(50) DEFAULT 'initial' CHECK (version_type IN ('initial', 'extension', 'inpaint', 'remix')),
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  duration_seconds INTEGER,
  is_primary BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create track stems table
CREATE TABLE public.track_stems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.track_versions(id),
  stem_type VARCHAR(50) NOT NULL,
  separation_mode VARCHAR(50),
  audio_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_music_projects_user_id ON public.music_projects(user_id);
CREATE INDEX idx_tracks_user_id ON public.tracks(user_id);
CREATE INDEX idx_tracks_project_id ON public.tracks(project_id);
CREATE INDEX idx_tracks_status ON public.tracks(status);
CREATE INDEX idx_tracks_suno_task_id ON public.tracks(suno_task_id);
CREATE INDEX idx_track_versions_track_id ON public.track_versions(track_id);
CREATE INDEX idx_track_stems_track_id ON public.track_stems(track_id);

-- Enable Row Level Security
ALTER TABLE public.music_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_stems ENABLE ROW LEVEL SECURITY;

-- RLS Policies for music_projects
CREATE POLICY "Users can view own projects"
  ON public.music_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON public.music_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.music_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.music_projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for tracks
CREATE POLICY "Users can view own tracks or public tracks"
  ON public.tracks FOR SELECT
  USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can insert own tracks"
  ON public.tracks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracks"
  ON public.tracks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracks"
  ON public.tracks FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for track_versions
CREATE POLICY "Users can view own track versions"
  ON public.track_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = track_versions.track_id
      AND (tracks.user_id = auth.uid() OR tracks.is_public = TRUE)
    )
  );

CREATE POLICY "Users can insert own track versions"
  ON public.track_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = track_versions.track_id
      AND tracks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own track versions"
  ON public.track_versions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = track_versions.track_id
      AND tracks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own track versions"
  ON public.track_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = track_versions.track_id
      AND tracks.user_id = auth.uid()
    )
  );

-- RLS Policies for track_stems
CREATE POLICY "Users can view own track stems"
  ON public.track_stems FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = track_stems.track_id
      AND (tracks.user_id = auth.uid() OR tracks.is_public = TRUE)
    )
  );

CREATE POLICY "Users can insert own track stems"
  ON public.track_stems FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = track_stems.track_id
      AND tracks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own track stems"
  ON public.track_stems FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = track_stems.track_id
      AND tracks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own track stems"
  ON public.track_stems FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = track_stems.track_id
      AND tracks.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_music_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_music_projects_updated_at
  BEFORE UPDATE ON public.music_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_music_updated_at();

CREATE TRIGGER update_tracks_updated_at
  BEFORE UPDATE ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_music_updated_at();