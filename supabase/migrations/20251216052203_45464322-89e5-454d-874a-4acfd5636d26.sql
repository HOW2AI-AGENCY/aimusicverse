-- Phase 1: Extend profiles table for Producer Center functionality

-- Add bio field for user biography
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;

-- Add banner_url for profile banner image
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url text;

-- Add social_links as JSONB for flexible social media links
-- Structure: {"instagram": "username", "twitter": "username", "soundcloud": "url", "youtube": "channel", "spotify": "artist_id", "website": "https://..."}
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}';

-- Add pinned content arrays for featured items on profile
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pinned_tracks uuid[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pinned_projects uuid[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pinned_artists uuid[] DEFAULT '{}';

-- Add profile theme customization
-- Structure: {"accentColor": "#8B5CF6", "layout": "default"}
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_theme jsonb DEFAULT '{}';

-- Add profile completeness percentage (0-100)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completeness integer DEFAULT 0;

-- Create function to calculate profile completeness
CREATE OR REPLACE FUNCTION public.calculate_profile_completeness(profile_row profiles)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  score integer := 0;
BEGIN
  -- Basic info (40 points total)
  IF profile_row.first_name IS NOT NULL AND profile_row.first_name != '' THEN
    score := score + 10;
  END IF;
  
  IF profile_row.display_name IS NOT NULL AND profile_row.display_name != '' THEN
    score := score + 10;
  END IF;
  
  IF profile_row.photo_url IS NOT NULL AND profile_row.photo_url != '' THEN
    score := score + 10;
  END IF;
  
  IF profile_row.username IS NOT NULL AND profile_row.username != '' THEN
    score := score + 10;
  END IF;
  
  -- Extended info (30 points total)
  IF profile_row.bio IS NOT NULL AND length(profile_row.bio) > 20 THEN
    score := score + 15;
  END IF;
  
  IF profile_row.banner_url IS NOT NULL AND profile_row.banner_url != '' THEN
    score := score + 15;
  END IF;
  
  -- Social links (30 points total - 5 per link, max 30)
  IF profile_row.social_links IS NOT NULL AND profile_row.social_links != '{}'::jsonb THEN
    score := score + LEAST(jsonb_object_keys_count(profile_row.social_links) * 5, 30);
  END IF;
  
  RETURN LEAST(score, 100);
END;
$$;

-- Helper function to count JSONB object keys
CREATE OR REPLACE FUNCTION public.jsonb_object_keys_count(obj jsonb)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT count(*)::integer FROM jsonb_object_keys(COALESCE(obj, '{}'::jsonb));
$$;

-- Create trigger to auto-update profile completeness on profile changes
CREATE OR REPLACE FUNCTION public.update_profile_completeness()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.profile_completeness := calculate_profile_completeness(NEW);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_profile_completeness ON profiles;
CREATE TRIGGER trigger_update_profile_completeness
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_completeness();

-- Update existing profiles to calculate their completeness
UPDATE profiles SET updated_at = now() WHERE true;