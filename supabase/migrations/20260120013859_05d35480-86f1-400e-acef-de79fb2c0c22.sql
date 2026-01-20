-- Phase 1.1: Synchronize economy_config with real prices from sunoapi.org

-- Remove old outdated STEM_SEPARATION_COST
DELETE FROM public.economy_config WHERE key = 'STEM_SEPARATION_COST';

-- Insert new correct values
INSERT INTO public.economy_config (key, value, description, updated_at)
VALUES 
  ('STEM_SEPARATION_SIMPLE_COST', '10', 'Cost for simple stem separation (2 stems: vocal + instrumental)', now()),
  ('STEM_SEPARATION_DETAILED_COST', '50', 'Cost for detailed stem separation (12+ stems)', now()),
  ('REPLACE_SECTION_COST', '5', 'Cost for replacing a section in track', now()),
  ('GENERATION_COST_V5', '12', 'Generation cost for V5/V4.5+ models', now()),
  ('GENERATION_COST_V4', '10', 'Generation cost for V4/V3.5 models', now()),
  ('COVER_GENERATION_COST', '10', 'Cost for creating a cover version', now()),
  ('EXTEND_GENERATION_COST', '10', 'Cost for extending a track', now())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();