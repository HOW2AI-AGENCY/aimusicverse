-- Function to get comprehensive generation analytics
CREATE OR REPLACE FUNCTION public.get_generation_analytics(_time_period interval DEFAULT '30 days'::interval)
RETURNS TABLE(
  -- Generation stats
  total_generations bigint,
  successful_generations bigint,
  failed_generations bigint,
  avg_generation_time_seconds numeric,
  total_generation_time_minutes numeric,
  
  -- Cost stats
  total_estimated_cost numeric,
  avg_cost_per_generation numeric,
  cost_by_service jsonb,
  
  -- Style/Genre stats
  top_styles jsonb,
  top_genres jsonb,
  
  -- Tag usage stats
  top_tags jsonb,
  tag_combinations jsonb,
  
  -- Model usage
  model_distribution jsonb,
  
  -- Time distribution
  generations_by_day jsonb,
  generations_by_hour jsonb
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _total bigint;
  _successful bigint;
  _failed bigint;
  _avg_time numeric;
  _total_time numeric;
  _total_cost numeric;
  _avg_cost numeric;
  _cost_by_service jsonb;
  _top_styles jsonb;
  _top_genres jsonb;
  _top_tags jsonb;
  _tag_combos jsonb;
  _model_dist jsonb;
  _by_day jsonb;
  _by_hour jsonb;
BEGIN
  -- Generation counts
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed')
  INTO _total, _successful, _failed
  FROM generation_tasks
  WHERE created_at >= now() - _time_period;
  
  -- Average generation time (for completed tasks)
  SELECT 
    ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)))::numeric, 2),
    ROUND(SUM(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60)::numeric, 2)
  INTO _avg_time, _total_time
  FROM generation_tasks
  WHERE created_at >= now() - _time_period
    AND status = 'completed'
    AND completed_at IS NOT NULL;
  
  -- Cost analytics from api_usage_logs
  SELECT 
    COALESCE(SUM(estimated_cost), 0),
    ROUND(COALESCE(AVG(estimated_cost), 0)::numeric, 4)
  INTO _total_cost, _avg_cost
  FROM api_usage_logs
  WHERE created_at >= now() - _time_period
    AND service ILIKE '%suno%';
  
  -- Cost by service
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO _cost_by_service
  FROM (
    SELECT service, 
           COUNT(*) as requests,
           ROUND(COALESCE(SUM(estimated_cost), 0)::numeric, 4) as total_cost,
           ROUND(COALESCE(AVG(duration_ms), 0)::numeric, 0) as avg_duration_ms
    FROM api_usage_logs
    WHERE created_at >= now() - _time_period
    GROUP BY service
    ORDER BY total_cost DESC
    LIMIT 10
  ) t;
  
  -- Top styles from tracks
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO _top_styles
  FROM (
    SELECT 
      COALESCE(style, 'Без стиля') as style,
      COUNT(*) as count
    FROM tracks
    WHERE created_at >= now() - _time_period
      AND style IS NOT NULL AND style != ''
    GROUP BY style
    ORDER BY count DESC
    LIMIT 15
  ) t;
  
  -- Top genres (extracted from tags or style)
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO _top_genres
  FROM (
    SELECT 
      COALESCE(
        CASE 
          WHEN style ILIKE '%pop%' THEN 'Pop'
          WHEN style ILIKE '%rock%' THEN 'Rock'
          WHEN style ILIKE '%hip%hop%' OR style ILIKE '%rap%' THEN 'Hip-Hop'
          WHEN style ILIKE '%electronic%' OR style ILIKE '%edm%' OR style ILIKE '%house%' OR style ILIKE '%techno%' THEN 'Electronic'
          WHEN style ILIKE '%jazz%' THEN 'Jazz'
          WHEN style ILIKE '%classical%' THEN 'Classical'
          WHEN style ILIKE '%r&b%' OR style ILIKE '%soul%' THEN 'R&B/Soul'
          WHEN style ILIKE '%metal%' THEN 'Metal'
          WHEN style ILIKE '%folk%' OR style ILIKE '%acoustic%' THEN 'Folk/Acoustic'
          WHEN style ILIKE '%ambient%' OR style ILIKE '%chill%' THEN 'Ambient/Chill'
          WHEN style ILIKE '%latin%' OR style ILIKE '%reggaeton%' THEN 'Latin'
          WHEN style ILIKE '%country%' THEN 'Country'
          ELSE 'Other'
        END,
        'Unknown'
      ) as genre,
      COUNT(*) as count
    FROM tracks
    WHERE created_at >= now() - _time_period
      AND style IS NOT NULL
    GROUP BY genre
    ORDER BY count DESC
    LIMIT 12
  ) t;
  
  -- Top tags from generation_tag_usage
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO _top_tags
  FROM (
    SELECT tag, COUNT(*) as usage_count
    FROM (
      SELECT unnest(tags_used) as tag
      FROM generation_tag_usage
      WHERE created_at >= now() - _time_period
    ) tags
    GROUP BY tag
    ORDER BY usage_count DESC
    LIMIT 20
  ) t;
  
  -- Tag combinations (most popular pairs)
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO _tag_combos
  FROM (
    SELECT 
      array_to_string(tags_used[1:3], ', ') as tag_combo,
      COUNT(*) as count
    FROM generation_tag_usage
    WHERE created_at >= now() - _time_period
      AND array_length(tags_used, 1) >= 2
    GROUP BY tag_combo
    ORDER BY count DESC
    LIMIT 10
  ) t;
  
  -- Model distribution
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO _model_dist
  FROM (
    SELECT 
      COALESCE(model_used, generation_mode, 'unknown') as model,
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE status = 'completed') as successful,
      ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)))::numeric, 2) as avg_time_seconds
    FROM generation_tasks
    WHERE created_at >= now() - _time_period
    GROUP BY model
    ORDER BY count DESC
  ) t;
  
  -- Generations by day
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO _by_day
  FROM (
    SELECT 
      date_trunc('day', created_at)::date as day,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) FILTER (WHERE status = 'failed') as failed
    FROM generation_tasks
    WHERE created_at >= now() - _time_period
    GROUP BY day
    ORDER BY day
  ) t;
  
  -- Generations by hour (pattern analysis)
  SELECT COALESCE(jsonb_object_agg(hour, count), '{}'::jsonb)
  INTO _by_hour
  FROM (
    SELECT 
      EXTRACT(HOUR FROM created_at)::int as hour,
      COUNT(*) as count
    FROM generation_tasks
    WHERE created_at >= now() - _time_period
    GROUP BY hour
    ORDER BY hour
  ) t;
  
  RETURN QUERY SELECT
    _total,
    _successful,
    _failed,
    COALESCE(_avg_time, 0),
    COALESCE(_total_time, 0),
    _total_cost,
    _avg_cost,
    _cost_by_service,
    _top_styles,
    _top_genres,
    _top_tags,
    _tag_combos,
    _model_dist,
    _by_day,
    _by_hour;
END;
$function$;