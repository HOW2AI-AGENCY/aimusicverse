-- Create feature_flags table for dynamic feature management
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL DEFAULT 'general',
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  min_tier TEXT DEFAULT 'free',
  is_admin_only BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Anyone can read feature flags
CREATE POLICY "Anyone can read feature flags"
ON public.feature_flags FOR SELECT
USING (true);

-- Only admins can update feature flags
CREATE POLICY "Admins can manage feature flags"
ON public.feature_flags FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_feature_flags_key ON public.feature_flags(key);
CREATE INDEX idx_feature_flags_category ON public.feature_flags(category);

-- Insert initial feature flags from app.config.ts
INSERT INTO public.feature_flags (key, name, description, icon, enabled, category) VALUES
  ('musicGeneration', 'Генерация музыки', 'AI создаёт уникальные треки по вашему описанию', '🎵', true, 'core'),
  ('stemSeparation', 'Разделение на стемы', 'Разделите любой трек на отдельные инструменты', '🎚️', true, 'studio'),
  ('guitarStudio', 'Гитарная студия', 'Анализ и транскрипция гитарных партий', '🎸', true, 'studio'),
  ('lyricsStudio', 'Студия текстов', 'AI-помощник для написания текстов песен', '📝', true, 'studio'),
  ('vocalRecording', 'Запись вокала', 'Записывайте вокал прямо в приложении', '🎤', true, 'studio'),
  ('gamification', 'Геймификация', 'Достижения, уровни и награды', '🏆', true, 'engagement'),
  ('socialFeatures', 'Социальные функции', 'Подписки, лайки и комментарии', '👥', true, 'engagement'),
  ('midiTranscription', 'MIDI транскрипция', 'Конвертация аудио в MIDI-формат', '🎹', false, 'studio'),
  ('advancedMastering', 'Мастеринг', 'Профессиональная обработка треков', '🔊', false, 'studio'),
  ('aiMixing', 'AI Микширование', 'Автоматическое сведение треков', '🎛️', false, 'studio'),
  ('cloudCollaboration', 'Облачная коллаборация', 'Совместная работа над проектами', '☁️', false, 'collaboration'),
  ('mobileRecording', 'Мобильная запись', 'Профессиональная запись с телефона', '📱', false, 'studio'),
  ('liveStreaming', 'Прямые трансляции', 'Стримы и живые выступления', '📺', false, 'engagement')
ON CONFLICT (key) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();