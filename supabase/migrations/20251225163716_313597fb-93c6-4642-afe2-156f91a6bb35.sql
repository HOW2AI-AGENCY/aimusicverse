-- ============================================
-- Studio Projects Table for Unified DAW Studio
-- ============================================

-- Create studio_projects table
CREATE TABLE public.studio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Musical settings
  bpm INTEGER DEFAULT 120 CHECK (bpm >= 20 AND bpm <= 300),
  key_signature VARCHAR(10),
  time_signature VARCHAR(10) DEFAULT '4/4',
  duration_seconds INTEGER,
  
  -- Master controls
  master_volume NUMERIC(4,3) DEFAULT 0.85 CHECK (master_volume >= 0 AND master_volume <= 1),
  
  -- Tracks stored as JSONB array
  -- Structure: [{ id, name, type, audioUrl, volume, pan, muted, solo, color, clips[], effects }]
  tracks JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'mixing', 'mastering', 'completed', 'archived')),
  stems_mode VARCHAR(50) DEFAULT 'none' CHECK (stems_mode IN ('none', 'simple', 'detailed')),
  
  -- View settings (persisted per project)
  view_settings JSONB DEFAULT '{
    "zoom": 50,
    "snapToGrid": true,
    "gridSize": 4,
    "viewMode": "timeline"
  }'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.studio_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own studio projects"
ON public.studio_projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own studio projects"
ON public.studio_projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own studio projects"
ON public.studio_projects FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own studio projects"
ON public.studio_projects FOR DELETE
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_studio_projects_user ON public.studio_projects(user_id);
CREATE INDEX idx_studio_projects_source ON public.studio_projects(source_track_id);
CREATE INDEX idx_studio_projects_status ON public.studio_projects(status);
CREATE INDEX idx_studio_projects_updated ON public.studio_projects(updated_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_studio_projects_updated_at
  BEFORE UPDATE ON public.studio_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comment
COMMENT ON TABLE public.studio_projects IS 'Unified DAW studio projects with multi-track support';