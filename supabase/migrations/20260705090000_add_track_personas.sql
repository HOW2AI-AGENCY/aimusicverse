-- Add Suno Personas support.
--
-- A Persona is a personalized voice/style anchor that can be reused across
-- generations. Suno exposes it via /api/v1/generate/persona (input: a single
-- track's audio_url) and returns a reusable suno_persona_id that subsequent
-- /api/v1/generate calls accept in their `personaId` field.
--
-- Storage rules:
--  - One persona row per (user, suno_persona_id) — same Suno persona can't
--    be imported twice by one user.
--  - A persona's generated audio is captured by Suno into a track_version
--    of an existing track — we link that on `source_track_id` so the user
--    can re-generate from the same anchor.
--  - A track_version optionally inherits a persona (`persona_id`) so future
--    generations can be "in the persona of this version". Nullable — keeps
--    every existing row valid.

-- 1. New table: track_personas
CREATE TABLE IF NOT EXISTS public.track_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Suno's persona identifier returned from /api/v1/generate/persona.
  -- Bound unique per user so re-importing the same Suno persona is a no-op.
  suno_persona_id text NOT NULL,
  name text NOT NULL,
  description text,
  -- Reference audio (Suno may return an image_url for avatar display).
  audio_url text,
  image_url text,
  -- The track this persona was created from — keeping the lineage makes it
  -- possible to clone a track's exact voice/style later from the UI.
  source_track_id uuid REFERENCES public.tracks(id) ON DELETE SET NULL,
  -- Optional Suno task id for status polling.
  suno_task_id text,
  -- pending | ready | failed
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT track_personas_user_suno_unique UNIQUE (user_id, suno_persona_id)
);

CREATE INDEX IF NOT EXISTS idx_track_personas_user
  ON public.track_personas(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_track_personas_source_track
  ON public.track_personas(source_track_id)
  WHERE source_track_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_track_personas_status
  ON public.track_personas(status)
  WHERE status <> 'ready';

COMMENT ON TABLE public.track_personas IS
  'User-owned Suno persona anchors; one row per (user, suno_persona_id).';
COMMENT ON COLUMN public.track_personas.suno_persona_id IS
  'Identifier returned by Suno API /api/v1/generate/persona — passed back to Suno as personaId on subsequent generate calls.';
COMMENT ON COLUMN public.track_personas.status IS
  'pending while Suno processes; ready when callable; failed on terminal error.';

-- 2. Link from track_versions so generations can specify "in the persona of X".
ALTER TABLE public.track_versions
  ADD COLUMN IF NOT EXISTS persona_id uuid REFERENCES public.track_personas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_track_versions_persona
  ON public.track_versions(persona_id)
  WHERE persona_id IS NOT NULL;

COMMENT ON COLUMN public.track_versions.persona_id IS
  'Optional Suno persona that shaped this version — surfaced in UI as "Style: <persona name>".';

-- 3. touch updated_at on row edits
CREATE OR REPLACE FUNCTION public.touch_track_personas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_touch_track_personas_updated_at ON public.track_personas;
CREATE TRIGGER trigger_touch_track_personas_updated_at
  BEFORE UPDATE ON public.track_personas
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_track_personas_updated_at();

-- 4. RLS — same shape as track_likes / track_versions:
--    owner can do everything; everyone else can read persona rows whose
--    source track is public (so public tracks can display "style by persona").
ALTER TABLE public.track_personas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS track_personas_select_own ON public.track_personas;
CREATE POLICY track_personas_select_own ON public.track_personas
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS track_personas_select_public_source ON public.track_personas;
CREATE POLICY track_personas_select_public_source ON public.track_personas
  FOR SELECT USING (
    source_track_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.id = track_personas.source_track_id AND t.is_public = true
    )
  );

DROP POLICY IF EXISTS track_personas_insert_own ON public.track_personas;
CREATE POLICY track_personas_insert_own ON public.track_personas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS track_personas_update_own ON public.track_personas;
CREATE POLICY track_personas_update_own ON public.track_personas
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS track_personas_delete_own ON public.track_personas;
CREATE POLICY track_personas_delete_own ON public.track_personas
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Add a grant for the edge function service role to insert/update rows on
--    behalf of users — same approach already used for other Suno-edge tables.
GRANT ALL ON public.track_personas TO service_role;
