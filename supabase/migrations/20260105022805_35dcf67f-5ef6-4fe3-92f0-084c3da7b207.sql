-- Таблица связи треков и тегов
CREATE TABLE public.track_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  normalized_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) DEFAULT 'genre',
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(track_id, normalized_name)
);

-- Индексы для быстрого поиска
CREATE INDEX idx_track_tags_track_id ON public.track_tags(track_id);
CREATE INDEX idx_track_tags_normalized ON public.track_tags(normalized_name);
CREATE INDEX idx_track_tags_category ON public.track_tags(category);

-- GIN индекс для полнотекстового поиска
CREATE INDEX idx_track_tags_search ON public.track_tags USING gin(to_tsvector('simple', tag_name));

-- RLS политики
ALTER TABLE public.track_tags ENABLE ROW LEVEL SECURITY;

-- Публичное чтение
CREATE POLICY "Anyone can read track tags" ON public.track_tags
  FOR SELECT USING (true);

-- Автор трека может управлять тегами
CREATE POLICY "Track owner can manage tags" ON public.track_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM tracks WHERE tracks.id = track_id AND tracks.user_id = auth.uid())
  );

-- Агрегированная таблица популярных тегов
CREATE TABLE public.tag_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name VARCHAR(100) NOT NULL UNIQUE,
  normalized_name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) DEFAULT 'genre',
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы
CREATE INDEX idx_tag_stats_usage ON public.tag_statistics(usage_count DESC);
CREATE INDEX idx_tag_stats_category ON public.tag_statistics(category);

-- RLS
ALTER TABLE public.tag_statistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tag statistics" ON public.tag_statistics FOR SELECT USING (true);

-- Функция автоматического обновления статистики
CREATE OR REPLACE FUNCTION update_tag_statistics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tag_statistics (tag_name, normalized_name, category, usage_count, last_used_at)
  VALUES (NEW.tag_name, NEW.normalized_name, NEW.category, 1, now())
  ON CONFLICT (normalized_name) DO UPDATE SET
    usage_count = tag_statistics.usage_count + 1,
    last_used_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_tag_stats
  AFTER INSERT ON track_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_statistics();

-- Функция уменьшения статистики при удалении
CREATE OR REPLACE FUNCTION decrement_tag_statistics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tag_statistics 
  SET usage_count = GREATEST(0, usage_count - 1)
  WHERE normalized_name = OLD.normalized_name;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_decrement_tag_stats
  AFTER DELETE ON track_tags
  FOR EACH ROW EXECUTE FUNCTION decrement_tag_statistics();