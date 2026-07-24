CREATE OR REPLACE FUNCTION public.rebuild_track_versions_from_task(p_task_id uuid, p_caller uuid DEFAULT NULL::uuid)
RETURNS TABLE(versions_created integer, versions_updated integer, active_version uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  task_row RECORD;
  clip JSONB;
  clip_idx INTEGER;
  audio TEXT;
  cover TEXT;
  duration_val INTEGER;
  existing_id UUID;
  created_count INTEGER := 0;
  updated_count INTEGER := 0;
  first_ready UUID;
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
    versions_created := 0; versions_updated := 0; active_version := NULL;
    RETURN NEXT;
    RETURN;
  END IF;

  clip_idx := 0;
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
    -- Fix: Suno returns duration as a float (e.g. "210.2"); round then cast to int.
    duration_val := CASE
      WHEN NULLIF(clip->>'duration','') IS NULL THEN NULL
      ELSE round((clip->>'duration')::numeric)::int
    END;

    IF audio IS NULL THEN
      clip_idx := clip_idx + 1;
      CONTINUE;
    END IF;

    SELECT id INTO existing_id
      FROM public.track_versions
      WHERE track_id = task_row.track_id AND clip_index = clip_idx
      LIMIT 1;

    IF existing_id IS NULL THEN
      INSERT INTO public.track_versions
        (track_id, clip_index, version_label, audio_url, cover_url,
         duration_seconds, is_primary, version_type, source_type, metadata)
      VALUES (
        task_row.track_id, clip_idx,
        CASE clip_idx WHEN 0 THEN 'A' WHEN 1 THEN 'B' ELSE chr(65 + clip_idx) END,
        audio, cover, duration_val, clip_idx = 0, 'original', 'suno',
        jsonb_build_object('rebuilt_at', now(), 'from_task', p_task_id)
      );
      created_count := created_count + 1;
    ELSE
      UPDATE public.track_versions
        SET audio_url = COALESCE(NULLIF(audio_url,''), audio),
            cover_url = COALESCE(NULLIF(cover_url,''), cover),
            duration_seconds = COALESCE(duration_seconds, duration_val),
            metadata = COALESCE(metadata, '{}'::jsonb)
                       || jsonb_build_object('rebuilt_at', now())
        WHERE id = existing_id
          AND (audio_url IS NULL OR audio_url = ''
               OR cover_url IS NULL OR cover_url = ''
               OR duration_seconds IS NULL);
      IF FOUND THEN updated_count := updated_count + 1; END IF;
    END IF;

    clip_idx := clip_idx + 1;
  END LOOP;

  SELECT id INTO first_ready
    FROM public.track_versions
    WHERE track_id = task_row.track_id
      AND audio_url IS NOT NULL AND audio_url <> ''
    ORDER BY clip_index ASC
    LIMIT 1;

  IF first_ready IS NOT NULL THEN
    UPDATE public.tracks
       SET active_version_id = first_ready,
           audio_url = COALESCE(NULLIF(audio_url,''), (SELECT audio_url FROM public.track_versions WHERE id = first_ready)),
           cover_url = COALESCE(NULLIF(cover_url,''), (SELECT cover_url FROM public.track_versions WHERE id = first_ready)),
           duration_seconds = COALESCE(duration_seconds, (SELECT duration_seconds FROM public.track_versions WHERE id = first_ready)),
           status = 'completed'
     WHERE id = task_row.track_id;
  END IF;

  versions_created := created_count;
  versions_updated := updated_count;
  active_version := first_ready;
  RETURN NEXT;
END;
$function$;