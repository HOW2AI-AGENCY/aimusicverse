
-- Sprint 053-A1: sound_effects table
CREATE TABLE IF NOT EXISTS public.sound_effects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suno_task_id    text UNIQUE,
  prompt          text NOT NULL,
  audio_url       text,
  image_url       text,
  duration        numeric(8, 2),
  tempo           integer,
  key             text,
  model           text NOT NULL DEFAULT 'V5',
  status          text NOT NULL DEFAULT 'processing'
                  CHECK (status IN ('processing', 'completed', 'failed')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sound_effects TO authenticated;
GRANT ALL ON public.sound_effects TO service_role;

ALTER TABLE public.sound_effects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own sound effects" ON public.sound_effects;
CREATE POLICY "Users manage own sound effects"
  ON public.sound_effects
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS sound_effects_user_id_idx
  ON public.sound_effects(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sound_effects_status_idx
  ON public.sound_effects(status) WHERE status = 'processing';

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sound_effects_updated_at ON public.sound_effects;
CREATE TRIGGER trg_sound_effects_updated_at
  BEFORE UPDATE ON public.sound_effects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sprint 053-A3: MIDI provenance on track_versions
ALTER TABLE public.track_versions
  ADD COLUMN IF NOT EXISTS midi_url text,
  ADD COLUMN IF NOT EXISTS midi_generation_source text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'track_versions_midi_generation_source_check'
  ) THEN
    ALTER TABLE public.track_versions
      ADD CONSTRAINT track_versions_midi_generation_source_check
      CHECK (midi_generation_source IN ('suno', 'replicate'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_track_versions_midi_source
  ON public.track_versions (midi_generation_source)
  WHERE midi_generation_source IS NOT NULL;

COMMENT ON COLUMN public.track_versions.midi_url IS
  'Storage URL of the generated MIDI file. NULL = no MIDI generated yet.';
COMMENT ON COLUMN public.track_versions.midi_generation_source IS
  'Provider that generated this MIDI: suno or replicate. NULL if not yet generated.';

-- Storage RLS for midi bucket
DROP POLICY IF EXISTS "Authenticated users can read midi files" ON storage.objects;
CREATE POLICY "Authenticated users can read midi files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'midi');

DROP POLICY IF EXISTS "Users can upload own midi files" ON storage.objects;
CREATE POLICY "Users can upload own midi files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'midi'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own midi files" ON storage.objects;
CREATE POLICY "Users can delete own midi files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'midi'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
