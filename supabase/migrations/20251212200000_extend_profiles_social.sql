-- Migration: Extend profiles table for social features
-- Sprint 011 - Task T001
-- Created: 2025-12-12

-- Add social feature columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS privacy_level text DEFAULT 'public' NOT NULL CHECK (privacy_level IN ('public', 'followers', 'private')),
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS stats_followers integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS stats_following integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS stats_tracks integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS stats_likes_received integer DEFAULT 0 NOT NULL;

-- Add constraints
ALTER TABLE public.profiles
  ADD CONSTRAINT display_name_length CHECK (char_length(display_name) <= 50),
  ADD CONSTRAINT bio_length CHECK (char_length(bio) <= 500);

-- Create index for public profiles search
CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON public.profiles(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name) WHERE display_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.profiles.display_name IS 'User display name (max 50 chars)';
COMMENT ON COLUMN public.profiles.bio IS 'User bio/description (max 500 chars)';
COMMENT ON COLUMN public.profiles.avatar_url IS 'Profile avatar image URL';
COMMENT ON COLUMN public.profiles.banner_url IS 'Profile banner image URL';
COMMENT ON COLUMN public.profiles.is_verified IS 'Verified artist badge';
COMMENT ON COLUMN public.profiles.is_public IS 'Profile visibility to public';
COMMENT ON COLUMN public.profiles.privacy_level IS 'Privacy level: public, followers, private';
COMMENT ON COLUMN public.profiles.social_links IS 'Social media links (Instagram, Twitter, etc.)';
COMMENT ON COLUMN public.profiles.stats_followers IS 'Number of followers';
COMMENT ON COLUMN public.profiles.stats_following IS 'Number of users being followed';
COMMENT ON COLUMN public.profiles.stats_tracks IS 'Number of tracks created';
COMMENT ON COLUMN public.profiles.stats_likes_received IS 'Total likes received on all tracks';
