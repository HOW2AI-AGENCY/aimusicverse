-- Fix security warnings: Add search_path to functions

-- Fix get_complementary_tags function
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
SECURITY DEFINER
SET search_path = public
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

-- Fix build_suno_prompt function
CREATE OR REPLACE FUNCTION public.build_suno_prompt(
  _tag_ids UUID[],
  _style_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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

-- Fix recommend_styles_for_user function
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
SECURITY DEFINER
SET search_path = public
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