
-- ============================================================
-- Presets: mixer/effects presets (user + system + public)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('vocal','guitar','drums','bass','mastering','fx','custom')),
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT presets_user_or_system CHECK (
    (is_system = true AND user_id IS NULL) OR (is_system = false AND user_id IS NOT NULL)
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.presets TO authenticated;
GRANT ALL ON public.presets TO service_role;

ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;

-- Read: own presets, system presets, or public presets
CREATE POLICY "Presets are readable by owner, system or public"
  ON public.presets FOR SELECT
  TO authenticated
  USING (
    is_system = true
    OR is_public = true
    OR user_id = auth.uid()
  );

-- Insert: only own, non-system
CREATE POLICY "Users insert own presets"
  ON public.presets FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND is_system = false
  );

-- Update: only own, non-system, and cannot elevate to system
CREATE POLICY "Users update own presets"
  ON public.presets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND is_system = false)
  WITH CHECK (user_id = auth.uid() AND is_system = false);

-- Delete: only own, non-system
CREATE POLICY "Users delete own presets"
  ON public.presets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND is_system = false);

CREATE INDEX IF NOT EXISTS presets_user_id_idx ON public.presets (user_id);
CREATE INDEX IF NOT EXISTS presets_category_idx ON public.presets (category);
CREATE INDEX IF NOT EXISTS presets_usage_count_idx ON public.presets (usage_count DESC);

-- updated_at trigger (reuse existing helper if present)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND pronamespace = 'public'::regnamespace) THEN
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $fn$
    BEGIN NEW.updated_at = now(); RETURN NEW; END;
    $fn$;
  END IF;
END $$;

DROP TRIGGER IF EXISTS presets_set_updated_at ON public.presets;
CREATE TRIGGER presets_set_updated_at
  BEFORE UPDATE ON public.presets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RPC: increment_preset_usage (atomic, bypasses RLS for counter)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_preset_usage(preset_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.presets
     SET usage_count = usage_count + 1
   WHERE id = preset_id
     AND (is_system = true OR is_public = true OR user_id = auth.uid());
END;
$$;

REVOKE ALL ON FUNCTION public.increment_preset_usage(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_preset_usage(UUID) TO authenticated;

-- ============================================================
-- RPC: apply_preset_to_track — returns settings JSON to apply client-side
-- (server-side application is a UI concern; keep this thin & auditable)
-- ============================================================
CREATE OR REPLACE FUNCTION public.apply_preset_to_track(track_id UUID, preset_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings JSONB;
  v_owner UUID;
BEGIN
  -- Verify caller owns the track
  SELECT user_id INTO v_owner FROM public.tracks WHERE id = track_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Track not found';
  END IF;
  IF v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to modify this track';
  END IF;

  -- Fetch preset settings (respects visibility)
  SELECT settings INTO v_settings
    FROM public.presets
   WHERE id = preset_id
     AND (is_system = true OR is_public = true OR user_id = auth.uid());

  IF v_settings IS NULL THEN
    RAISE EXCEPTION 'Preset not accessible';
  END IF;

  -- Increment usage counter
  UPDATE public.presets SET usage_count = usage_count + 1 WHERE id = preset_id;

  RETURN v_settings;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_preset_to_track(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_preset_to_track(UUID, UUID) TO authenticated;

-- ============================================================
-- Keyboard shortcuts: JSONB column on profiles
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS keyboard_shortcuts JSONB NOT NULL DEFAULT '{}'::jsonb;
