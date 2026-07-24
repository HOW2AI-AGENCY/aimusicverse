WITH normalized_tasks AS (
  SELECT
    gt.id AS task_id,
    gt.track_id,
    gt.user_id,
    gt.suno_task_id,
    CASE
      WHEN jsonb_typeof(gt.audio_clips) = 'array' THEN gt.audio_clips
      ELSE '[]'::jsonb
    END AS clips_json,
    t.title AS current_title,
    t.tags AS current_tags,
    t.lyrics AS current_lyrics,
    t.active_version_id,
    t.audio_url AS current_audio_url
  FROM public.generation_tasks gt
  JOIN public.tracks t ON t.id = gt.track_id
  WHERE gt.status = 'completed'
    AND gt.track_id IS NOT NULL
    AND gt.audio_clips IS NOT NULL
), candidate_tasks AS (
  SELECT *
  FROM normalized_tasks nt
  WHERE jsonb_array_length(nt.clips_json) > 0
    AND (
      nt.current_audio_url IS NULL
      OR nt.active_version_id IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM public.track_versions tv
        WHERE tv.track_id = nt.track_id
      )
    )
), extracted_clips AS (
  SELECT
    ct.task_id,
    ct.track_id,
    ct.user_id,
    ct.suno_task_id,
    clip_item.value AS clip,
    clip_item.ordinality::integer - 1 AS clip_index,
    CASE clip_item.ordinality::integer
      WHEN 1 THEN 'A'
      WHEN 2 THEN 'B'
      WHEN 3 THEN 'C'
      WHEN 4 THEN 'D'
      WHEN 5 THEN 'E'
      ELSE 'V' || clip_item.ordinality::text
    END AS version_label,
    COALESCE(
      clip_item.value->>'sourceAudioUrl',
      clip_item.value->>'source_audio_url',
      clip_item.value->>'audioUrl',
      clip_item.value->>'audio_url'
    ) AS audio_url,
    COALESCE(
      clip_item.value->>'sourceImageUrl',
      clip_item.value->>'source_image_url',
      clip_item.value->>'imageUrl',
      clip_item.value->>'image_url'
    ) AS cover_url,
    COALESCE(
      clip_item.value->>'sourceStreamAudioUrl',
      clip_item.value->>'source_stream_audio_url',
      clip_item.value->>'streamAudioUrl',
      clip_item.value->>'stream_audio_url',
      clip_item.value->>'sourceAudioUrl',
      clip_item.value->>'source_audio_url',
      clip_item.value->>'audioUrl',
      clip_item.value->>'audio_url'
    ) AS streaming_url,
    NULLIF(clip_item.value->>'title', '') AS clip_title,
    NULLIF(clip_item.value->>'tags', '') AS clip_tags,
    COALESCE(NULLIF(clip_item.value->>'prompt', ''), NULLIF(clip_item.value->>'lyrics', ''), NULLIF(clip_item.value->>'lyric', '')) AS clip_lyrics,
    COALESCE(NULLIF(clip_item.value->>'modelName', ''), NULLIF(clip_item.value->>'model_name', '')) AS model_name,
    NULLIF(clip_item.value->>'id', '') AS suno_id,
    CASE
      WHEN (clip_item.value->>'duration') ~ '^[0-9]+(\.[0-9]+)?$'
        THEN round((clip_item.value->>'duration')::numeric)::integer
      ELSE NULL
    END AS duration_seconds
  FROM candidate_tasks ct
  CROSS JOIN LATERAL jsonb_array_elements(ct.clips_json) WITH ORDINALITY AS clip_item(value, ordinality)
), usable_clips AS (
  SELECT *
  FROM extracted_clips
  WHERE audio_url IS NOT NULL
), inserted_versions AS (
  INSERT INTO public.track_versions (
    track_id,
    version_label,
    clip_index,
    version_type,
    is_primary,
    audio_url,
    cover_url,
    duration_seconds,
    metadata
  )
  SELECT
    uc.track_id,
    uc.version_label,
    uc.clip_index,
    CASE WHEN uc.clip_index = 0 THEN 'initial' ELSE 'original' END,
    uc.clip_index = 0,
    uc.audio_url,
    uc.cover_url,
    uc.duration_seconds,
    jsonb_build_object(
      'suno_id', uc.suno_id,
      'suno_task_id', uc.suno_task_id,
      'title', uc.clip_title,
      'tags', uc.clip_tags,
      'lyrics', uc.clip_lyrics,
      'model_name', uc.model_name,
      'backfilled', true,
      'backfilled_at', now()
    )
  FROM usable_clips uc
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.track_versions tv
    WHERE tv.track_id = uc.track_id
      AND tv.version_label = uc.version_label
  )
  RETURNING id, track_id, version_label, clip_index
), primary_versions AS (
  SELECT DISTINCT ON (tv.track_id)
    tv.track_id,
    tv.id AS version_id
  FROM public.track_versions tv
  JOIN candidate_tasks ct ON ct.track_id = tv.track_id
  WHERE tv.audio_url IS NOT NULL
  ORDER BY tv.track_id, tv.clip_index ASC NULLS LAST, tv.created_at ASC
), first_usable_clip AS (
  SELECT DISTINCT ON (track_id)
    track_id,
    audio_url,
    streaming_url,
    cover_url,
    clip_title,
    clip_tags,
    clip_lyrics,
    model_name,
    suno_id,
    suno_task_id,
    duration_seconds
  FROM usable_clips
  ORDER BY track_id, clip_index ASC
)
UPDATE public.tracks t
SET
  status = 'completed',
  audio_url = COALESCE(t.audio_url, f.audio_url),
  streaming_url = COALESCE(t.streaming_url, f.streaming_url, f.audio_url),
  cover_url = COALESCE(t.cover_url, f.cover_url),
  title = COALESCE(NULLIF(t.title, ''), f.clip_title, 'Трек'),
  tags = COALESCE(t.tags, f.clip_tags),
  lyrics = COALESCE(t.lyrics, f.clip_lyrics),
  suno_id = COALESCE(t.suno_id, f.suno_id),
  suno_task_id = COALESCE(t.suno_task_id, f.suno_task_id),
  model_name = COALESCE(t.model_name, f.model_name, 'chirp-v4'),
  duration_seconds = COALESCE(t.duration_seconds, f.duration_seconds),
  active_version_id = COALESCE(t.active_version_id, pv.version_id),
  updated_at = now()
FROM first_usable_clip f
LEFT JOIN primary_versions pv ON pv.track_id = f.track_id
WHERE t.id = f.track_id
  AND (
    t.audio_url IS NULL
    OR t.active_version_id IS NULL
    OR t.cover_url IS NULL
  );