-- Sprint 010 - Phase 1: Add AI Assistant support for guided music generation
-- This migration creates tables for AI Assistant suggestions and generation history

-- Create prompt_suggestions table for AI Assistant
CREATE TABLE IF NOT EXISTS prompt_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'style', 'mood', 'instrument', 'genre', 'prompt_template'
  style TEXT, -- Which music style this suggestion is for (nullable for general suggestions)
  tags TEXT[], -- Array of tags for filtering
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for suggestion queries
CREATE INDEX IF NOT EXISTS idx_prompt_suggestions_category ON prompt_suggestions(category);
CREATE INDEX IF NOT EXISTS idx_prompt_suggestions_style ON prompt_suggestions(style);
CREATE INDEX IF NOT EXISTS idx_prompt_suggestions_usage_count ON prompt_suggestions(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_suggestions_tags ON prompt_suggestions USING GIN(tags);

-- Create user_generation_history table to track generation attempts
CREATE TABLE IF NOT EXISTS user_generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
  generation_params JSONB NOT NULL, -- Store all generation parameters
  ai_suggestions_used TEXT[], -- Which AI suggestions were applied
  success BOOLEAN DEFAULT NULL, -- NULL = pending, TRUE = success, FALSE = failed
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for history queries
CREATE INDEX IF NOT EXISTS idx_generation_history_user_id ON user_generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_created_at ON user_generation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_history_success ON user_generation_history(success);

-- Enable RLS on prompt_suggestions (read-only for authenticated users)
ALTER TABLE prompt_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view suggestions"
ON prompt_suggestions FOR SELECT
TO authenticated
USING (is_active = TRUE);

-- Only admins can modify suggestions (implement admin check in application)
CREATE POLICY "Admins can manage suggestions"
ON prompt_suggestions FOR ALL
TO authenticated
USING (false) -- Will be overridden by application-level admin check
WITH CHECK (false);

-- Enable RLS on user_generation_history
ALTER TABLE user_generation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generation history"
ON user_generation_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generation history"
ON user_generation_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generation history"
ON user_generation_history FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE prompt_suggestions IS 'AI-powered suggestions for music generation prompts';
COMMENT ON TABLE user_generation_history IS 'Track user generation attempts for AI Assistant learning';
COMMENT ON COLUMN prompt_suggestions.category IS 'Type of suggestion: style, mood, instrument, genre, prompt_template';
COMMENT ON COLUMN prompt_suggestions.usage_count IS 'Number of times this suggestion was used';
COMMENT ON COLUMN user_generation_history.generation_params IS 'Complete generation parameters as JSON for replay';
COMMENT ON COLUMN user_generation_history.ai_suggestions_used IS 'Array of suggestion IDs that were applied';

-- Insert some initial prompt suggestions for common styles
INSERT INTO prompt_suggestions (text, description, category, style, tags) VALUES
  ('upbeat and energetic', 'Perfect for high-energy tracks', 'mood', NULL, ARRAY['upbeat', 'energy', 'positive']),
  ('melancholic and emotional', 'For emotional, sad tracks', 'mood', NULL, ARRAY['sad', 'emotional', 'melancholic']),
  ('aggressive and powerful', 'Heavy, intense tracks', 'mood', NULL, ARRAY['aggressive', 'intense', 'powerful']),
  ('chill and relaxed', 'For calm, ambient tracks', 'mood', NULL, ARRAY['chill', 'relaxed', 'calm']),
  ('epic and cinematic', 'For dramatic, cinematic feel', 'mood', NULL, ARRAY['epic', 'cinematic', 'dramatic']),
  ('heavy distorted guitars', 'Classic rock/metal instrument', 'instrument', 'Rock', ARRAY['guitar', 'distortion', 'rock']),
  ('smooth jazz saxophone', 'Smooth jazz instrument', 'instrument', 'Jazz', ARRAY['saxophone', 'jazz', 'smooth']),
  ('powerful orchestral strings', 'Classical/cinematic strings', 'instrument', 'Classical', ARRAY['strings', 'orchestral', 'classical']),
  ('driving bassline', 'Strong bass presence', 'instrument', NULL, ARRAY['bass', 'groove', 'rhythm']),
  ('layered synthesizers', 'Electronic synth layers', 'instrument', 'Electronic', ARRAY['synth', 'electronic', 'layered'])
ON CONFLICT DO NOTHING;
