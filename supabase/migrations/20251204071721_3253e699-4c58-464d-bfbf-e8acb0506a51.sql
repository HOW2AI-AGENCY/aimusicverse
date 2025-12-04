-- Phase 1: Security fixes for profiles and track_likes

-- Add is_public column to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Drop and recreate profiles SELECT policy with proper restrictions
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON public.profiles;
CREATE POLICY "Users can view own or public profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() = user_id 
    OR is_public = true
  );

-- Drop and recreate track_likes SELECT policy with proper restrictions  
DROP POLICY IF EXISTS "Users can view all likes" ON public.track_likes;
CREATE POLICY "Users can view own likes or likes on public tracks" ON public.track_likes
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM tracks 
      WHERE tracks.id = track_likes.track_id 
      AND (tracks.user_id = auth.uid() OR tracks.is_public = true)
    )
  );