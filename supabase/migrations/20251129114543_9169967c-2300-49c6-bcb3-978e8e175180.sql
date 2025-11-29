-- Create enums for categorization
CREATE TYPE tag_category AS ENUM (
  'structure',
  'vocal',
  'instrument',
  'genre_style',
  'mood_energy',
  'production_texture',
  'effect_processing',
  'special_effects',
  'transition_dynamics',
  'format'
);

CREATE TYPE suno_model_status AS ENUM ('deprecated', 'active', 'latest');

-- Suno model versions table
CREATE TABLE public.suno_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(10) NOT NULL UNIQUE,
  model_name VARCHAR(50) NOT NULL UNIQUE,
  status suno_model_status NOT NULL DEFAULT 'active',
  max_prompt_length INTEGER,
  max_style_length INTEGER,
  max_title_length INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suno meta tags table
CREATE TABLE public.suno_meta_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name VARCHAR(100) NOT NULL UNIQUE,
  category tag_category NOT NULL,
  description TEXT,
  syntax_format VARCHAR(200),
  is_explicit_format BOOLEAN DEFAULT false,
  compatible_models VARCHAR[] DEFAULT ARRAY['chirp-v4', 'chirp-auk', 'chirp-bluejay', 'chirp-crow'],
  usage_examples TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Music styles table
CREATE TABLE public.music_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  style_name VARCHAR(200) NOT NULL UNIQUE,
  primary_genre VARCHAR(100),
  geographic_influence VARCHAR(100)[],
  mood_atmosphere VARCHAR(100)[],
  is_fusion BOOLEAN DEFAULT false,
  component_count INTEGER,
  popularity_score INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tag relationships (graph structure)
CREATE TABLE public.tag_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES public.suno_meta_tags(id) ON DELETE CASCADE,
  related_tag_id UUID NOT NULL REFERENCES public.suno_meta_tags(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL, -- 'complements', 'conflicts', 'enhances', 'requires'
  strength INTEGER DEFAULT 1 CHECK (strength >= 1 AND strength <= 10),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tag_id, related_tag_id, relationship_type)
);

-- Style to tag mappings
CREATE TABLE public.style_tag_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  style_id UUID NOT NULL REFERENCES public.music_styles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.suno_meta_tags(id) ON DELETE CASCADE,
  relevance_score INTEGER DEFAULT 5 CHECK (relevance_score >= 1 AND relevance_score <= 10),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(style_id, tag_id)
);

-- User tag preferences
CREATE TABLE public.user_tag_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tag_id UUID NOT NULL REFERENCES public.suno_meta_tags(id) ON DELETE CASCADE,
  style_id UUID REFERENCES public.music_styles(id) ON DELETE CASCADE,
  usage_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tag_id, style_id)
);

-- Prompt templates table
CREATE TABLE public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name VARCHAR(200) NOT NULL,
  template_text TEXT NOT NULL,
  tags UUID[] NOT NULL,
  style_id UUID REFERENCES public.music_styles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generation history with tags
CREATE TABLE public.generation_tag_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
  tags_used UUID[] NOT NULL,
  style_id UUID REFERENCES public.music_styles(id) ON DELETE SET NULL,
  prompt_text TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.suno_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suno_meta_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_tag_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tag_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_tag_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read for reference data
CREATE POLICY "Anyone can view suno models" ON public.suno_models
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view meta tags" ON public.suno_meta_tags
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view music styles" ON public.music_styles
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view tag relationships" ON public.tag_relationships
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view style tag mappings" ON public.style_tag_mappings
  FOR SELECT USING (true);

-- RLS Policies: User preferences
CREATE POLICY "Users can view own preferences" ON public.user_tag_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_tag_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_tag_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON public.user_tag_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: Prompt templates
CREATE POLICY "Users can view own and public templates" ON public.prompt_templates
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own templates" ON public.prompt_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.prompt_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.prompt_templates
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: Generation history
CREATE POLICY "Users can view own generation history" ON public.generation_tag_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generation history" ON public.generation_tag_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_suno_meta_tags_category ON public.suno_meta_tags(category);
CREATE INDEX idx_suno_meta_tags_tag_name ON public.suno_meta_tags(tag_name);
CREATE INDEX idx_music_styles_primary_genre ON public.music_styles(primary_genre);
CREATE INDEX idx_music_styles_style_name ON public.music_styles(style_name);
CREATE INDEX idx_tag_relationships_tag_id ON public.tag_relationships(tag_id);
CREATE INDEX idx_tag_relationships_related_tag_id ON public.tag_relationships(related_tag_id);
CREATE INDEX idx_style_tag_mappings_style_id ON public.style_tag_mappings(style_id);
CREATE INDEX idx_style_tag_mappings_tag_id ON public.style_tag_mappings(tag_id);
CREATE INDEX idx_user_tag_preferences_user_id ON public.user_tag_preferences(user_id);
CREATE INDEX idx_user_tag_preferences_tag_id ON public.user_tag_preferences(tag_id);
CREATE INDEX idx_prompt_templates_user_id ON public.prompt_templates(user_id);
CREATE INDEX idx_generation_tag_usage_user_id ON public.generation_tag_usage(user_id);
CREATE INDEX idx_generation_tag_usage_track_id ON public.generation_tag_usage(track_id);

-- Helper function: Get complementary tags (graph traversal)
CREATE OR REPLACE FUNCTION public.get_complementary_tags(
  _tag_id UUID,
  _max_depth INTEGER DEFAULT 2
)
RETURNS TABLE (
  tag_id UUID,
  tag_name VARCHAR,
  relationship_type VARCHAR,
  strength INTEGER,
  depth INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE tag_graph AS (
    -- Base case: direct relationships
    SELECT 
      tr.related_tag_id AS tag_id,
      smt.tag_name,
      tr.relationship_type,
      tr.strength,
      1 AS depth
    FROM public.tag_relationships tr
    JOIN public.suno_meta_tags smt ON smt.id = tr.related_tag_id
    WHERE tr.tag_id = _tag_id
      AND tr.relationship_type IN ('complements', 'enhances')
    
    UNION
    
    -- Recursive case: traverse deeper
    SELECT 
      tr.related_tag_id,
      smt.tag_name,
      tr.relationship_type,
      tr.strength,
      tg.depth + 1
    FROM tag_graph tg
    JOIN public.tag_relationships tr ON tr.tag_id = tg.tag_id
    JOIN public.suno_meta_tags smt ON smt.id = tr.related_tag_id
    WHERE tg.depth < _max_depth
      AND tr.relationship_type IN ('complements', 'enhances')
      AND tr.related_tag_id != _tag_id
  )
  SELECT DISTINCT 
    tg.tag_id,
    tg.tag_name,
    tg.relationship_type,
    tg.strength,
    tg.depth
  FROM tag_graph tg
  ORDER BY tg.strength DESC, tg.depth ASC;
END;
$$;

-- Helper function: Build Suno prompt from tags
CREATE OR REPLACE FUNCTION public.build_suno_prompt(
  _tag_ids UUID[],
  _style_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  _prompt TEXT := '';
  _tag RECORD;
BEGIN
  -- Add style if provided
  IF _style_id IS NOT NULL THEN
    SELECT style_name INTO _prompt FROM public.music_styles WHERE id = _style_id;
    _prompt := COALESCE(_prompt, '');
  END IF;
  
  -- Add tags with proper formatting
  FOR _tag IN 
    SELECT tag_name, syntax_format 
    FROM public.suno_meta_tags 
    WHERE id = ANY(_tag_ids)
    ORDER BY category, tag_name
  LOOP
    IF _tag.syntax_format IS NOT NULL THEN
      _prompt := _prompt || ' ' || _tag.syntax_format;
    ELSE
      _prompt := _prompt || ' ' || _tag.tag_name;
    END IF;
  END LOOP;
  
  RETURN TRIM(_prompt);
END;
$$;

-- Helper function: Recommend styles based on user history
CREATE OR REPLACE FUNCTION public.recommend_styles_for_user(
  _user_id UUID,
  _limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  style_id UUID,
  style_name VARCHAR,
  recommendation_score NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ms.id AS style_id,
    ms.style_name,
    (
      COALESCE(SUM(utp.usage_count), 0) * 1.0 +
      COALESCE(COUNT(DISTINCT CASE WHEN utp.is_favorite THEN utp.tag_id END), 0) * 5.0 +
      ms.popularity_score * 0.1
    ) AS recommendation_score
  FROM public.music_styles ms
  LEFT JOIN public.style_tag_mappings stm ON stm.style_id = ms.id
  LEFT JOIN public.user_tag_preferences utp ON utp.tag_id = stm.tag_id AND utp.user_id = _user_id
  GROUP BY ms.id, ms.style_name, ms.popularity_score
  ORDER BY recommendation_score DESC
  LIMIT _limit;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_suno_models_updated_at
  BEFORE UPDATE ON public.suno_models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suno_meta_tags_updated_at
  BEFORE UPDATE ON public.suno_meta_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_music_styles_updated_at
  BEFORE UPDATE ON public.music_styles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_tag_preferences_updated_at
  BEFORE UPDATE ON public.user_tag_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompt_templates_updated_at
  BEFORE UPDATE ON public.prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();