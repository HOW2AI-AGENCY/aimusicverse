-- Fix search_path for update_tag_statistics function
CREATE OR REPLACE FUNCTION update_tag_statistics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.tag_statistics (tag_name, normalized_name, category, usage_count, last_used_at)
  VALUES (NEW.tag_name, NEW.normalized_name, NEW.category, 1, now())
  ON CONFLICT (normalized_name) DO UPDATE SET
    usage_count = public.tag_statistics.usage_count + 1,
    last_used_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix search_path for decrement_tag_statistics function
CREATE OR REPLACE FUNCTION decrement_tag_statistics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tag_statistics 
  SET usage_count = GREATEST(0, usage_count - 1)
  WHERE normalized_name = OLD.normalized_name;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;