-- Расширение music_projects для детальных визуальных параметров
ALTER TABLE public.music_projects 
ADD COLUMN IF NOT EXISTS color_palette JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS typography_style VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS image_style VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS visual_keywords TEXT[] DEFAULT NULL;

-- Комментарии для полей
COMMENT ON COLUMN public.music_projects.color_palette IS 'JSON с цветовой палитрой: {primary, secondary, accent, background}';
COMMENT ON COLUMN public.music_projects.typography_style IS 'Стиль типографики: modern, classic, handwritten, grunge, minimal';
COMMENT ON COLUMN public.music_projects.image_style IS 'Стиль изображений: photography, illustration, 3d, abstract, collage';
COMMENT ON COLUMN public.music_projects.visual_keywords IS 'Ключевые слова для AI генерации визуалов';

-- Расширение project_tracks для детальных музыкальных параметров
ALTER TABLE public.project_tracks
ADD COLUMN IF NOT EXISTS bpm_target INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS key_signature VARCHAR(10) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS energy_level INTEGER DEFAULT NULL CHECK (energy_level IS NULL OR (energy_level >= 1 AND energy_level <= 10)),
ADD COLUMN IF NOT EXISTS vocal_style VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS instrumental_only BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reference_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS generation_params JSONB DEFAULT NULL;

-- Комментарии для полей project_tracks
COMMENT ON COLUMN public.project_tracks.bpm_target IS 'Целевой BPM для трека (60-200)';
COMMENT ON COLUMN public.project_tracks.key_signature IS 'Тональность: C, Cm, D, Dm, etc.';
COMMENT ON COLUMN public.project_tracks.energy_level IS 'Уровень энергии 1-10';
COMMENT ON COLUMN public.project_tracks.vocal_style IS 'Стиль вокала: male, female, duet, choir, auto';
COMMENT ON COLUMN public.project_tracks.instrumental_only IS 'Инструментал без вокала';
COMMENT ON COLUMN public.project_tracks.reference_url IS 'URL референсного трека';
COMMENT ON COLUMN public.project_tracks.generation_params IS 'Дополнительные параметры генерации';

-- Индекс для фильтрации по параметрам
CREATE INDEX IF NOT EXISTS idx_project_tracks_energy ON public.project_tracks(energy_level) WHERE energy_level IS NOT NULL;