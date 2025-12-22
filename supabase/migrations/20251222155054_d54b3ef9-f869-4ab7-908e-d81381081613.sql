-- Feature permissions table for granular access control
CREATE TABLE IF NOT EXISTS public.feature_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  name JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  min_tier TEXT NOT NULL DEFAULT 'pro',
  is_admin_only BOOLEAN DEFAULT false,
  credits_per_use INTEGER DEFAULT 0,
  daily_limit INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_permissions ENABLE ROW LEVEL SECURITY;

-- Anyone can read feature permissions (needed for UI gating)
CREATE POLICY "Anyone can view feature permissions"
ON public.feature_permissions FOR SELECT
USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage feature permissions"
ON public.feature_permissions FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert initial feature permissions
INSERT INTO public.feature_permissions (feature_key, name, description, min_tier, is_admin_only, credits_per_use) VALUES
  ('model_v4', '{"ru": "Модель V4", "en": "Model V4"}', 'Базовая модель генерации', 'free', false, 10),
  ('model_v4_5all', '{"ru": "V4.5 (все)", "en": "V4.5 All"}', 'Модель V4.5 все версии', 'free', false, 12),
  ('model_v4_5plus', '{"ru": "V4.5+", "en": "V4.5+"}', 'Улучшенная модель V4.5', 'pro', false, 15),
  ('model_v5', '{"ru": "Модель V5", "en": "Model V5"}', 'Новейшая модель генерации', 'pro', false, 20),
  ('stem_separation_basic', '{"ru": "Разделение на стемы (базовое)", "en": "Stem Separation (Basic)"}', 'Разделение на 2 стема', 'free', false, 5),
  ('stem_separation_detailed', '{"ru": "Детальное разделение стемов", "en": "Detailed Stem Separation"}', 'Разделение на 4-6 стемов', 'pro', false, 15),
  ('section_replace', '{"ru": "Замена секций", "en": "Section Replace"}', 'Замена частей трека', 'premium', false, 25),
  ('midi_transcription', '{"ru": "Транскрипция MIDI", "en": "MIDI Transcription"}', 'Преобразование в MIDI', 'pro', false, 10),
  ('guitar_studio', '{"ru": "Guitar Studio", "en": "Guitar Studio"}', 'Студия записи гитары', 'basic', false, 0),
  ('prompt_dj', '{"ru": "PromptDJ Mixer", "en": "PromptDJ Mixer"}', 'AI микширование промптов', 'pro', false, 5),
  ('lyrics_ai_agent', '{"ru": "AI агент текстов", "en": "Lyrics AI Agent"}', 'ИИ помощник для текстов', 'basic', false, 3),
  ('vocal_recording', '{"ru": "Запись вокала", "en": "Vocal Recording"}', 'Запись и обработка вокала', 'free', false, 0),
  ('mastering', '{"ru": "Мастеринг", "en": "Mastering"}', 'Автоматический мастеринг', 'premium', false, 20),
  ('api_access', '{"ru": "API доступ", "en": "API Access"}', 'Доступ к API', 'enterprise', false, 0)
ON CONFLICT (feature_key) DO NOTHING;

-- Add allowed_features column to subscription_tiers if not exists
ALTER TABLE public.subscription_tiers 
ADD COLUMN IF NOT EXISTS allowed_features TEXT[] DEFAULT '{}';

-- Update tiers with allowed features
UPDATE public.subscription_tiers SET allowed_features = ARRAY[
  'model_v4', 'model_v4_5all', 'stem_separation_basic', 'vocal_recording'
] WHERE code = 'free';

UPDATE public.subscription_tiers SET allowed_features = ARRAY[
  'model_v4', 'model_v4_5all', 'stem_separation_basic', 'vocal_recording',
  'guitar_studio', 'lyrics_ai_agent'
] WHERE code = 'basic';

UPDATE public.subscription_tiers SET allowed_features = ARRAY[
  'model_v4', 'model_v4_5all', 'model_v4_5plus', 'model_v5',
  'stem_separation_basic', 'stem_separation_detailed',
  'midi_transcription', 'guitar_studio', 'prompt_dj', 
  'lyrics_ai_agent', 'vocal_recording'
] WHERE code = 'pro';

UPDATE public.subscription_tiers SET allowed_features = ARRAY[
  'model_v4', 'model_v4_5all', 'model_v4_5plus', 'model_v5',
  'stem_separation_basic', 'stem_separation_detailed',
  'section_replace', 'midi_transcription', 'guitar_studio', 
  'prompt_dj', 'lyrics_ai_agent', 'vocal_recording', 'mastering'
] WHERE code = 'premium';

UPDATE public.subscription_tiers SET allowed_features = ARRAY[
  'model_v4', 'model_v4_5all', 'model_v4_5plus', 'model_v5',
  'stem_separation_basic', 'stem_separation_detailed',
  'section_replace', 'midi_transcription', 'guitar_studio', 
  'prompt_dj', 'lyrics_ai_agent', 'vocal_recording', 'mastering', 'api_access'
] WHERE code = 'enterprise';

-- Fix telegram menu items emoji duplication - remove emoji from titles
UPDATE public.telegram_menu_items 
SET title = regexp_replace(title, '^[🎵⭐💎👑🏢\s]+', '')
WHERE parent_key = 'tariffs' OR menu_key LIKE 'tariff_%';