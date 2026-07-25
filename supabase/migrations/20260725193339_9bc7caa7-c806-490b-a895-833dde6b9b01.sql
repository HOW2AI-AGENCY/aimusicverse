WITH task AS (
  SELECT gt.id AS task_id, gt.track_id, gt.user_id, gt.suno_task_id, gt.audio_clips
  FROM public.generation_tasks gt
  WHERE gt.id = '56ccb794-d260-46ea-82cc-d9e92d2a6618'
), clips AS (
  SELECT task.*, c AS clip, (ord - 1) AS clip_index
  FROM task, jsonb_array_elements(task.audio_clips) WITH ORDINALITY AS t(c, ord)
), ins AS (
  INSERT INTO public.track_versions (
    track_id, audio_url, cover_url, duration_seconds, version_type,
    version_label, clip_index, is_primary, metadata
  )
  SELECT
    clips.track_id,
    COALESCE(clip->>'sourceAudioUrl', clip->>'audioUrl'),
    COALESCE(clip->>'sourceImageUrl', clip->>'imageUrl'),
    ROUND((clip->>'duration')::numeric)::int,
    CASE WHEN clip_index = 0 THEN 'initial' ELSE 'original' END,
    CASE WHEN clip_index = 0 THEN 'A' ELSE 'B' END,
    clip_index,
    clip_index = 0,
    jsonb_build_object(
      'suno_id', clip->>'id',
      'title', clip->>'title',
      'tags', clip->>'tags',
      'model_name', clip->>'modelName',
      'suno_task_id', clips.suno_task_id,
      'stream_audio_url', COALESCE(clip->>'sourceStreamAudioUrl', clip->>'streamAudioUrl'),
      'restored_by', 'manual_restore'
    )
  FROM clips
  WHERE COALESCE(clip->>'sourceAudioUrl', clip->>'audioUrl') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.track_versions tv
      WHERE tv.track_id = clips.track_id AND tv.clip_index = clips.clip_index
    )
  RETURNING id, track_id, clip_index, audio_url, cover_url, duration_seconds, metadata
)
UPDATE public.tracks t
SET status = 'completed',
    error_message = NULL,
    audio_url = ins.audio_url,
    streaming_url = COALESCE(ins.metadata->>'stream_audio_url', ins.audio_url),
    cover_url = ins.cover_url,
    duration_seconds = ins.duration_seconds,
    suno_id = ins.metadata->>'suno_id',
    model_name = COALESCE(ins.metadata->>'model_name', t.model_name),
    active_version_id = ins.id
FROM ins
WHERE t.id = ins.track_id AND ins.clip_index = 0;