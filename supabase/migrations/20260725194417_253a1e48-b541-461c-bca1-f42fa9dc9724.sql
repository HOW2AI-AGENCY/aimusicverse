CREATE OR REPLACE FUNCTION public.rebuild_track_versions_from_task(
  p_task_id UUID,
  p_caller UUID DEFAULT NULL
)
RETURNS TABLE(versions_created INTEGER, versions_updated INTEGER, active_version UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_row RECORD;
  clip JSONB;
  clip_idx INTEGER := 0;
  audio TEXT;
  cover TEXT;
  stream_audio TEXT;
  duration_val INTEGER;
  existing_id UUID;
  created_count INTEGER := 0;
  updated_count INTEGER := 0;
  first_ready UUID;
  version_kind TEXT;
  version_source TEXT;
  clip_title TEXT;
  clip_tags TEXT;
  clip_lyrics TEXT;
  clip_model TEXT;
  clip_suno_id TEXT;
BEGIN
  SELECT * INTO task_row FROM public.generation_tasks WHERE id = p_task_id;
  IF task_row IS NULL THEN
    RAISE EXCEPTION 'Task % not found', p_task_id;
  END IF;

  IF p_caller IS NOT NULL
     AND task_row.user_id <> p_caller
     AND NOT public.has_role(p_caller, 'admin') THEN
    RAISE EXCEPTION 'Not authorized to rebuild task %', p_task_id;
  END IF;

  IF task_row.track_id IS NULL OR jsonb_typeof(task_row.audio_clips) <> 'array' THEN
    versions_created := 0;
    versions_updated := 0;
    active_version := NULL;
    RETURN NEXT;
    RETURN;
  END IF;

  version_kind := CASE task_row.generation_mode
    WHEN 'extend' THEN 'extension'
    WHEN 'remix' THEN 'remix'
    WHEN 'cover' THEN 'cover'
    WHEN 'replace_section' THEN 'replace_section'
    WHEN 'inpaint' THEN 'inpaint'
    WHEN 'add_vocals' THEN 'vocal_add'
    WHEN 'add_instrumental' THEN 'instrumental_add'
    ELSE 'initial'
  END;

  version_source := CASE task_row.generation_mode
    WHEN 'extend' THEN 'extended'
    WHEN 'remix' THEN 'remix'
    WHEN 'cover' THEN 'cover'
    ELSE 'generated'
  END;

  FOR clip IN SELECT jsonb_array_elements(task_row.audio_clips)
  LOOP
    audio := COALESCE(
      NULLIF(clip->>'sourceAudioUrl',''),
      NULLIF(clip->>'source_audio_url',''),
      NULLIF(clip->>'audioUrl',''),
      NULLIF(clip->>'audio_url','')
    );
    cover := COALESCE(
      NULLIF(clip->>'sourceImageUrl',''),
      NULLIF(clip->>'source_image_url',''),
      NULLIF(clip->>'imageUrl',''),
      NULLIF(clip->>'image_url','')
    );
    stream_audio := COALESCE(
      NULLIF(clip->>'sourceStreamAudioUrl',''),
      NULLIF(clip->>'source_stream_audio_url',''),
      NULLIF(clip->>'streamAudioUrl',''),
      NULLIF(clip->>'stream_audio_url',''),
      audio
    );
    duration_val := CASE
      WHEN NULLIF(clip->>'duration','') IS NULL THEN NULL
      WHEN (clip->>'duration') ~ '^[0-9]+(\.[0-9]+)?$' THEN round((clip->>'duration')::numeric)::int
      ELSE NULL
    END;
    clip_title := NULLIF(clip->>'title','');
    clip_tags := NULLIF(clip->>'tags','');
    clip_lyrics := COALESCE(NULLIF(clip->>'prompt',''), NULLIF(clip->>'lyrics',''), NULLIF(clip->>'lyric',''));
    clip_model := COALESCE(NULLIF(clip->>'modelName',''), NULLIF(clip->>'model_name',''));
    clip_suno_id := NULLIF(clip->>'id','');

    IF audio IS NULL THEN
      clip_idx := clip_idx + 1;
      CONTINUE;
    END IF;

    SELECT id INTO existing_id
    FROM public.track_versions
    WHERE track_id = task_row.track_id
      AND (
        clip_index = clip_idx
        OR (clip_suno_id IS NOT NULL AND metadata->>'suno_id' = clip_suno_id)
        OR version_label = CASE clip_idx WHEN 0 THEN 'A' WHEN 1 THEN 'B' WHEN 2 THEN 'C' WHEN 3 THEN 'D' WHEN 4 THEN 'E' ELSE 'V' || (clip_idx + 1)::text END
      )
    ORDER BY
      CASE WHEN clip_index = clip_idx THEN 0 ELSE 1 END,
      created_at ASC
    LIMIT 1;

    IF existing_id IS NULL THEN
      INSERT INTO public.track_versions
        (track_id, clip_index, version_label, audio_url, cover_url,
         duration_seconds, is_primary, version_type, source_type, metadata)
      VALUES (
        task_row.track_id,
        clip_idx,
        CASE clip_idx WHEN 0 THEN 'A' WHEN 1 THEN 'B' WHEN 2 THEN 'C' WHEN 3 THEN 'D' WHEN 4 THEN 'E' ELSE 'V' || (clip_idx + 1)::text END,
        audio,
        cover,
        duration_val,
        clip_idx = 0,
        version_kind,
        version_source,
        jsonb_build_object(
          'suno_id', clip_suno_id,
          'suno_task_id', task_row.suno_task_id,
          'clip_index', clip_idx,
          'title', clip_title,
          'tags', clip_tags,
          'lyrics', clip_lyrics,
          'model_name', clip_model,
          'stream_audio_url', stream_audio,
          'rebuilt_at', now(),
          'from_task', p_task_id
        )
      )
      RETURNING id INTO existing_id;
      created_count := created_count + 1;
    ELSE
      UPDATE public.track_versions
      SET audio_url = COALESCE(NULLIF(audio_url,''), audio),
          cover_url = COALESCE(NULLIF(cover_url,''), cover),
          duration_seconds = COALESCE(duration_seconds, duration_val),
          version_type = COALESCE(version_type, version_kind),
          source_type = COALESCE(source_type, version_source),
          metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
            'suno_id', clip_suno_id,
            'suno_task_id', task_row.suno_task_id,
            'clip_index', clip_idx,
            'title', clip_title,
            'tags', clip_tags,
            'lyrics', clip_lyrics,
            'model_name', clip_model,
            'stream_audio_url', stream_audio,
            'rebuilt_at', now(),
            'from_task', p_task_id
          )
      WHERE id = existing_id
        AND (
          audio_url IS NULL OR audio_url = ''
          OR cover_url IS NULL OR cover_url = ''
          OR duration_seconds IS NULL
          OR metadata IS NULL
          OR metadata->>'suno_id' IS NULL
        );
      IF FOUND THEN
        updated_count := updated_count + 1;
      END IF;
    END IF;

    clip_idx := clip_idx + 1;
  END LOOP;

  SELECT id INTO first_ready
  FROM public.track_versions
  WHERE track_id = task_row.track_id
    AND audio_url IS NOT NULL
    AND audio_url <> ''
  ORDER BY clip_index ASC NULLS LAST, created_at ASC
  LIMIT 1;

  IF first_ready IS NOT NULL THEN
    UPDATE public.track_versions
    SET is_primary = (id = first_ready)
    WHERE track_id = task_row.track_id;

    UPDATE public.tracks
    SET active_version_id = first_ready,
        audio_url = COALESCE(NULLIF(audio_url,''), (SELECT audio_url FROM public.track_versions WHERE id = first_ready)),
        streaming_url = COALESCE(NULLIF(streaming_url,''), (SELECT COALESCE(metadata->>'stream_audio_url', audio_url) FROM public.track_versions WHERE id = first_ready)),
        cover_url = COALESCE(NULLIF(cover_url,''), (SELECT cover_url FROM public.track_versions WHERE id = first_ready)),
        duration_seconds = COALESCE(duration_seconds, (SELECT duration_seconds FROM public.track_versions WHERE id = first_ready)),
        suno_id = COALESCE(NULLIF(suno_id,''), (SELECT metadata->>'suno_id' FROM public.track_versions WHERE id = first_ready)),
        suno_task_id = COALESCE(NULLIF(suno_task_id,''), task_row.suno_task_id),
        model_name = COALESCE(NULLIF(model_name,''), (SELECT metadata->>'model_name' FROM public.track_versions WHERE id = first_ready)),
        status = CASE WHEN status IN ('failed','processing','pending','streaming_ready','partial_delivery') THEN 'completed' ELSE status END,
        updated_at = now()
    WHERE id = task_row.track_id;
  END IF;

  versions_created := created_count;
  versions_updated := updated_count;
  active_version := first_ready;
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rebuild_track_versions_from_task(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rebuild_track_versions_from_task(UUID, UUID) TO service_role;