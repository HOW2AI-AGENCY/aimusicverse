
-- Backfill stuck track de64a7c2 (Глубокий Бас): clips exist in generation_tasks but versions/audio were never persisted.
DO $$
DECLARE
  v_track_id uuid := 'de64a7c2-2864-42fc-9635-17187ac9c2b2';
  v_audio_a text := 'https://cdn1.suno.ai/64f06c91-522d-44ce-b126-10c9c1204ccb.mp3';
  v_cover_a text := 'https://cdn2.suno.ai/image_64f06c91-522d-44ce-b126-10c9c1204ccb.jpeg';
  v_audio_b text := 'https://cdn1.suno.ai/b1a734fb-ffec-421c-ab08-1e666d2df515.mp3';
  v_cover_b text := 'https://cdn2.suno.ai/image_b1a734fb-ffec-421c-ab08-1e666d2df515.jpeg';
  v_version_a uuid;
BEGIN
  -- Version A
  INSERT INTO public.track_versions (track_id, audio_url, cover_url, duration_seconds, version_type, version_label, clip_index, is_primary, metadata)
  SELECT v_track_id, v_audio_a, v_cover_a, 171, 'initial', 'A', 0, true,
         jsonb_build_object('suno_id','64f06c91-522d-44ce-b126-10c9c1204ccb','recovered',true,'title','Глубокий Бас')
  WHERE NOT EXISTS (SELECT 1 FROM public.track_versions WHERE track_id = v_track_id AND version_label = 'A')
  RETURNING id INTO v_version_a;

  -- Version B
  INSERT INTO public.track_versions (track_id, audio_url, cover_url, duration_seconds, version_type, version_label, clip_index, is_primary, metadata)
  SELECT v_track_id, v_audio_b, v_cover_b, 186, 'original', 'B', 1, false,
         jsonb_build_object('suno_id','b1a734fb-ffec-421c-ab08-1e666d2df515','recovered',true,'title','Глубокий Бас')
  WHERE NOT EXISTS (SELECT 1 FROM public.track_versions WHERE track_id = v_track_id AND version_label = 'B');

  -- Main track row
  UPDATE public.tracks
     SET audio_url = v_audio_a,
         streaming_url = v_audio_a,
         cover_url = v_cover_a,
         duration_seconds = 171,
         suno_id = '64f06c91-522d-44ce-b126-10c9c1204ccb',
         status = 'completed',
         active_version_id = COALESCE(active_version_id, v_version_a,
           (SELECT id FROM public.track_versions WHERE track_id = v_track_id AND version_label = 'A' LIMIT 1))
   WHERE id = v_track_id;
END $$;
